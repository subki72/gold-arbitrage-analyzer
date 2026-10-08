// ============================================================
// api/prices.js — Vercel Serverless Function Proxy pinned to sin1
// Bypasses browser CORS & regional ISP DNS blocks with Edge caching
// ============================================================

import { CONFIG } from '../js/config.js';
import {
  normalizeBinance,
  normalizeOKX,
  normalizeBybit,
  normalizeKuCoin,
  normalizeHTX,
  normalizeGateIO,
  normalizeMEXC,
  normalizeBitfinex,
  normalizeCoinGeckoTicker,
} from '../js/api/normalizer.js';

const TIMEOUT = 7000; // 7 seconds timeout per exchange

async function fetchWithTimeout(url, options = {}, timeout = TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ── Server-side Exchange Fetchers ──
async function fetchBinance(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.binance.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url);
  return normalizeBinance(data, pair);
}

async function fetchOKX(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.okx.api.ticker}?instId=${pair}`;
  const data = await fetchWithTimeout(url);
  return normalizeOKX(data, pair);
}

async function fetchBybit(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.bybit.api.ticker}?category=spot&symbol=${pair}`;
  const data = await fetchWithTimeout(url);
  return normalizeBybit(data, pair);
}

async function fetchKuCoin(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.kucoin.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url);
  return normalizeKuCoin(data, pair);
}

async function fetchHTX(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.htx.api.ticker}?symbol=${pair}`;
  const data = await fetchWithTimeout(url);
  return normalizeHTX(data, pair);
}

async function fetchGateIO(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.gateio.api.ticker}?currency_pair=${pair}`;
  const data = await fetchWithTimeout(url);
  return normalizeGateIO(data, pair);
}

async function fetchMEXC(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.mexc.api.ticker}?symbol=${encodeURIComponent(pair)}`;
  const data = await fetchWithTimeout(url);
  return normalizeMEXC(data, pair);
}

async function fetchBitfinex(pair) {
  if (!pair) return null;
  const url = `${CONFIG.exchanges.bitfinex.api.ticker}/${encodeURIComponent(pair)}`;
  const data = await fetchWithTimeout(url);
  return normalizeBitfinex(data, pair);
}

async function fetchCoinGeckoFallback(tokenKey) {
  const tokenConfig = CONFIG.tokens[tokenKey];
  if (!tokenConfig) return [];
  try {
    const url = `${CONFIG.coingecko.baseUrl}/coins/${tokenConfig.coingeckoId}/tickers?include_exchange_logo=false&depth=false`;
    const data = await fetchWithTimeout(url, {}, 8000);
    if (!data?.tickers || !Array.isArray(data.tickers)) return [];
    return data.tickers
      .filter(t => {
        const target = t.target?.toUpperCase();
        return target === 'USDT' || target === 'USD';
      })
      .map(t => normalizeCoinGeckoTicker(t, tokenKey))
      .filter(t => t !== null && t.price.last > 0);
  } catch {
    return [];
  }
}

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

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const rawToken = req.query?.token || 'PAXG';
  const token = typeof rawToken === 'string' ? rawToken.toUpperCase() : 'PAXG';
  const tokenConfig = CONFIG.tokens[token];

  if (!tokenConfig) {
    return res.status(400).json({ error: `Invalid token. Supported: PAXG, XAUT` });
  }

  // Set Edge Caching & CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30');

  const pairs = tokenConfig.pairs;
  const validExchangeIds = Object.keys(pairs).filter(id => pairs[id] !== null);

  const directPromises = validExchangeIds.map(async (exchangeId) => {
    const fetcher = FETCHERS[exchangeId];
    if (!fetcher) return null;
    try {
      const result = await fetcher(pairs[exchangeId]);
      if (result) {
        result.symbol = `${token}/USDT`;
      }
      return result;
    } catch {
      return null;
    }
  });

  const settled = await Promise.allSettled(directPromises);
  const directResults = new Map();
  settled.forEach((r, idx) => {
    const exchangeId = validExchangeIds[idx];
    if (r.status === 'fulfilled' && r.value && r.value.price?.last > 0) {
      directResults.set(exchangeId, r.value);
    }
  });

  // If fewer than expected returned, merge available tickers from CoinGecko
  const cgResults = new Map();
  if (directResults.size < validExchangeIds.length) {
    const cgTickers = await fetchCoinGeckoFallback(token);
    cgTickers.forEach(t => {
      if (validExchangeIds.includes(t.exchange) && t.price?.last > 0) {
        cgResults.set(t.exchange, t);
      }
    });
  }

  // Construct complete array with explicit offline statuses for unreachable exchanges
  const allExchanges = validExchangeIds.map(exchangeId => {
    if (directResults.has(exchangeId)) {
      return directResults.get(exchangeId);
    }
    if (cgResults.has(exchangeId)) {
      return cgResults.get(exchangeId);
    }
    return {
      exchange: exchangeId,
      displayName: CONFIG.exchanges[exchangeId]?.name || exchangeId,
      color: CONFIG.exchanges[exchangeId]?.color || '#888888',
      symbol: `${token}/USDT`,
      price: { last: 0, bid: 0, ask: 0, high24h: 0, low24h: 0 },
      change24h: { absolute: 0, percentage: 0 },
      volume24h: { base: 0, quote: 0 },
      fees: CONFIG.exchanges[exchangeId]?.fees || { maker: 0.10, taker: 0.10 },
      timestamp: Date.now(),
      status: 'offline',
    };
  });

  const activeCount = allExchanges.filter(e => e.status === 'active' && e.price?.last > 0).length;

  return res.status(200).json({
    success: true,
    token,
    timestamp: Date.now(),
    count: activeCount,
    expected: validExchangeIds.length,
    data: allExchanges,
  });
}
