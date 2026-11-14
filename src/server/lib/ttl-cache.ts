type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export function ttlGet<T>(key: string): T | undefined {
  const row = store.get(key) as Entry<T> | undefined;
  if (!row) return undefined;
  if (row.expires < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return row.value;
}

export function ttlSet<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function ttlDel(keyOrPrefix: string, prefix = false) {
  if (!prefix) {
    store.delete(keyOrPrefix);
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyOrPrefix)) store.delete(key);
  }
}

export async function ttlRemember<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = ttlGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  ttlSet(key, value, ttlMs);
  return value;
}
