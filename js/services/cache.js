// ============================================================
// cache.js — In-memory caching manager with TTL
// ============================================================

import { CONFIG } from '../config.js';

class CacheManager {
  constructor() {
    this._cache = new Map();
  }

  /**
   * Retrieve cached value if unexpired
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
   * Set cache entry with expiration TTL
   * @param {string} key
   * @param {*} value
   * @param {number} [ttl=CONFIG.cacheTTL] - Time to live in ms
   */
  set(key, value, ttl = CONFIG.cacheTTL) {
    this._cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Check if a valid, unexpired entry exists for key
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache key
   * @param {string} key
   */
  invalidate(key) {
    this._cache.delete(key);
  }

  /**
   * Invalidate all keys matching prefix
   * @param {string} prefix
   */
  invalidatePrefix(prefix) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(prefix)) {
        this._cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this._cache.clear();
  }

  /**
   * Return cache diagnostic statistics
   * @returns {{ total: number, valid: number, expired: number }}
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
