/**
 * Simple in-memory cache with TTL
 */
export class Cache {
  private cache: Map<string, { value: any; expires: number }>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  /**
   * Clear specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number = 10, refillRate: number = 2) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  async consume(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    // Calculate wait time
    const tokensNeeded = tokens - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000;

    // Wait and try again
    await this.sleep(waitTime);
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on time passed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
