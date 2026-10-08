// ============================================================
// state.js — Reactive application state management (Pub/Sub)
// ============================================================

import { CONFIG } from '../config.js';

/**
 * Reactive state store with pub/sub architecture
 */
export class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = new Map();
    this._globalListeners = [];
  }

  /**
   * Get immutable snapshot of current state
   * @returns {Object}
   */
  get state() {
    return { ...this._state };
  }

  /**
   * Get specific state value by key
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Update state and notify listeners
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    // Notify key-specific listeners
    if (this._listeners.has(key)) {
      this._listeners.get(key).forEach(cb => {
        try {
          cb(value, oldValue, key);
        } catch (e) {
          console.error(`State listener error on "${key}":`, e);
        }
      });
    }

    // Notify global listeners
    this._globalListeners.forEach(cb => {
      try {
        cb(key, value, oldValue);
      } catch (e) {
        console.error('Global state listener error:', e);
      }
    });
  }

  /**
   * Batch update multiple state keys
   * @param {Object} updates
   */
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Subscribe to specific state key changes
   * @param {string} key
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }
    this._listeners.get(key).push(callback);

    return () => {
      const listeners = this._listeners.get(key);
      if (listeners) {
        const idx = listeners.indexOf(callback);
        if (idx > -1) listeners.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to any state change
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onAny(callback) {
    this._globalListeners.push(callback);
    return () => {
      const idx = this._globalListeners.indexOf(callback);
      if (idx > -1) this._globalListeners.splice(idx, 1);
    };
  }

  /**
   * Reset token-specific historical timeseries to prevent cross-asset corruption
   * @param {string} tokenKey
   */
  resetTokenHistory(tokenKey) {
    const priceHistories = this.get('tokenPriceHistory') || { PAXG: {}, XAUT: {} };
    const spreadHistories = this.get('tokenSpreadHistory') || { PAXG: [], XAUT: [] };

    priceHistories[tokenKey] = {};
    spreadHistories[tokenKey] = [];

    this.update({
      tokenPriceHistory: { ...priceHistories },
      tokenSpreadHistory: { ...spreadHistories },
      priceHistory: {},
      spreadHistory: [],
    });
  }
}

// ── Application Initial State ──
export const appState = new Store({
  // Active Market Feeds
  exchanges: [],                  // Array of validated normalized exchange data
  priceHistory: {},               // Rolling active session exchange price points
  spreadHistory: [],              // Rolling spread points over time

  // Token-isolated historical timeseries caches
  tokenPriceHistory: {
    PAXG: {},
    XAUT: {},
  },
  tokenSpreadHistory: {
    PAXG: [],
    XAUT: [],
  },

  // Active Token & UI Settings
  selectedToken: 'PAXG',         // Active token: 'PAXG' or 'XAUT'
  selectedTimeframe: '24h',      // Chart timeframe: '1h', '4h', '24h', '7d'
  isLoading: true,               // Loading state
  isAutoRefresh: true,           // Automated interval polling active
  refreshInterval: CONFIG.refreshInterval, // Polling interval in ms
  lastUpdated: null,             // Timestamp of latest successful fetch

  // Error & Status Telemetry
  errors: [],                    // Array of active error notifications

  // Calculator Parameters
  calcBuyExchange: null,         // Selected buy exchange key
  calcSellExchange: null,        // Selected sell exchange key
  calcAmount: 1,                 // Amount in troy ounces
  calcWithdrawalFee: 0,          // User-specified exchange withdrawal fee in USD
  calcGasFee: 0,                 // User-specified network gas fee in USD
  calcTransferFeeRate: 0.0002,   // Token transfer fee (0.02% default for PAXG)

  // Table Sorting
  tableSortBy: 'price',         // Sort column
  tableSortDir: 'asc',          // Sort direction: 'asc' | 'desc'
});

export default appState;
