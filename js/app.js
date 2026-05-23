// ============================================================
// app.js — Main application entry point
// ============================================================

import { CONFIG } from './config.js';
import { appState } from './services/state.js';
import { cache } from './services/cache.js';
import { fetchAllExchanges } from './api/exchanges.js';
import { fetchCoinGeckoTickers, fetchCoinGeckoHistory } from './api/coingecko.js';
import { findMaxSpread } from './services/arbitrage.js';
import { initHeader } from './components/header.js';
import { initStatsCards } from './components/statsCards.js';
import { initCharts } from './components/charts.js';
import { initHeatmap } from './components/heatmap.js';
import { initTable } from './components/table.js';
import { initCalculator } from './components/calculator.js';
import { $ } from './utils/helpers.js';

let refreshTimer = null;

// ═══════════════════════════════════════
// Initialization
// ═══════════════════════════════════════
async function init() {
  console.log('🥇 Gold Arbitrage Analyzer — Initializing...');

  // Init components
  initHeader();
  initStatsCards();
  initCharts();
  initHeatmap();
  initTable();
  initCalculator();

  // ── State listeners ──
  appState.on('selectedToken', () => {
    cache.clear();
    fetchData();
    fetchHistoryData();
  });

  appState.on('selectedTimeframe', () => {
    fetchHistoryData();
  });

  appState.on('isAutoRefresh', (enabled) => {
    if (enabled) startAutoRefresh();
    else stopAutoRefresh();
  });

  appState.on('refreshInterval', (interval) => {
    if (appState.get('isAutoRefresh')) {
      stopAutoRefresh();
      startAutoRefresh();
    }
  });

  appState.on('forceRefresh', () => fetchData());

  // ── Initial data fetch ──
  await fetchData();
  await fetchHistoryData();

  // ── Start auto-refresh ──
  startAutoRefresh();

  // ── Hide loading overlay ──
  hideLoadingOverlay();

  console.log('✅ Gold Arbitrage Analyzer — Ready!');
}

// ═══════════════════════════════════════
// Historical Data Fetching
// ═══════════════════════════════════════
async function fetchHistoryData() {
  const token = appState.get('selectedToken') || 'PAXG';
  const tf = appState.get('selectedTimeframe') || '24h';
  
  let days = 1;
  if (tf === '7d') days = 7;
  
  try {
    const history = await fetchCoinGeckoHistory(token, days);
    if (!history || history.length === 0) return;
    
    const now = Date.now();
    let msToKeep = 24 * 60 * 60 * 1000;
    if (tf === '1h') msToKeep = 60 * 60 * 1000;
    else if (tf === '4h') msToKeep = 4 * 60 * 60 * 1000;
    else if (tf === '7d') msToKeep = 7 * 24 * 60 * 60 * 1000;
    
    const cutoff = now - msToKeep;
    const filtered = history.filter(p => p[0] >= cutoff);
    
    const currentHistory = appState.get('priceHistory') || {};
    currentHistory['global_avg'] = filtered;
    
    appState.set('priceHistory', { ...currentHistory });
  } catch (error) {
    console.error('Failed to fetch history:', error);
  }
}

// ═══════════════════════════════════════
// Data Fetching
// ═══════════════════════════════════════
async function fetchData() {
  const token = appState.get('selectedToken');
  const cacheKey = `exchanges_${token}`;

  // Show loading
  appState.set('isLoading', true);
  showLoadingIndicator();

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      appState.set('exchanges', cached);
      appState.set('isLoading', false);
      hideLoadingIndicator();
      return;
    }

    // Fetch from direct exchange APIs
    let exchanges = await fetchAllExchanges(token);

    // Hitung jumlah exchange yang seharusnya ada (dari config yang tidak null)
    const expectedCount = Object.keys(CONFIG.tokens[token].pairs).filter(k => CONFIG.tokens[token].pairs[k] !== null).length;

    // Jika ada yang gagal/CORS (kurang dari expected), isi kekosongan dari CoinGecko
    if (exchanges.length < expectedCount) {
      console.log(`⚠️ Hanya ${exchanges.length}/${expectedCount} direct API sukses, merge dengan CoinGecko...`);
      const cgExchanges = await fetchCoinGeckoTickers(token);
      
      const directIds = new Set(exchanges.map(e => e.exchange));
      const missingFromCg = cgExchanges.filter(e => !directIds.has(e.exchange));
      exchanges = [...exchanges, ...missingFromCg];
    }

    // Jika masih ada yang kurang, isi sisanya dengan demo data agar UI tidak kosong
    if (exchanges.length < expectedCount) {
      console.log('⚠️ Data masih kurang, merge dengan demo data...');
      const demoData = generateDemoData(token);
      const existingIds = new Set(exchanges.map(e => e.exchange));
      const missingFromDemo = demoData.filter(e => !existingIds.has(e.exchange));
      exchanges = [...exchanges, ...missingFromDemo];
    }

    // Cache hasil
    cache.set(cacheKey, exchanges, CONFIG.cacheTTL);

    // Update state
    appState.update({
      exchanges,
      lastUpdated: Date.now(),
      isLoading: false,
      errors: [],
    });

    // Track spread history
    trackSpreadHistory(exchanges);

    // Track price history (append to existing)
    trackPriceHistory(exchanges);

  } catch (error) {
    console.error('❌ Fetch error:', error);
    appState.update({
      isLoading: false,
      errors: [...(appState.get('errors') || []), error.message],
    });

    // Fallback to demo data
    const demoData = generateDemoData(token);
    appState.set('exchanges', demoData);
    trackSpreadHistory(demoData);
    trackPriceHistory(demoData);
  }

  hideLoadingIndicator();
}

// ═══════════════════════════════════════
// History Tracking
// ═══════════════════════════════════════
function trackSpreadHistory(exchanges) {
  const maxSpreadInfo = findMaxSpread(exchanges);
  if (!maxSpreadInfo) return;

  const history = appState.get('spreadHistory') || [];
  history.push({
    timestamp: Date.now(),
    maxSpread: maxSpreadInfo.spread.percentage,
    buyEx: maxSpreadInfo.buyExchange.displayName,
    sellEx: maxSpreadInfo.sellExchange.displayName,
  });

  // Keep last 100 points
  if (history.length > CONFIG.chart.maxDataPoints) {
    history.splice(0, history.length - CONFIG.chart.maxDataPoints);
  }

  appState.set('spreadHistory', [...history]);
}

function trackPriceHistory(exchanges) {
  const history = appState.get('priceHistory') || {};
  const now = Date.now();

  exchanges.forEach(ex => {
    if (!history[ex.exchange]) history[ex.exchange] = [];
    history[ex.exchange].push([now, ex.price.last]);

    // Keep last 100 points
    if (history[ex.exchange].length > CONFIG.chart.maxDataPoints) {
      history[ex.exchange].splice(0, history[ex.exchange].length - CONFIG.chart.maxDataPoints);
    }
  });

  appState.set('priceHistory', { ...history });
}

// ═══════════════════════════════════════
// Auto-Refresh
// ═══════════════════════════════════════
function startAutoRefresh() {
  stopAutoRefresh();
  const interval = appState.get('refreshInterval') || CONFIG.refreshInterval;
  refreshTimer = setInterval(() => {
    cache.clear();
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
// UI Helpers
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
// Demo Data (Fallback)
// ═══════════════════════════════════════
function generateDemoData(token) {
  const basePrice = token === 'PAXG' ? 3285 : 3280;
  const exchangesList = token === 'PAXG'
    ? ['binance', 'okx', 'bybit', 'kucoin', 'htx', 'gateio', 'mexc']
    : ['okx', 'bybit', 'kucoin', 'htx', 'gateio', 'mexc', 'bitfinex'];

  return exchangesList.map(id => {
    const variation = (Math.random() - 0.5) * 20; // ±$10
    const price = basePrice + variation;
    const change = (Math.random() - 0.4) * 3;     // -1.2% to +1.8%
    const volume = Math.random() * 5000000 + 500000;
    const config = CONFIG.exchanges[id];

    return {
      exchange: id,
      displayName: config?.name || id,
      color: config?.color || '#888',
      symbol: `${token}/USDT`,
      price: {
        last: parseFloat(price.toFixed(2)),
        bid: parseFloat((price - 0.5).toFixed(2)),
        ask: parseFloat((price + 0.5).toFixed(2)),
        high24h: parseFloat((price + Math.random() * 30).toFixed(2)),
        low24h: parseFloat((price - Math.random() * 30).toFixed(2)),
      },
      change24h: {
        absolute: parseFloat((basePrice * change / 100).toFixed(2)),
        percentage: parseFloat(change.toFixed(2)),
      },
      volume24h: {
        base: parseFloat((volume / price).toFixed(2)),
        quote: parseFloat(volume.toFixed(2)),
      },
      fees: config?.fees || { maker: 0.1, taker: 0.1 },
      timestamp: Date.now(),
      status: 'active',
    };
  });
}

// ═══════════════════════════════════════
// Start Application
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', init);
