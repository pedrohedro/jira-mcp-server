import { Cache, RateLimiter, retryWithBackoff } from '../utils/cache-and-rate-limit.js';
import { jest } from '@jest/globals';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(1000); // 1 second TTL
  });

  test('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('should expire values after TTL', async () => {
    cache.set('key1', 'value1', 100); // 100ms TTL
    expect(cache.get('key1')).toBe('value1');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });

  test('should clear cache', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  test('should delete specific key', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.delete('key1');
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  test('should return correct size', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);
  });
});

describe('RateLimiter', () => {
  test('should allow consumption within capacity', async () => {
    const limiter = new RateLimiter(10, 100); // 10 capacity, 100 tokens/sec
    
    const result = await limiter.consume(5);
    expect(result).toBe(true);
    expect(limiter.getTokens()).toBe(5);
  });

  test('should refill tokens over time', async () => {
    const limiter = new RateLimiter(10, 10); // 10 capacity, 10 tokens/sec
    
    await limiter.consume(10);
    expect(limiter.getTokens()).toBe(0);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5 sec
    expect(limiter.getTokens()).toBeGreaterThanOrEqual(4); // Should have ~5 tokens
  });
});

describe('retryWithBackoff', () => {
  test('should succeed on first try', async () => {
    const fn = async () => 'success';
    const result = await retryWithBackoff(fn);
    
    expect(result).toBe('success');
  });

  test('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`fail ${attempts}`);
      }
      return 'success';
    };
    
    const result = await retryWithBackoff(fn, 3, 10);
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('should throw after max retries', async () => {
    const fn = async () => {
      throw new Error('persistent failure');
    };
    
    await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('persistent failure');
  });

  test('should not retry on 4xx errors', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      const error: any = new Error('Client error');
      error.response = { status: 400 };
      throw error;
    };
    
    await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('Client error');
    expect(attempts).toBe(1); // No retries
  });
});
