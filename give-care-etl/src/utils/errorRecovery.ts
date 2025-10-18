/**
 * Error Recovery Utilities
 *
 * Exponential backoff, circuit breaker, and retry logic
 */

import { createLogger } from './logger';

const logger = createLogger({ module: 'error-recovery' });

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

/**
 * Exponential backoff retry with jitter
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'rate_limit_exceeded'],
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.info('Executing with retry', { attempt, maxRetries });
      return await fn();

    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable = retryableErrors.some(errType =>
        lastError?.message?.includes(errType)
      );

      if (!isRetryable || attempt >= maxRetries) {
        logger.error('Max retries reached or non-retryable error', {
          attempt,
          error: lastError,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      // Add random jitter (±25%)
      const jitter = baseDelay * 0.25 * (Math.random() - 0.5);
      const delay = Math.round(baseDelay + jitter);

      logger.warn('Retrying after delay', {
        attempt,
        delayMs: delay,
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Circuit Breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private options: CircuitBreakerOptions = {}) {
    this.options.failureThreshold = options.failureThreshold || 5;
    this.options.resetTimeoutMs = options.resetTimeoutMs || 60000; // 1 minute
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should reset
    if (
      this.state === 'open' &&
      Date.now() - this.lastFailureTime > this.options.resetTimeoutMs!
    ) {
      logger.info('Circuit breaker transitioning to half-open');
      this.state = 'half-open';
      this.failureCount = 0;
    }

    // If circuit is open, reject immediately
    if (this.state === 'open') {
      logger.error('Circuit breaker is open, rejecting request');
      throw new Error('Circuit breaker is OPEN - too many failures');
    }

    try {
      const result = await fn();

      // Success - reset failure count if in half-open state
      if (this.state === 'half-open') {
        logger.info('Circuit breaker closing after successful test');
        this.state = 'closed';
        this.failureCount = 0;
      }

      return result;

    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      logger.warn('Circuit breaker recorded failure', {
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
      });

      // Open circuit if threshold exceeded
      if (this.failureCount >= this.options.failureThreshold!) {
        logger.error('Circuit breaker opening due to failures', {
          failureCount: this.failureCount,
        });
        this.state = 'open';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker manually reset');
  }
}

/**
 * Partial completion - process items and collect results/errors
 */
export async function executeWithPartialCompletion<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<{
  successful: R[];
  failed: Array<{ item: T; error: Error }>;
  successRate: number;
}> {
  logger.info('Executing with partial completion', { totalItems: items.length });

  const results = await Promise.allSettled(
    items.map(item => fn(item))
  );

  const successful: R[] = [];
  const failed: Array<{ item: T; error: Error }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({
        item: items[index],
        error: result.reason,
      });
    }
  });

  const successRate = (successful.length / items.length) * 100;

  logger.info('Partial completion results', {
    successful: successful.length,
    failed: failed.length,
    successRate: `${successRate.toFixed(1)}%`,
  });

  return {
    successful,
    failed,
    successRate,
  };
}

/**
 * Model fallback - try nano, then mini, then full
 */
export async function executeWithModelFallback<T>(
  models: string[],
  fn: (model: string) => Promise<T>
): Promise<{ result: T; modelUsed: string }> {
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      logger.info('Attempting with model', { model });
      const result = await fn(model);
      logger.info('Model succeeded', { model });

      return { result, modelUsed: model };

    } catch (error) {
      lastError = error as Error;
      logger.warn('Model failed, trying next', {
        model,
        error: lastError.message,
      });
    }
  }

  logger.error('All models failed', { modelsAttempted: models });
  throw lastError || new Error('All model fallbacks failed');
}

/**
 * Dead Letter Queue for failed items
 */
export class DeadLetterQueue<T> {
  private queue: Array<{ item: T; error: Error; timestamp: number }> = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  add(item: T, error: Error) {
    logger.warn('Adding item to dead letter queue', {
      queueSize: this.queue.length,
      error: error.message,
    });

    this.queue.push({
      item,
      error,
      timestamp: Date.now(),
    });

    // Trim queue if too large
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }
  }

  getAll() {
    return [...this.queue];
  }

  getRecent(count: number) {
    return this.queue.slice(-count);
  }

  clear() {
    const count = this.queue.length;
    this.queue = [];
    logger.info('Dead letter queue cleared', { itemsCleared: count });
  }

  size() {
    return this.queue.length;
  }
}

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
