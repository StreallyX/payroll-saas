
/**
 * Background Job Queue System using BullMQ
 * Handles asynchronous task processing
 * Uses Upstash Redis via TCP endpoint (compatible with BullMQ)
 * 
 * IMPORTANT: BullMQ requires a TCP Redis connection (via ioredis)
 * Get your Upstash TCP endpoint from: https://console.upstash.com/
 * Format: rediss://default:<password>@<host>:<port>
 */

import { Queue, Worker, Job, QueueEvents, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../logging';
import { serviceConfig } from '../config/serviceConfig';

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

/**
 * Get Redis connection for BullMQ using Upstash TCP endpoint
 * Returns IORedis instance or null if not configured
 * 
 * BullMQ requires TCP connection, not REST API
 * - UPSTASH_REDIS_URL: TCP endpoint (rediss://...) - REQUIRED for BullMQ
 * - UPSTASH_REDIS_REST_URL/TOKEN: REST API only - NOT compatible with BullMQ
 */
function getRedisConnection(): IORedis | null {
  // First, try Upstash TCP endpoint (recommended)
  const upstashUrl = process.env.UPSTASH_REDIS_URL;
  
  if (upstashUrl) {
    try {
      // Upstash URL format: rediss://default:<password>@<host>:<port>
      const connection = new IORedis(upstashUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
        family: 0, // Use both IPv4 and IPv6
      });
      
      logger.info('✅ Connected to Upstash Redis via TCP endpoint for BullMQ', {
        endpoint: upstashUrl.substring(0, 30) + '...',
      });
      
      return connection;
    } catch (error) {
      logger.error('Failed to create Upstash Redis connection', { error });
      return null;
    }
  }

  // Check if user has REST credentials but not TCP endpoint
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (restUrl || restToken) {
    logger.warn(
      '⚠️  UPSTASH_REDIS_REST_URL/TOKEN detected, but BullMQ requires TCP endpoint.\n' +
      '   Please add UPSTASH_REDIS_URL (TCP endpoint) from your Upstash Console:\n' +
      '   https://console.upstash.com/ → Your Database → Redis Connect → ioredis\n' +
      '   Format: rediss://default:<password>@<host>:<port>\n' +
      '   Queue system is DISABLED until TCP endpoint is configured.'
    );
    return null;
  }

  // No Redis configuration found
  logger.warn(
    '⚠️  No Upstash Redis configuration found.\n' +
    '   Set UPSTASH_REDIS_URL to enable BullMQ queue system.\n' +
    '   Get it from: https://console.upstash.com/ → Your Database → Redis Connect → ioredis\n' +
    '   Queue system will be disabled - operations will run synchronously.'
  );
  return null;
}

// Redis connection configuration (can be null if not configured)
const redisConnection = getRedisConnection();

class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private isRedisAvailable: boolean;

  constructor() {
    this.isRedisAvailable = redisConnection !== null && serviceConfig.isServiceEnabled('redis');
    
    if (!this.isRedisAvailable) {
      logger.warn(
        '⚠️  Queue system is DISABLED - Background jobs will execute immediately or be skipped. ' +
        'This may impact performance and reliability.'
      );
    }
  }

  /**
   * Check if queues are available
   */
  isAvailable(): boolean {
    return this.isRedisAvailable;
  }

  /**
   * Create or get a queue
   */
  getQueue(name: string): Queue | null {
    if (!this.isRedisAvailable || !redisConnection) {
      logger.warn('Queue system not available', { queue: name });
      return null;
    }

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
   * If Redis is not available, returns a mock job
   */
  async addJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T> | null> {
    if (!this.isRedisAvailable) {
      logger.debug('Queue not available, job will be processed immediately if possible', {
        queue: queueName,
        job: jobName,
      });
      return null;
    }

    const queue = this.getQueue(queueName);
    
    if (!queue) {
      logger.warn('Failed to get queue, job skipped', { queue: queueName, job: jobName });
      return null;
    }
    
    logger.debug('Adding job to queue', {
      queue: queueName,
      job: jobName,
      data,
    });

    return queue.add(jobName, data, options);
  }

  /**
   * Add multiple jobs in bulk
   * If Redis is not available, returns empty array
   */
  async addBulk<T extends JobData>(
    queueName: string,
    jobs: Array<{ name: string; data: T; opts?: JobOptions }>
  ): Promise<Job<T>[]> {
    if (!this.isRedisAvailable) {
      logger.debug('Queue not available, bulk jobs skipped', {
        queue: queueName,
        count: jobs.length,
      });
      return [];
    }

    const queue = this.getQueue(queueName);
    
    if (!queue) {
      logger.warn('Failed to get queue, bulk jobs skipped', { queue: queueName });
      return [];
    }
    
    logger.debug('Adding bulk jobs to queue', {
      queue: queueName,
      count: jobs.length,
    });

    return queue.addBulk(jobs);
  }

  /**
   * Register a worker to process jobs
   * If Redis is not available, returns null
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
  ): Worker<T, R> | null {
    if (!this.isRedisAvailable || !redisConnection) {
      logger.debug('Queue not available, worker not registered', { queue: queueName });
      return null;
    }

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
    if (!this.isRedisAvailable) return undefined;
    const queue = this.getQueue(queueName);
    if (!queue) return undefined;
    return queue.getJob(jobId);
  }

  /**
   * Get waiting jobs
   */
  async getWaitingJobs(queueName: string): Promise<Job[]> {
    if (!this.isRedisAvailable) return [];
    const queue = this.getQueue(queueName);
    if (!queue) return [];
    return queue.getWaiting();
  }

  /**
   * Get active jobs
   */
  async getActiveJobs(queueName: string): Promise<Job[]> {
    if (!this.isRedisAvailable) return [];
    const queue = this.getQueue(queueName);
    if (!queue) return [];
    return queue.getActive();
  }

  /**
   * Get completed jobs
   */
  async getCompletedJobs(queueName: string): Promise<Job[]> {
    if (!this.isRedisAvailable) return [];
    const queue = this.getQueue(queueName);
    if (!queue) return [];
    return queue.getCompleted();
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(queueName: string): Promise<Job[]> {
    if (!this.isRedisAvailable) return [];
    const queue = this.getQueue(queueName);
    if (!queue) return [];
    return queue.getFailed();
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    if (!this.isRedisAvailable) {
      logger.warn('Cannot pause queue, Redis not available', { queue: queueName });
      return;
    }
    const queue = this.getQueue(queueName);
    if (!queue) return;
    await queue.pause();
    logger.info('Queue paused', { queue: queueName });
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    if (!this.isRedisAvailable) {
      logger.warn('Cannot resume queue, Redis not available', { queue: queueName });
      return;
    }
    const queue = this.getQueue(queueName);
    if (!queue) return;
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
    if (!this.isRedisAvailable) {
      logger.warn('Cannot clean queue, Redis not available', { queue: queueName });
      return;
    }
    const queue = this.getQueue(queueName);
    if (!queue) return;
    await queue.clean(grace, 1000, status);
    logger.info('Queue cleaned', { queue: queueName, grace, status });
  }

  /**
   * Obliterate (remove all jobs)
   */
  async obliterateQueue(queueName: string): Promise<void> {
    if (!this.isRedisAvailable) {
      logger.warn('Cannot obliterate queue, Redis not available', { queue: queueName });
      return;
    }
    const queue = this.getQueue(queueName);
    if (!queue) return;
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
 * Returns null if queue system is not available
 */
export async function addJob<T extends JobData>(
  queueName: string,
  jobName: string,
  data: T,
  options?: JobOptions
): Promise<Job<T> | null> {
  return queueManager.addJob(queueName, jobName, data, options);
}

/**
 * Helper function to register a worker
 * Returns null if queue system is not available
 */
export function registerWorker<T extends JobData, R extends JobResult>(
  queueName: string,
  processor: (job: Job<T>) => Promise<R>,
  options?: {
    concurrency?: number;
    limiter?: { max: number; duration: number };
  }
): Worker<T, R> | null {
  return queueManager.registerWorker(queueName, processor, options);
}
