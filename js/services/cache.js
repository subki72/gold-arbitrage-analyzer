// ============================================================
// cache.js — In-memory cache with TTL
// ============================================================

class CacheManager {
  constructor() {
    this._cache = new Map();
  }

  /**
   * Get cached value
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this._cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached value
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - Time to live in ms (default: 25s)
   */
  set(key, value, ttl = 25000) {
    this._cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific key
   */
  invalidate(key) {
    this._cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidatePrefix(prefix) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(prefix)) {
        this._cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this._cache.clear();
  }

  /**
   * Get cache stats
   */
  stats() {
    let valid = 0;
    let expired = 0;
    const now = Date.now();

    for (const entry of this._cache.values()) {
      if (now > entry.expiry) expired++;
      else valid++;
    }

    return { total: this._cache.size, valid, expired };
  }
}

export const cache = new CacheManager();
export default cache;
