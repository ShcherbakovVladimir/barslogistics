import { ApiService } from '../services/api';

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(userId: string, version?: string | null): string {
  return `${userId}:${version || '0'}`;
}

/** Fetch avatar as blob URL (auth header). Cached per user+version. */
export async function resolveUserAvatarUrl(
  userId: string,
  hasAvatar?: boolean,
  version?: string | null,
): Promise<string | null> {
  if (!userId || !hasAvatar) return null;
  const key = cacheKey(userId, version);
  const hit = cache.get(key);
  if (hit) return hit;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const url = await ApiService.fetchUserAvatarObjectUrl(userId, version);
      if (!url) return null;
      cache.set(key, url);
      return url;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function invalidateUserAvatarCache(userId?: string): void {
  if (!userId) {
    for (const url of cache.values()) URL.revokeObjectURL(url);
    cache.clear();
    return;
  }
  for (const [key, url] of cache.entries()) {
    if (key.startsWith(`${userId}:`)) {
      URL.revokeObjectURL(url);
      cache.delete(key);
    }
  }
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
}

export function userAvatarTone(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 5;
}
