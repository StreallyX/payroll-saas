
/**
 * Performance Monitoring Utilities - Phase 10
 * Track and log performance metrics
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Measure async function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: new Date(),
        metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `${name} (error)`,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, error: String(error) },
      });
      
      throw error;
    }
  }

  /**
   * Measure sync function execution time
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: new Date(),
        metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `${name} (error)`,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, error: String(error) },
      });
      
      throw error;
    }
  }

  /**
   * Record a metric manually
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations (>1000ms)
    if (metric.duration > 1000) {
      console.warn(
        `[Performance] Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`,
        metric.metadata
      );
    }
  }

  /**
   * Get performance stats
   */
  getStats(name?: string) {
    const filtered = name
      ? this.metrics.filter((m) => m.name === name)
      : this.metrics;

    if (filtered.length === 0) {
      return null;
    }

    const durations = filtered.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const median = this.getMedian(durations);

    return {
      name,
      count: filtered.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      median: median.toFixed(2),
      total: sum.toFixed(2),
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get median value
   */
  private getMedian(values: number[]): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    return sorted[mid];
  }

  /**
   * Get slow operations (>threshold ms)
   */
  getSlowOperations(threshold = 1000): PerformanceMetric[] {
    return this.metrics.filter((m) => m.duration > threshold);
  }

  /**
   * Get operations by time range
   */
  getMetricsByTimeRange(startDate: Date, endDate: Date): PerformanceMetric[] {
    return this.metrics.filter(
      (m) => m.timestamp >= startDate && m.timestamp <= endDate
    );
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        methodName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
