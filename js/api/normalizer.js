// ============================================================
// normalizer.js — Normalisasi data dari berbagai exchange
// ============================================================

import { CONFIG } from '../config.js';

/**
 * Schema data ternormalisasi
 */
function createNormalizedData(exchangeId, overrides = {}) {
  const exchangeConfig = CONFIG.exchanges[exchangeId];
  return {
    exchange: exchangeId,
    displayName: exchangeConfig?.name || exchangeId,
    color: exchangeConfig?.color || '#888',
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

// ── Binance ──
export function normalizeBinance(data, symbol) {
  if (!data || !data.lastPrice) return null;
  return createNormalizedData('binance', {
    symbol,
    price: {
      last: parseFloat(data.lastPrice),
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
    },
    change24h: {
      absolute: parseFloat(data.priceChange),
      percentage: parseFloat(data.priceChangePercent),
    },
    volume24h: {
      base: parseFloat(data.volume),
      quote: parseFloat(data.quoteVolume),
    },
  });
}

// ── OKX ──
export function normalizeOKX(data, symbol) {
  if (!data?.data?.[0]) return null;
  const d = data.data[0];
  const last = parseFloat(d.last);
  const open = parseFloat(d.open24h);
  return createNormalizedData('okx', {
    symbol,
    price: {
      last,
      bid: parseFloat(d.bidPx),
      ask: parseFloat(d.askPx),
      high24h: parseFloat(d.high24h),
      low24h: parseFloat(d.low24h),
    },
    change24h: {
      absolute: last - open,
      percentage: open > 0 ? ((last - open) / open) * 100 : 0,
    },
    volume24h: {
      base: parseFloat(d.vol24h),
      quote: parseFloat(d.volCcy24h),
    },
  });
}

// ── Bybit ──
export function normalizeBybit(data, symbol) {
  if (!data?.result?.list?.[0]) return null;
  const d = data.result.list[0];
  const last = parseFloat(d.lastPrice);
  const prev = parseFloat(d.prevPrice24h);
  return createNormalizedData('bybit', {
    symbol,
    price: {
      last,
      bid: parseFloat(d.bid1Price),
      ask: parseFloat(d.ask1Price),
      high24h: parseFloat(d.highPrice24h),
      low24h: parseFloat(d.lowPrice24h),
    },
    change24h: {
      absolute: last - prev,
      percentage: prev > 0 ? ((last - prev) / prev) * 100 : 0,
    },
    volume24h: {
      base: parseFloat(d.volume24h),
      quote: parseFloat(d.turnover24h),
    },
  });
}

// ── KuCoin ──
export function normalizeKuCoin(data, symbol) {
  if (!data?.data) return null;
  const d = data.data;
  const last = parseFloat(d.last);
  const changeRate = parseFloat(d.changeRate);
  return createNormalizedData('kucoin', {
    symbol,
    price: {
      last,
      bid: parseFloat(d.buy),
      ask: parseFloat(d.sell),
      high24h: parseFloat(d.high),
      low24h: parseFloat(d.low),
    },
    change24h: {
      absolute: parseFloat(d.changePrice),
      percentage: changeRate * 100,
    },
    volume24h: {
      base: parseFloat(d.vol),
      quote: parseFloat(d.volValue),
    },
  });
}

// ── HTX (Huobi) ──
export function normalizeHTX(data, symbol) {
  if (!data?.tick) return null;
  const d = data.tick;
  return createNormalizedData('htx', {
    symbol,
    price: {
      last: parseFloat(d.close),
      bid: parseFloat(d.bid?.[0] || d.close),
      ask: parseFloat(d.ask?.[0] || d.close),
      high24h: parseFloat(d.high),
      low24h: parseFloat(d.low),
    },
    change24h: {
      absolute: parseFloat(d.close) - parseFloat(d.open),
      percentage: d.open > 0 ? ((d.close - d.open) / d.open) * 100 : 0,
    },
    volume24h: {
      base: parseFloat(d.amount),
      quote: parseFloat(d.vol),
    },
  });
}

// ── Gate.io ──
export function normalizeGateIO(data, symbol) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  const d = data[0];
  return createNormalizedData('gateio', {
    symbol,
    price: {
      last: parseFloat(d.last),
      bid: parseFloat(d.highest_bid),
      ask: parseFloat(d.lowest_ask),
      high24h: parseFloat(d.high_24h),
      low24h: parseFloat(d.low_24h),
    },
    change24h: {
      absolute: parseFloat(d.last) - (parseFloat(d.last) / (1 + parseFloat(d.change_percentage) / 100)),
      percentage: parseFloat(d.change_percentage),
    },
    volume24h: {
      base: parseFloat(d.base_volume),
      quote: parseFloat(d.quote_volume),
    },
  });
}

// ── MEXC ──
export function normalizeMEXC(data, symbol) {
  if (!data || !data.lastPrice) return null;
  return createNormalizedData('mexc', {
    symbol,
    price: {
      last: parseFloat(data.lastPrice),
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
    },
    change24h: {
      absolute: parseFloat(data.priceChange),
      percentage: parseFloat(data.priceChangePercent),
    },
    volume24h: {
      base: parseFloat(data.volume),
      quote: parseFloat(data.quoteVolume),
    },
  });
}

// ── Bitfinex ──
export function normalizeBitfinex(data, symbol) {
  if (!data || !Array.isArray(data) || data.length < 10) return null;
  // Bitfinex ticker array: [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_PERC, LAST_PRICE, VOLUME, HIGH, LOW]
  return createNormalizedData('bitfinex', {
    symbol,
    price: {
      last: data[6],
      bid: data[0],
      ask: data[2],
      high24h: data[8],
      low24h: data[9],
    },
    change24h: {
      absolute: data[4],
      percentage: data[5] * 100,
    },
    volume24h: {
      base: data[7],
      quote: data[7] * data[6],
    },
  });
}

// ── CoinGecko (fallback) ──
export function normalizeCoinGeckoTicker(ticker, tokenSymbol) {
  const exchangeId = mapCoinGeckoExchangeId(ticker.market?.identifier);
  if (!exchangeId) return null;
  
  const last = ticker.last || 0;
  return createNormalizedData(exchangeId, {
    symbol: `${tokenSymbol}/USDT`,
    price: {
      last,
      bid: ticker.bid_ask_spread_percentage 
        ? last * (1 - ticker.bid_ask_spread_percentage / 200) 
        : last,
      ask: ticker.bid_ask_spread_percentage 
        ? last * (1 + ticker.bid_ask_spread_percentage / 200)
        : last,
      high24h: last,
      low24h: last,
    },
    change24h: {
      absolute: 0,
      percentage: 0,
    },
    volume24h: {
      base: ticker.volume || 0,
      quote: (ticker.volume || 0) * last,
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
