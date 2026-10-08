// ============================================================
// normalizer.js — Normalization of multi-exchange market feeds
// ============================================================

import { CONFIG } from '../config.js';

/**
 * Bitfinex REST v2 ticker tuple indices
 */
export const BFX_INDEX = {
  BID: 0,
  BID_SIZE: 1,
  ASK: 2,
  ASK_SIZE: 3,
  DAILY_CHANGE: 4,
  DAILY_CHANGE_PERC: 5,
  LAST_PRICE: 6,
  VOLUME: 7,
  HIGH: 8,
  LOW: 9,
};

/**
 * Helper to safely parse floating point numbers with a fallback
 * @param {*} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
function safeFloat(value, fallback = 0) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Creates a normalized exchange data structure
 * @param {string} exchangeId
 * @param {Object} [overrides={}]
 * @returns {Object}
 */
export function createNormalizedData(exchangeId, overrides = {}) {
  const exchangeConfig = CONFIG.exchanges[exchangeId];
  return {
    exchange: exchangeId,
    displayName: exchangeConfig?.name || exchangeId,
    color: exchangeConfig?.color || '#888888',
    symbol: '',
    price: {
      last: 0,
      bid: 0,
      ask: 0,
      high24h: 0,
      low24h: 0,
    },
    change24h: {
      absolute: 0,
      percentage: 0,
    },
    volume24h: {
      base: 0,
      quote: 0,
    },
    fees: exchangeConfig?.fees || { maker: 0.10, taker: 0.10 },
    timestamp: Date.now(),
    status: 'active',
    ...overrides,
  };
}

// ── Binance Normalizer ──
export function normalizeBinance(data, symbol) {
  if (!data || data.lastPrice == null) return null;
  const last = safeFloat(data.lastPrice);
  return createNormalizedData('binance', {
    symbol,
    price: {
      last,
      bid: safeFloat(data.bidPrice, last),
      ask: safeFloat(data.askPrice, last),
      high24h: safeFloat(data.highPrice, last),
      low24h: safeFloat(data.lowPrice, last),
    },
    change24h: {
      absolute: safeFloat(data.priceChange),
      percentage: safeFloat(data.priceChangePercent),
    },
    volume24h: {
      base: safeFloat(data.volume),
      quote: safeFloat(data.quoteVolume),
    },
  });
}

// ── OKX Normalizer ──
export function normalizeOKX(data, symbol) {
  if (!data?.data?.[0]) return null;
  const ticker = data.data[0];
  const last = safeFloat(ticker.last);
  const open = safeFloat(ticker.open24h);
  return createNormalizedData('okx', {
    symbol,
    price: {
      last,
      bid: safeFloat(ticker.bidPx, last),
      ask: safeFloat(ticker.askPx, last),
      high24h: safeFloat(ticker.high24h, last),
      low24h: safeFloat(ticker.low24h, last),
    },
    change24h: {
      absolute: last - open,
      percentage: open > 0 ? ((last - open) / open) * 100 : 0,
    },
    volume24h: {
      base: safeFloat(ticker.vol24h),
      quote: safeFloat(ticker.volCcy24h),
    },
  });
}

// ── Bybit Normalizer ──
export function normalizeBybit(data, symbol) {
  if (!data?.result?.list?.[0]) return null;
  const ticker = data.result.list[0];
  const last = safeFloat(ticker.lastPrice);
  const prev = safeFloat(ticker.prevPrice24h);
  return createNormalizedData('bybit', {
    symbol,
    price: {
      last,
      bid: safeFloat(ticker.bid1Price, last),
      ask: safeFloat(ticker.ask1Price, last),
      high24h: safeFloat(ticker.highPrice24h, last),
      low24h: safeFloat(ticker.lowPrice24h, last),
    },
    change24h: {
      absolute: last - prev,
      percentage: prev > 0 ? ((last - prev) / prev) * 100 : 0,
    },
    volume24h: {
      base: safeFloat(ticker.volume24h),
      quote: safeFloat(ticker.turnover24h),
    },
  });
}

// ── KuCoin Normalizer ──
export function normalizeKuCoin(data, symbol) {
  if (!data?.data) return null;
  const ticker = data.data;
  const last = safeFloat(ticker.last);
  const changeRate = safeFloat(ticker.changeRate);
  return createNormalizedData('kucoin', {
    symbol,
    price: {
      last,
      bid: safeFloat(ticker.buy, last),
      ask: safeFloat(ticker.sell, last),
      high24h: safeFloat(ticker.high, last),
      low24h: safeFloat(ticker.low, last),
    },
    change24h: {
      absolute: safeFloat(ticker.changePrice),
      percentage: changeRate * 100,
    },
    volume24h: {
      base: safeFloat(ticker.vol),
      quote: safeFloat(ticker.volValue),
    },
  });
}

// ── HTX (Huobi) Normalizer ──
export function normalizeHTX(data, symbol) {
  if (!data?.tick) return null;
  const tick = data.tick;
  const last = safeFloat(tick.close);
  const open = safeFloat(tick.open);
  return createNormalizedData('htx', {
    symbol,
    price: {
      last,
      bid: safeFloat(tick.bid?.[0], last),
      ask: safeFloat(tick.ask?.[0], last),
      high24h: safeFloat(tick.high, last),
      low24h: safeFloat(tick.low, last),
    },
    change24h: {
      absolute: last - open,
      percentage: open > 0 ? ((last - open) / open) * 100 : 0,
    },
    volume24h: {
      base: safeFloat(tick.amount),
      quote: safeFloat(tick.vol),
    },
  });
}

// ── Gate.io Normalizer ──
export function normalizeGateIO(data, symbol) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  const ticker = data[0];
  const last = safeFloat(ticker.last);
  const changePct = safeFloat(ticker.change_percentage);
  const prevPrice = 1 + (changePct / 100);
  const absoluteChange = prevPrice > 0 ? last - (last / prevPrice) : 0;
  return createNormalizedData('gateio', {
    symbol,
    price: {
      last,
      bid: safeFloat(ticker.highest_bid, last),
      ask: safeFloat(ticker.lowest_ask, last),
      high24h: safeFloat(ticker.high_24h, last),
      low24h: safeFloat(ticker.low_24h, last),
    },
    change24h: {
      absolute: absoluteChange,
      percentage: changePct,
    },
    volume24h: {
      base: safeFloat(ticker.base_volume),
      quote: safeFloat(ticker.quote_volume),
    },
  });
}

// ── MEXC Normalizer ──
export function normalizeMEXC(data, symbol) {
  if (!data || data.lastPrice == null) return null;
  const last = safeFloat(data.lastPrice);
  return createNormalizedData('mexc', {
    symbol,
    price: {
      last,
      bid: safeFloat(data.bidPrice, last),
      ask: safeFloat(data.askPrice, last),
      high24h: safeFloat(data.highPrice, last),
      low24h: safeFloat(data.lowPrice, last),
    },
    change24h: {
      absolute: safeFloat(data.priceChange),
      percentage: safeFloat(data.priceChangePercent),
    },
    volume24h: {
      base: safeFloat(data.volume),
      quote: safeFloat(data.quoteVolume),
    },
  });
}

// ── Bitfinex Normalizer ──
export function normalizeBitfinex(data, symbol) {
  if (!data || !Array.isArray(data) || data.length <= BFX_INDEX.LOW) return null;
  const last = safeFloat(data[BFX_INDEX.LAST_PRICE]);
  const volume = safeFloat(data[BFX_INDEX.VOLUME]);
  return createNormalizedData('bitfinex', {
    symbol,
    price: {
      last,
      bid: safeFloat(data[BFX_INDEX.BID], last),
      ask: safeFloat(data[BFX_INDEX.ASK], last),
      high24h: safeFloat(data[BFX_INDEX.HIGH], last),
      low24h: safeFloat(data[BFX_INDEX.LOW], last),
    },
    change24h: {
      absolute: safeFloat(data[BFX_INDEX.DAILY_CHANGE]),
      percentage: safeFloat(data[BFX_INDEX.DAILY_CHANGE_PERC]) * 100,
    },
    volume24h: {
      base: volume,
      quote: volume * last,
    },
  });
}

// ── CoinGecko Fallback Normalizer ──
export function normalizeCoinGeckoTicker(ticker, tokenSymbol) {
  const exchangeId = mapCoinGeckoExchangeId(ticker?.market?.identifier);
  if (!exchangeId) return null;

  const last = safeFloat(ticker.last);
  const spreadPct = safeFloat(ticker.bid_ask_spread_percentage);
  const baseVolume = safeFloat(ticker.volume);

  return createNormalizedData(exchangeId, {
    symbol: `${tokenSymbol}/USDT`,
    price: {
      last,
      bid: spreadPct > 0 ? last * (1 - spreadPct / 200) : last,
      ask: spreadPct > 0 ? last * (1 + spreadPct / 200) : last,
      high24h: last,
      low24h: last,
    },
    change24h: {
      absolute: 0,
      percentage: 0,
    },
    volume24h: {
      base: baseVolume,
      quote: baseVolume * last,
    },
  });
}

function mapCoinGeckoExchangeId(cgId) {
  const map = {
    'binance': 'binance',
    'okex': 'okx',
    'bybit_spot': 'bybit',
    'kucoin': 'kucoin',
    'huobi': 'htx',
    'gate': 'gateio',
    'mxc': 'mexc',
    'bitfinex': 'bitfinex',
  };
  return map[cgId] || null;
}

export default {
  BFX_INDEX,
  createNormalizedData,
  normalizeBinance,
  normalizeOKX,
  normalizeBybit,
  normalizeKuCoin,
  normalizeHTX,
  normalizeGateIO,
  normalizeMEXC,
  normalizeBitfinex,
  normalizeCoinGeckoTicker,
};
