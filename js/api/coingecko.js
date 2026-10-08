// ============================================================
// coingecko.js — CoinGecko fallback & historical aggregator API
// ============================================================

import { CONFIG } from '../config.js';
import { fetchWithTimeout } from '../utils/helpers.js';
import { normalizeCoinGeckoTicker } from './normalizer.js';

const BASE_URL = CONFIG.coingecko.baseUrl;
const TIMEOUT = CONFIG.apiTimeout;

/**
 * Fetch spot tickers from CoinGecko (fallback feed)
 * @param {string} [tokenKey='PAXG']
 * @returns {Promise<Array>}
 */
export async function fetchCoinGeckoTickers(tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return [];

  try {
    const url = `${BASE_URL}/coins/${tokenConfig.coingeckoId}/tickers?include_exchange_logo=false&depth=false`;
    const data = await fetchWithTimeout(url, {}, TIMEOUT);

    if (!data?.tickers || !Array.isArray(data.tickers)) return [];

    // Filter for USDT / USD settlement pairs and normalize
    return data.tickers
      .filter(t => {
        const target = t.target?.toUpperCase();
        return target === 'USDT' || target === 'USD';
      })
      .map(t => normalizeCoinGeckoTicker(t, tokenKey))
      .filter(t => t !== null && t.price.last > 0);
  } catch (error) {
    console.warn(`[CoinGecko] Failed to fetch tickers: ${error.message}`);
    return [];
  }
}

/**
 * Fetch historical price chart series from CoinGecko
 * @param {string} [tokenKey='PAXG']
 * @param {number} [days=1]
 * @returns {Promise<Array<[number, number]>>} Array of [timestamp, price]
 */
export async function fetchCoinGeckoHistory(tokenKey = 'PAXG', days = 1) {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return [];

  try {
    const url = `${BASE_URL}/coins/${tokenConfig.coingeckoId}/market_chart?vs_currency=usd&days=${days}`;
    const data = await fetchWithTimeout(url, {}, TIMEOUT);

    if (!data?.prices || !Array.isArray(data.prices)) return [];
    return data.prices;
  } catch (error) {
    console.warn(`[CoinGecko] Failed to fetch market chart: ${error.message}`);
    return [];
  }
}

/**
 * Fetch simple spot price snapshot from CoinGecko
 * @param {string} [tokenKey='PAXG']
 * @returns {Promise<{ price: number, change24h: number, volume24h: number }|null>}
 */
export async function fetchCoinGeckoSimplePrice(tokenKey = 'PAXG') {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return null;

  try {
    const params = new URLSearchParams({
      ids: tokenConfig.coingeckoId,
      vs_currencies: 'usd',
      include_24hr_change: 'true',
      include_24hr_vol: 'true',
    });
    const url = `${BASE_URL}/simple/price?${params.toString()}`;
    const data = await fetchWithTimeout(url, {}, TIMEOUT);

    const coinData = data?.[tokenConfig.coingeckoId];
    if (!coinData) return null;

    return {
      price: coinData.usd,
      change24h: coinData.usd_24h_change,
      volume24h: coinData.usd_24h_vol,
    };
  } catch (error) {
    console.warn(`[CoinGecko] Failed to fetch simple price: ${error.message}`);
    return null;
  }
}

export default {
  fetchCoinGeckoTickers,
  fetchCoinGeckoHistory,
  fetchCoinGeckoSimplePrice,
};
