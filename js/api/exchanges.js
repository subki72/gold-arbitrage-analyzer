// ============================================================
// exchanges.js — Fetch data dari berbagai CEX APIs
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

const TIMEOUT = CONFIG.apiTimeout;

// ── Individual Exchange Fetchers ──

async function fetchBinance(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.binance.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeBinance(data, pair);
}

async function fetchOKX(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.okx.api.ticker}?instId=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeOKX(data, pair);
}

async function fetchBybit(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.bybit.api.ticker}?category=spot&symbol=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeBybit(data, pair);
}

async function fetchKuCoin(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.kucoin.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeKuCoin(data, pair);
}

async function fetchHTX(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.htx.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeHTX(data, pair);
}

async function fetchGateIO(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.gateio.api.ticker}?currency_pair=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeGateIO(data, pair);
}

async function fetchMEXC(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.mexc.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeMEXC(data, pair);
}

async function fetchBitfinex(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.bitfinex.api.ticker}/${pair}`;
  const data = await fetchWithTimeout(url, {}, TIMEOUT);
  return normalizeBitfinex(data, pair);
}

// ── Exchange Fetcher Map ──
const FETCHERS = {
  binance: fetchBinance,
  okx: fetchOKX,
  bybit: fetchBybit,
  kucoin: fetchKuCoin,
  htx: fetchHTX,
  gateio: fetchGateIO,
  mexc: fetchMEXC,
  bitfinex: fetchBitfinex,
};

/**
 * Fetch data dari semua exchange secara parallel
 * @param {string} tokenKey - 'PAXG' atau 'XAUT'
 * @returns {Promise<Array>} Array of normalized exchange data
 */
export async function fetchAllExchanges(tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) {
    console.error(`Token ${tokenKey} tidak ditemukan di konfigurasi`);
    return [];
  }

  const pairs = tokenConfig.pairs;
  const exchangeIds = Object.keys(pairs).filter(id => pairs[id] !== null);

  const promises = exchangeIds.map(async (exchangeId) => {
    const fetcher = FETCHERS[exchangeId];
    if (!fetcher) return null;

    try {
      const result = await fetcher(pairs[exchangeId]);
      if (result) {
        result.symbol = `${tokenKey}/USDT`;
      }
      return result;
    } catch (error) {
      console.warn(`[${exchangeId}] Gagal fetch: ${error.message}`);
      return {
        exchange: exchangeId,
        displayName: CONFIG.exchanges[exchangeId]?.name || exchangeId,
        color: CONFIG.exchanges[exchangeId]?.color || '#888',
        symbol: `${tokenKey}/USDT`,
        price: { last: 0, bid: 0, ask: 0, high24h: 0, low24h: 0 },
        change24h: { absolute: 0, percentage: 0 },
        volume24h: { base: 0, quote: 0 },
        fees: CONFIG.exchanges[exchangeId]?.fees || { maker: 0.1, taker: 0.1 },
        timestamp: Date.now(),
        status: 'error',
      };
    }
  });

  const results = await Promise.allSettled(promises);
  return results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(r => r !== null && r.price.last > 0);
}

/**
 * Fetch single exchange data
 * @param {string} exchangeId
 * @param {string} tokenKey
 * @returns {Promise<Object|null>}
 */
export async function fetchSingleExchange(exchangeId, tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  const pair = tokenConfig?.pairs?.[exchangeId];
  const fetcher = FETCHERS[exchangeId];

  if (!pair || !fetcher) return null;

  try {
    const result = await fetcher(pair);
    if (result) result.symbol = `${tokenKey}/USDT`;
    return result;
  } catch (error) {
    console.warn(`[${exchangeId}] Gagal fetch: ${error.message}`);
    return null;
  }
}
