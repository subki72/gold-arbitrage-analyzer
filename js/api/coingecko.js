// ============================================================
// coingecko.js — CoinGecko fallback API
// ============================================================

import { CONFIG } from '../config.js';
import { fetchWithTimeout } from '../utils/helpers.js';
import { normalizeCoinGeckoTicker } from './normalizer.js';

const BASE_URL = CONFIG.coingecko.baseUrl;

/**
 * Fetch harga dari CoinGecko (fallback)
 * Menggunakan tickers endpoint untuk mendapatkan harga per-exchange
 * @param {string} tokenKey - 'PAXG' atau 'XAUT'
 * @returns {Promise<Array>}
 */
export async function fetchCoinGeckoTickers(tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return [];

  try {
    const url = `${BASE_URL}/coins/${tokenConfig.coingeckoId}/tickers?include_exchange_logo=false&depth=false`;
    const data = await fetchWithTimeout(url, {}, 10000);

    if (!data?.tickers) return [];

    // Filter hanya USDT pairs dan normalize
    return data.tickers
      .filter(t => {
        const target = t.target?.toUpperCase();
        return target === 'USDT' || target === 'USD';
      })
      .map(t => normalizeCoinGeckoTicker(t, tokenKey))
      .filter(t => t !== null && t.price.last > 0);
  } catch (error) {
    console.warn(`[CoinGecko] Gagal fetch tickers: ${error.message}`);
    return [];
  }
}

/**
 * Fetch data historis dari CoinGecko
 * @param {string} tokenKey - 'PAXG' atau 'XAUT'
 * @param {number} days - jumlah hari (1, 7, 30, 90)
 * @returns {Promise<Array>} Array of [timestamp, price]
 */
export async function fetchCoinGeckoHistory(tokenKey = 'PAXG', days = 1) {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return [];

  try {
    const url = `${BASE_URL}/coins/${tokenConfig.coingeckoId}/market_chart?vs_currency=usd&days=${days}`;
    const data = await fetchWithTimeout(url, {}, 10000);

    if (!data?.prices) return [];
    return data.prices; // [[timestamp, price], ...]
  } catch (error) {
    console.warn(`[CoinGecko] Gagal fetch history: ${error.message}`);
    return [];
  }
}

/**
 * Fetch harga sederhana dari CoinGecko
 * @param {string} tokenKey
 * @returns {Promise<Object|null>}
 */
export async function fetchCoinGeckoSimplePrice(tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return null;

  try {
    const url = `${BASE_URL}/simple/price?ids=${tokenConfig.coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
    const data = await fetchWithTimeout(url, {}, 10000);

    const coinData = data?.[tokenConfig.coingeckoId];
    if (!coinData) return null;

    return {
      price: coinData.usd,
      change24h: coinData.usd_24h_change,
      volume24h: coinData.usd_24h_vol,
    };
  } catch (error) {
    console.warn(`[CoinGecko] Gagal fetch simple price: ${error.message}`);
    return null;
  }
}
