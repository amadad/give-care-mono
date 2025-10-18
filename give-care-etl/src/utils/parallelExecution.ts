/**
 * Parallel Execution Utilities
 *
 * Spawn multiple Durable Objects for parallel processing
 */

import { createLogger } from './logger';

const logger = createLogger({ module: 'parallel-execution' });

export interface ParallelExecutionOptions {
  maxConcurrency?: number;
  timeoutMs?: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Execute tasks in parallel with concurrency control
 */
export async function executeInParallel<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: ParallelExecutionOptions = {}
): Promise<R[]> {
  const {
    maxConcurrency = 10,
    timeoutMs = 30000,
    onProgress,
  } = options;

  logger.info('Starting parallel execution', {
    totalItems: items.length,
    maxConcurrency,
  });

  const results: R[] = [];
  let completed = 0;

  // Create a semaphore for concurrency control
  const semaphore = new Semaphore(maxConcurrency);

  const promises = items.map(async (item, index) => {
    await semaphore.acquire();

    try {
      const result = await withTimeout(
        fn(item, index),
        timeoutMs,
        `Task ${index} timed out after ${timeoutMs}ms`
      );

      completed++;
      if (onProgress) {
        onProgress(completed, items.length);
      }

      return result;

    } finally {
      semaphore.release();
    }
  });

  const settled = await Promise.allSettled(promises);

  // Extract results and log failures
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      logger.error('Parallel task failed', {
        index,
        error: result.reason,
      });
    }
  });

  logger.info('Parallel execution complete', {
    successful: results.length,
    failed: items.length - results.length,
    successRate: `${((results.length / items.length) * 100).toFixed(1)}%`,
  });

  return results;
}

/**
 * Spawn parallel Durable Objects for extraction
 */
export async function spawnExtractionWorkers(
  sources: Array<{ url: string }>,
  env: any,
  options: ParallelExecutionOptions = {}
): Promise<Array<{ url: string; result: any }>> {
  logger.info('Spawning extraction workers', { sourceCount: sources.length });

  return executeInParallel(
    sources,
    async (source) => {
      // Each source gets its own Extraction Durable Object
      const extractionDO = env.EXTRACTION?.get(
        env.EXTRACTION.idFromName(source.url)
      );

      if (!extractionDO) {
        throw new Error('EXTRACTION binding not configured');
      }

      // Call extraction DO
      const response = await extractionDO.fetch(
        new Request(`https://extraction.internal/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source.url }),
        })
      );

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        url: source.url,
        result,
      };
    },
    options
  );
}

/**
 * Batch process with progress updates
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  fn: (batch: T[]) => Promise<R[]>,
  onBatchComplete?: (batchIndex: number, totalBatches: number) => void
): Promise<R[]> {
  const batches: T[][] = [];

  // Split into batches
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  logger.info('Starting batch processing', {
    totalItems: items.length,
    batchSize,
    totalBatches: batches.length,
  });

  const results: R[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batchResults = await fn(batches[i]);
    results.push(...batchResults);

    if (onBatchComplete) {
      onBatchComplete(i + 1, batches.length);
    }

    logger.info('Batch complete', {
      batchIndex: i + 1,
      totalBatches: batches.length,
      itemsProcessed: results.length,
    });
  }

  return results;
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private counter: number;
  private waiting: Array<() => void> = [];

  constructor(private max: number) {
    this.counter = max;
  }

  async acquire() {
    if (this.counter > 0) {
      this.counter--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release() {
    this.counter++;
    const resolve = this.waiting.shift();
    if (resolve) {
      this.counter--;
      resolve();
    }
  }
}

/**
 * Add timeout to promise
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
