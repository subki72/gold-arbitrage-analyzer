// ============================================================
// app.js — Main application orchestration & lifecycle manager
// ============================================================

import { CONFIG } from './config.js';
import { appState } from './services/state.js';
import { cache } from './services/cache.js';
import { fetchAllExchanges } from './api/exchanges.js';
import { fetchCoinGeckoHistory } from './api/coingecko.js';
import { findMaxSpread } from './services/arbitrage.js';
import { $ } from './utils/helpers.js';

// UI Components
import { initHeader } from './components/header.js';
import { initStatsCards } from './components/statsCards.js';
import { initCharts, resetCharts } from './components/charts.js';
import { initTable } from './components/table.js';
import { initHeatmap } from './components/heatmap.js';
import { initCalculator } from './components/calculator.js';

let refreshTimer = null;
let currentFetchController = null;

// ═══════════════════════════════════════
// Application Initialization
// ═══════════════════════════════════════
export async function init() {
  console.log('⚡ Initializing Gold Arbitrage Analyzer...');

  // Initialize UI components
  initHeader();
  initStatsCards();
  initCharts();
  initTable();
  initHeatmap();
  initCalculator();

  // Reactive state event subscriptions
  setupStateListeners();

  // Initial market fetch
  await fetchData();
  await fetchHistoryData();

  // Launch automated background polling interval
  startAutoRefresh();

  // Dismiss splash loading overlay
  hideLoadingOverlay();

  console.log('✅ Gold Arbitrage Analyzer ready.');
}

// ═══════════════════════════════════════
// State Event Subscriptions
// ═══════════════════════════════════════
function setupStateListeners() {
  // Token toggle event: PAXG <-> XAUT
  appState.on('selectedToken', (newToken) => {
    console.log(`🔄 Switched token to: ${newToken}`);

    // Abort pending in-flight requests
    if (currentFetchController) {
      currentFetchController.abort();
      currentFetchController = null;
    }

    // Invalidate stale caches and isolate time-series to prevent cross-asset corruption
    cache.clear();
    appState.set('priceHistory', {});
    appState.set('spreadHistory', []);
    resetCharts();

    fetchData(true);
    fetchHistoryData();
  });

  // Timeframe change
  appState.on('selectedTimeframe', () => {
    fetchHistoryData();
  });

  // Auto-refresh interval toggling
  appState.on('isAutoRefresh', (enabled) => {
    if (enabled) startAutoRefresh();
    else stopAutoRefresh();
  });

  appState.on('refreshInterval', () => {
    if (appState.get('isAutoRefresh')) {
      startAutoRefresh();
    }
  });

  // User manual refresh button click
  appState.on('forceRefresh', () => {
    console.log('⚡ Manual refresh requested by user');
    cache.clear();
    fetchData(true);
  });
}

// ═══════════════════════════════════════
// Data Pipeline (Single Responsibility)
// ═══════════════════════════════════════

/**
 * Fetch raw market feeds from proxy or direct endpoints
 * @param {string} token
 * @param {AbortSignal} signal
 * @returns {Promise<Array>}
 */
async function fetchMarketData(token, signal) {
  return await fetchAllExchanges(token, signal);
}

/**
 * Display or hide the global alert notification banner
 * @param {boolean} show
 * @param {string} [message='']
 */
function updateGlobalAlertBanner(show, message = '') {
  const banner = $('#global-alert-banner');
  const msgEl = $('#global-alert-message');
  if (!banner) return;

  if (show) {
    if (msgEl && message) {
      msgEl.textContent = message;
    }
    banner.style.display = 'flex';
    if (typeof window !== 'undefined' && window.lucide) {
      window.lucide.createIcons();
    }
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Update global state and rolling accumulators with validated market quotes
 * @param {Array} exchanges
 * @param {string} token
 */
function updateMarketState(exchanges, token) {
  const cacheKey = `exchanges_${token}`;
  cache.set(cacheKey, exchanges, CONFIG.cacheTTL);

  const activeCount = exchanges.filter(e => e.status === 'active' && e.price?.last > 0).length;
  const insufficientMsg = 'Insufficient live market data: fewer than 2 exchanges responded with live quotes. Arbitrage opportunities require at least 2 active markets.';

  appState.update({
    exchanges,
    lastUpdated: Date.now(),
    isLoading: false,
    errors: activeCount < 2 ? [insufficientMsg] : [],
  });

  updateGlobalAlertBanner(activeCount < 2, activeCount < 2 ? insufficientMsg : '');

  const activeExchanges = exchanges.filter(e => e.status === 'active' && e.price?.last > 0);
  trackSpreadHistory(activeExchanges);
  trackPriceHistory(activeExchanges);
}

/**
 * Primary market data fetch coordinator
 * @param {boolean} [force=false]
 */
async function fetchData(force = false) {
  const token = appState.get('selectedToken') || 'PAXG';
  const cacheKey = `exchanges_${token}`;

  // Abort previous in-flight request if active
  if (currentFetchController) {
    currentFetchController.abort();
  }
  currentFetchController = new AbortController();
  const signal = currentFetchController.signal;

  // Check memory cache unless user forced refresh
  if (!force) {
    const cached = cache.get(cacheKey);
    if (cached) {
      appState.set('exchanges', cached);
      appState.set('isLoading', false);
      const activeCount = cached.filter(e => e.status === 'active' && e.price?.last > 0).length;
      updateGlobalAlertBanner(
        activeCount < 2,
        activeCount < 2
          ? 'Insufficient live market data: fewer than 2 exchanges responded with live quotes. Arbitrage opportunities require at least 2 active markets.'
          : ''
      );
      hideLoadingIndicator();
      return;
    }
  }

  appState.set('isLoading', true);
  showLoadingIndicator();

  try {
    const exchanges = await fetchMarketData(token, signal);

    if (signal.aborted) return;

    if (exchanges.length === 0) {
      console.warn(`[Market] No live data feeds returned for ${token}`);
      const unreachableMsg = `All market data feeds for ${token} are currently unreachable.`;
      appState.update({
        exchanges: [],
        isLoading: false,
        errors: [unreachableMsg],
      });
      updateGlobalAlertBanner(true, unreachableMsg);
      return;
    }

    updateMarketState(exchanges, token);
  } catch (error) {
    if (error.name === 'AbortError') return;

    console.error('Market fetch error:', error);
    const errorMsg = error.message || 'Market data fetch failed';
    appState.update({
      isLoading: false,
      errors: [...(appState.get('errors') || []), errorMsg],
    });
    updateGlobalAlertBanner(true, errorMsg);
  } finally {
    hideLoadingIndicator();
  }
}

/**
 * Fetch CoinGecko historical aggregated candles
 */
async function fetchHistoryData() {
  const token = appState.get('selectedToken') || 'PAXG';
  const tf = appState.get('selectedTimeframe') || '24h';

  const daysMap = { '1h': 1, '4h': 1, '24h': 1, '7d': 7 };
  const days = daysMap[tf] || 1;

  try {
    const history = await fetchCoinGeckoHistory(token, days);
    if (!history || history.length === 0) return;

    const now = Date.now();
    const cutoffMinutes = CONFIG.chart.timeframes.find(t => t.value === tf)?.minutes || 1440;
    const cutoff = now - (cutoffMinutes * 60 * 1000);

    const filtered = history.filter(([timestamp]) => timestamp >= cutoff);
    const existing = appState.get('priceHistory') || {};

    appState.set('priceHistory', {
      ...existing,
      global_avg: filtered,
    });
  } catch (error) {
    console.error('Failed to fetch historical market data:', error);
  }
}

// ═══════════════════════════════════════
// History Accumulators (Token Scoped)
// ═══════════════════════════════════════
function trackSpreadHistory(exchanges) {
  const maxSpreadInfo = findMaxSpread(exchanges);
  if (!maxSpreadInfo) return;

  const history = [...(appState.get('spreadHistory') || [])];
  history.push({
    timestamp: Date.now(),
    maxSpread: maxSpreadInfo.spread.percentage,
    buyExchange: maxSpreadInfo.buyExchange.displayName,
    sellExchange: maxSpreadInfo.sellExchange.displayName,
  });

  if (history.length > CONFIG.chart.maxDataPoints) {
    history.splice(0, history.length - CONFIG.chart.maxDataPoints);
  }

  appState.set('spreadHistory', history);
}

function trackPriceHistory(exchanges) {
  const history = { ...(appState.get('priceHistory') || {}) };
  const now = Date.now();

  exchanges.forEach(ex => {
    if (!history[ex.exchange]) history[ex.exchange] = [];
    history[ex.exchange].push([now, ex.price.last]);

    if (history[ex.exchange].length > CONFIG.chart.maxDataPoints) {
      history[ex.exchange].splice(0, history[ex.exchange].length - CONFIG.chart.maxDataPoints);
    }
  });

  appState.set('priceHistory', history);
}

// ═══════════════════════════════════════
// Auto-Refresh Polling
// ═══════════════════════════════════════
function startAutoRefresh() {
  stopAutoRefresh();
  const interval = appState.get('refreshInterval') || CONFIG.refreshInterval;
  refreshTimer = setInterval(() => {
    // Background polling respects cache TTL; does not clear cache needlessly
    fetchData();
  }, interval);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// ═══════════════════════════════════════
// Visual Indicators
// ═══════════════════════════════════════
function showLoadingIndicator() {
  const el = $('#loading-indicator');
  if (el) el.classList.add('visible');
}

function hideLoadingIndicator() {
  const el = $('#loading-indicator');
  if (el) el.classList.remove('visible');
}

function hideLoadingOverlay() {
  const overlay = $('#loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 600);
  }
}

// ═══════════════════════════════════════
// Bootloader
// ═══════════════════════════════════════
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

export default {
  init,
};
