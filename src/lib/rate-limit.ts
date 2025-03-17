import LRUCache from 'lru-cache';

type Options = {
  interval: number;
  uniqueTokenPerInterval: number;
}

/**
 * Rate limiter based on LRU cache
 * @param options Configuration options for rate limiting
 */
export function rateLimit(options: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        } else {
          tokenCount[0] = tokenCount[0] + 1;
          tokenCache.set(token, tokenCount);
        }
        
        if (tokenCount[0] > limit) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
} 