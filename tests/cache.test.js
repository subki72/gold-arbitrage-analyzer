import { describe, it, expect, beforeEach } from 'vitest';
import { cache } from '../js/services/cache.js';

describe('Cache Manager - js/services/cache.js', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('stores and retrieves cached data before TTL expires', () => {
    cache.set('test_key', { price: 2650 }, 1000);
    expect(cache.has('test_key')).toBe(true);
    expect(cache.get('test_key')).toEqual({ price: 2650 });
  });

  it('returns null and purges expired keys', () => {
    cache.set('expired_key', { price: 2650 }, -10); // Expired immediately
    expect(cache.get('expired_key')).toBeNull();
    expect(cache.has('expired_key')).toBe(false);
  });

  it('invalidates specific key', () => {
    cache.set('key_1', 'val1');
    cache.invalidate('key_1');
    expect(cache.get('key_1')).toBeNull();
  });

  it('invalidates by prefix', () => {
    cache.set('exchanges_PAXG', [1, 2]);
    cache.set('exchanges_XAUT', [3, 4]);
    cache.set('other_key', 'val');

    cache.invalidatePrefix('exchanges_');
    expect(cache.get('exchanges_PAXG')).toBeNull();
    expect(cache.get('exchanges_XAUT')).toBeNull();
    expect(cache.get('other_key')).toBe('val');
  });

  it('clears all cache entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.stats().total).toBe(0);
  });

  it('uses default CONFIG.cacheTTL when ttl is omitted', () => {
    cache.set('default_ttl_key', { data: 123 });
    expect(cache.has('default_ttl_key')).toBe(true);
    expect(cache.get('default_ttl_key')).toEqual({ data: 123 });
  });
});
