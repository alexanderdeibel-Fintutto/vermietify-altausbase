/**
 * Simple in-memory cache manager with TTL support
 */
export class DataCacheManager {
  constructor(defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.timers = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, data, ttl = this.defaultTTL) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store data with timestamp
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => this.remove(key), ttl);
      this.timers.set(key, timer);
    }
  }

  get(key, maxAge = null) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check max age if specified
    if (maxAge && Date.now() - entry.timestamp > maxAge) {
      this.remove(key);
      return null;
    }

    return entry.data;
  }

  has(key) {
    return this.cache.has(key);
  }

  remove(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.cache.forEach((_, key) => this.remove(key));
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const globalCache = new DataCacheManager();