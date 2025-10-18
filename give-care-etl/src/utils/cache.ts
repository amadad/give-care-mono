/**
 * Intelligent Caching Layer
 *
 * Uses Durable Object storage for persistent caching with TTL
 */

import { createLogger } from './logger';

const logger = createLogger({ module: 'cache' });

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Cache layer with TTL support
 */
export class CacheLayer {
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(private storage: DurableObjectStorage) {}

  /**
   * Get or compute a cached value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cacheKey = `cache:${key}`;

    // Check cache
    const cached = await this.storage.get<CacheEntry<T>>(cacheKey);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const ttlMs = cached.ttl * 1000;

      if (age < ttlMs) {
        this.stats.hits++;
        logger.info('Cache hit', {
          key,
          age: `${Math.round(age / 1000)}s`,
          ttl: `${ttlSeconds}s`,
        });
        return cached.value;
      }

      // Cache expired
      logger.info('Cache expired', { key, age: `${Math.round(age / 1000)}s` });
    }

    // Cache miss - compute and store
    this.stats.misses++;
    logger.info('Cache miss', { key });

    const value = await compute();

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    };

    await this.storage.put(cacheKey, entry);

    logger.info('Cache stored', { key, ttl: `${ttlSeconds}s` });

    return value;
  }

  /**
   * Get value from cache (no computation)
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = `cache:${key}`;
    const cached = await this.storage.get<CacheEntry<T>>(cacheKey);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    const age = Date.now() - cached.timestamp;
    const ttlMs = cached.ttl * 1000;

    if (age >= ttlMs) {
      // Expired
      this.stats.misses++;
      await this.storage.delete(cacheKey);
      return null;
    }

    this.stats.hits++;
    return cached.value;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const cacheKey = `cache:${key}`;

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    };

    await this.storage.put(cacheKey, entry);
    logger.info('Cache set', { key, ttl: `${ttlSeconds}s` });
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    const cacheKey = `cache:${key}`;
    await this.storage.delete(cacheKey);
    logger.info('Cache invalidated', { key });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const keys = await this.storage.list({ prefix: 'cache:' });
    await Promise.all(
      Array.from(keys.keys()).map(key => this.storage.delete(key))
    );
    logger.info('Cache cleared', { entriesCleared: keys.size });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const keys = await this.storage.list({ prefix: 'cache:' });

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: keys.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

/**
 * Predefined cache TTLs for common use cases
 */
export const CacheTTL = {
  // Source credibility scores (30 days - sources rarely change credibility)
  CREDIBILITY: 30 * 24 * 60 * 60, // 30 days

  // Extraction schemas (7 days - page structures change occasionally)
  SCHEMA: 7 * 24 * 60 * 60, // 7 days

  // Service type mappings (permanent - deterministic mapping)
  SERVICE_MAPPING: 365 * 24 * 60 * 60, // 1 year

  // Phone/URL validations (7 days - revalidate weekly)
  VALIDATION: 7 * 24 * 60 * 60, // 7 days

  // Search results (1 hour - frequently updated)
  SEARCH: 60 * 60, // 1 hour

  // Page content (1 day - balance freshness and efficiency)
  PAGE_CONTENT: 24 * 60 * 60, // 1 day
};

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  credibility: (url: string) => `credibility:${url}`,
  schema: (domain: string) => `schema:${domain}`,
  serviceMapping: (serviceType: string) => `service:${serviceType}`,
  phoneValidation: (phone: string) => `phone:${phone}`,
  urlValidation: (url: string) => `url:${url}`,
  search: (query: string) => `search:${query}`,
  pageContent: (url: string) => `page:${url}`,
};
