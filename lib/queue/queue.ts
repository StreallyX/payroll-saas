
/**
 * Background Job Queue System using BullMQ
 * Handles asynchronous task processing
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { logger } from '../logging';

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export interface JobData {
  [key: string]: any;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  /**
   * Create or get a queue
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            count: 100,
            age: 24 * 3600, // 24 hours
          },
          removeOnFail: {
            count: 1000,
            age: 7 * 24 * 3600, // 7 days
          },
        },
      });

      this.queues.set(name, queue);

      // Setup queue events
      const events = new QueueEvents(name, { connection: redisConnection });
      this.queueEvents.set(name, events);

      events.on('completed', ({ jobId }) => {
        logger.debug('Job completed', { queue: name, jobId });
      });

      events.on('failed', ({ jobId, failedReason }) => {
        logger.error('Job failed', { queue: name, jobId, failedReason });
      });
    }

    return this.queues.get(name)!;
  }

  /**
   * Add a job to the queue
   */
  async addJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    
    logger.debug('Adding job to queue', {
      queue: queueName,
      job: jobName,
      data,
    });

    return queue.add(jobName, data, options);
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulk<T extends JobData>(
    queueName: string,
    jobs: Array<{ name: string; data: T; opts?: JobOptions }>
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    
    logger.debug('Adding bulk jobs to queue', {
      queue: queueName,
      count: jobs.length,
    });

    return queue.addBulk(jobs);
  }

  /**
   * Register a worker to process jobs
   */
  registerWorker<T extends JobData, R extends JobResult>(
    queueName: string,
    processor: (job: Job<T>) => Promise<R>,
    options?: {
      concurrency?: number;
      limiter?: {
        max: number;
        duration: number;
      };
    }
  ): Worker<T, R> {
    if (this.workers.has(queueName)) {
      logger.warn('Worker already registered for queue', { queue: queueName });
      return this.workers.get(queueName) as Worker<T, R>;
    }

    const worker = new Worker<T, R>(
      queueName,
      async (job) => {
        logger.debug('Processing job', {
          queue: queueName,
          jobId: job.id,
          jobName: job.name,
        });

        const startTime = Date.now();
        
        try {
          const result = await processor(job);
          const duration = Date.now() - startTime;
          
          logger.info('Job processed successfully', {
            queue: queueName,
            jobId: job.id,
            duration: `${duration}ms`,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.error('Job processing failed', {
            queue: queueName,
            jobId: job.id,
            duration: `${duration}ms`,
            error,
          });

          throw error;
        }
      },
      {
        connection: redisConnection,
        concurrency: options?.concurrency || 5,
        limiter: options?.limiter,
      }
    );

    this.workers.set(queueName, worker as unknown as Worker);

    // Setup worker events
    worker.on('completed', (job) => {
      logger.debug('Worker completed job', {
        queue: queueName,
        jobId: job.id,
      });
    });

    worker.on('failed', (job, error) => {
      logger.error('Worker failed job', {
        queue: queueName,
        jobId: job?.id,
        error,
      });
    });

    return worker;
  }

  /**
   * Get job status
   */
  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Get waiting jobs
   */
  async getWaitingJobs(queueName: string): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getWaiting();
  }

  /**
   * Get active jobs
   */
  async getActiveJobs(queueName: string): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getActive();
  }

  /**
   * Get completed jobs
   */
  async getCompletedJobs(queueName: string): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getCompleted();
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(queueName: string): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getFailed();
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info('Queue paused', { queue: queueName });
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info('Queue resumed', { queue: queueName });
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(
    queueName: string,
    grace: number,
    status?: 'completed' | 'failed'
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.clean(grace, 1000, status);
    logger.info('Queue cleaned', { queue: queueName, grace, status });
  }

  /**
   * Obliterate (remove all jobs)
   */
  async obliterateQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.obliterate();
    logger.warn('Queue obliterated', { queue: queueName });
  }

  /**
   * Close all queues and workers
   */
  async closeAll(): Promise<void> {
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      logger.info('Worker closed', { queue: name });
    }

    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      logger.info('Queue closed', { queue: name });
    }

    for (const [name, events] of this.queueEvents.entries()) {
      await events.close();
      logger.info('Queue events closed', { queue: name });
    }

    this.workers.clear();
    this.queues.clear();
    this.queueEvents.clear();
  }
}

// Singleton instance
export const queueManager = new QueueManager();

// Queue names constants
export const QueueNames = {
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
  NOTIFICATION: 'notification',
  DOCUMENT: 'document',
  PAYROLL: 'payroll',
  REPORT: 'report',
  CLEANUP: 'cleanup',
} as const;

/**
 * Helper function to add a job
 */
export async function addJob<T extends JobData>(
  queueName: string,
  jobName: string,
  data: T,
  options?: JobOptions
): Promise<Job<T>> {
  return queueManager.addJob(queueName, jobName, data, options);
}

/**
 * Helper function to register a worker
 */
export function registerWorker<T extends JobData, R extends JobResult>(
  queueName: string,
  processor: (job: Job<T>) => Promise<R>,
  options?: {
    concurrency?: number;
    limiter?: { max: number; duration: number };
  }
): Worker<T, R> {
  return queueManager.registerWorker(queueName, processor, options);
}
