/**
 * In-memory caching utilities
 *
 * Migrated from src/services/memory.ts for Convex-native usage.
 *
 * NOTE: This is a simple in-memory cache with TTL.
 * In production, consider using Convex database tables for persistence
 * or Redis for distributed caching.
 */

export type MemoryEntry = {
  key: string;
  value: string;
  expiresAt: number;
};

const inMemoryStore = new Map<string, MemoryEntry>();

/**
 * Write a value to in-memory cache with TTL
 *
 * @param userId - User ID
 * @param key - Cache key
 * @param value - Value to store
 * @param ttlMs - Time to live in milliseconds (default: 1 hour)
 */
export const writeMemory = (userId: string, key: string, value: string, ttlMs = 1000 * 60 * 60) => {
  inMemoryStore.set(`${userId}:${key}`, { key, value, expiresAt: Date.now() + ttlMs });
};

/**
 * Read a value from in-memory cache
 *
 * @param userId - User ID
 * @param key - Cache key
 * @returns Cached value or null if not found/expired
 */
export const readMemory = (userId: string, key: string): string | null => {
  const entry = inMemoryStore.get(`${userId}:${key}`);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    inMemoryStore.delete(`${userId}:${key}`);
    return null;
  }
  return entry.value;
};

/**
 * Clear all expired entries from cache
 *
 * This should be called periodically to prevent memory leaks.
 */
export const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.expiresAt < now) {
      inMemoryStore.delete(key);
    }
  }
};
