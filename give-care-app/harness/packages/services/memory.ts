export type MemoryEntry = {
  key: string;
  value: string;
  expiresAt: number;
};

const inMemoryStore = new Map<string, MemoryEntry>();

export const writeMemory = (userId: string, key: string, value: string, ttlMs = 1000 * 60 * 60) => {
  inMemoryStore.set(`${userId}:${key}`, { key, value, expiresAt: Date.now() + ttlMs });
};

export const readMemory = (userId: string, key: string): string | null => {
  const entry = inMemoryStore.get(`${userId}:${key}`);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    inMemoryStore.delete(`${userId}:${key}`);
    return null;
  }
  return entry.value;
};
