// ============================================================
// state.js — Reactive state management (pub/sub)
// ============================================================

/**
 * Simple reactive state store with pub/sub
 */
class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = new Map();
    this._globalListeners = [];
  }

  /**
   * Get current state (immutable copy)
   */
  get state() {
    return { ...this._state };
  }

  /**
   * Get specific state value
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Update state and notify listeners
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    // Notify key-specific listeners
    if (this._listeners.has(key)) {
      this._listeners.get(key).forEach(cb => {
        try { cb(value, oldValue, key); } catch (e) { console.error('State listener error:', e); }
      });
    }

    // Notify global listeners
    this._globalListeners.forEach(cb => {
      try { cb(key, value, oldValue); } catch (e) { console.error('Global listener error:', e); }
    });
  }

  /**
   * Batch update multiple keys
   */
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Subscribe ke perubahan key tertentu
   * @returns {Function} unsubscribe function
   */
  on(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }
    this._listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this._listeners.get(key);
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  /**
   * Subscribe ke semua perubahan state
   * @returns {Function} unsubscribe function
   */
  onAny(callback) {
    this._globalListeners.push(callback);
    return () => {
      const idx = this._globalListeners.indexOf(callback);
      if (idx > -1) this._globalListeners.splice(idx, 1);
    };
  }
}

// ── Application State ──
export const appState = new Store({
  // Data
  exchanges: [],                  // Array of normalized exchange data
  priceHistory: [],               // Historical price data points
  spreadHistory: [],              // Spread over time

  // UI State
  selectedToken: 'PAXG',         // Active token
  selectedTimeframe: '24h',      // Chart timeframe
  isLoading: true,               // Loading state
  isAutoRefresh: true,           // Auto-refresh enabled
  refreshInterval: 30000,        // Refresh interval (ms)
  lastUpdated: null,             // Last data update timestamp
  
  // Errors
  errors: [],                    // Array of error messages
  
  // Calculator
  calcBuyExchange: null,         // Selected buy exchange
  calcSellExchange: null,        // Selected sell exchange
  calcAmount: 1,                 // Amount in troy ounces

  // Sort
  tableSortBy: 'price',         // Sort column
  tableSortDir: 'asc',          // Sort direction
});

export default appState;
