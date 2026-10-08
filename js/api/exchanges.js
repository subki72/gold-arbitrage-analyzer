// ============================================================
// exchanges.js — Multi-exchange market fetchers & proxy client
// ============================================================

import { CONFIG } from '../config.js';
import { fetchWithTimeout } from '../utils/helpers.js';
import {
  normalizeBinance,
  normalizeOKX,
  normalizeBybit,
  normalizeKuCoin,
  normalizeHTX,
  normalizeGateIO,
  normalizeMEXC,
  normalizeBitfinex,
} from './normalizer.js';

import { fetchCoinGeckoTickers } from './coingecko.js';

const TIMEOUT = CONFIG.apiTimeout;

// ── Data-Driven Exchange Configuration & Fetcher (RD-09) ──

const EXCHANGE_FETCH_CONFIGS = {
  binance: {
    normalizer: normalizeBinance,
    getUrl: (pair) => `${CONFIG.exchanges.binance.api.ticker}?symbol=${pair}`,
  },
  okx: {
    normalizer: normalizeOKX,
    getUrl: (pair) => `${CONFIG.exchanges.okx.api.ticker}?instId=${pair}`,
  },
  bybit: {
    normalizer: normalizeBybit,
    getUrl: (pair) => `${CONFIG.exchanges.bybit.api.ticker}?category=spot&symbol=${pair}`,
  },
  kucoin: {
    normalizer: normalizeKuCoin,
    getUrl: (pair) => `${CONFIG.exchanges.kucoin.api.ticker}?symbol=${pair}`,
  },
  htx: {
    normalizer: normalizeHTX,
    getUrl: (pair) => `${CONFIG.exchanges.htx.api.ticker}?symbol=${pair}`,
  },
  gateio: {
    normalizer: normalizeGateIO,
    getUrl: (pair) => `${CONFIG.exchanges.gateio.api.ticker}?currency_pair=${pair}`,
  },
  mexc: {
    normalizer: normalizeMEXC,
    getUrl: (pair) => `${CONFIG.exchanges.mexc.api.ticker}?symbol=${encodeURIComponent(pair)}`,
  },
  bitfinex: {
    normalizer: normalizeBitfinex,
    getUrl: (pair) => `${CONFIG.exchanges.bitfinex.api.ticker}/${encodeURIComponent(pair)}`,
  },
};

async function executeExchangeFetch(exchangeId, pair, signal) {
  if (!pair) return null;
  const cfg = EXCHANGE_FETCH_CONFIGS[exchangeId];
  if (!cfg) return null;
  const url = cfg.getUrl(pair);
  const data = await fetchWithTimeout(url, { signal }, TIMEOUT);
  return cfg.normalizer(data, pair);
}

/**
 * Fetch data from all exchanges for a given token
 * First attempts to use the serverless BFF proxy /api/prices
 * Falls back to client-side direct calls if proxy is unavailable
 * @param {string} [tokenKey='PAXG']
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>} Array of normalized exchange data
 */
export async function fetchAllExchanges(tokenKey = 'PAXG', signal) {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) {
    console.error(`Token ${tokenKey} not found in configuration`);
    return [];
  }

  // 1. Try serverless edge proxy first (bypasses CORS and ISP blocking)
  try {
    const proxyUrl = `/api/prices?token=${encodeURIComponent(tokenKey)}`;
    const res = await fetchWithTimeout(proxyUrl, { signal }, TIMEOUT);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // Serverless proxy unavailable (e.g. running in standalone static environment);
    // fall back to direct browser fetches below
  }

  // 2. Direct client-side fetch fallback
  const pairs = tokenConfig.pairs;
  const exchangeIds = Object.keys(pairs).filter(id => pairs[id] !== null);

  const promises = exchangeIds.map(async (exchangeId) => {
    try {
      const result = await executeExchangeFetch(exchangeId, pairs[exchangeId], signal);
      if (result) {
        result.symbol = `${tokenKey}/USDT`;
        return result;
      }
    } catch (error) {
      console.warn(`[${exchangeId}] Direct fetch failed: ${error.message}`);
    }

    return {
      exchange: exchangeId,
      displayName: CONFIG.exchanges[exchangeId]?.name || exchangeId,
      color: CONFIG.exchanges[exchangeId]?.color || '#888888',
      symbol: `${tokenKey}/USDT`,
      price: { last: 0, bid: 0, ask: 0, high24h: 0, low24h: 0 },
      change24h: { absolute: 0, percentage: 0 },
      volume24h: { base: 0, quote: 0 },
      fees: CONFIG.exchanges[exchangeId]?.fees || { maker: 0.1, taker: 0.1 },
      timestamp: Date.now(),
      status: 'offline',
    };
  });

  const settled = await Promise.allSettled(promises);
  let exchanges = settled
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(r => r !== null);

  // If some exchanges failed directly, check CoinGecko fallback
  const offlineExchanges = exchanges.filter(e => e.status === 'offline');
  if (offlineExchanges.length > 0) {
    try {
      const cgTickers = await fetchCoinGeckoTickers(tokenKey);
      if (Array.isArray(cgTickers) && cgTickers.length > 0) {
        const cgMap = new Map(cgTickers.map(t => [t.exchange, t]));
        exchanges = exchanges.map(ex => {
          if (ex.status === 'offline' && cgMap.has(ex.exchange)) {
            return cgMap.get(ex.exchange);
          }
          return ex;
        });
      }
    } catch {
      // CoinGecko fallback also unavailable; keep offline statuses
    }
  }

  return exchanges;
}

/**
 * Fetch single exchange data
 * @param {string} exchangeId
 * @param {string} [tokenKey='PAXG']
 * @returns {Promise<Object|null>}
 */
export async function fetchSingleExchange(exchangeId, tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  const pair = tokenConfig?.pairs?.[exchangeId];

  if (!pair) return null;

  try {
    const result = await executeExchangeFetch(exchangeId, pair);
    if (result) result.symbol = `${tokenKey}/USDT`;
    return result;
  } catch (error) {
    console.warn(`[${exchangeId}] Single fetch failed: ${error.message}`);
    return null;
  }
}

export default {
  fetchAllExchanges,
  fetchSingleExchange,
};
