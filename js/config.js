// ============================================================
// config.js — Konfigurasi aplikasi Gold Arbitrage Analyzer
// ============================================================

export const CONFIG = {
  // ── Refresh Settings ──
  refreshInterval: 30000,       // 30 detik
  refreshIntervalOptions: [
    { label: '15 detik', value: 15000 },
    { label: '30 detik', value: 30000 },
    { label: '1 menit', value: 60000 },
    { label: '5 menit', value: 300000 },
  ],

  // ── API Timeout ──
  apiTimeout: 8000,             // 8 detik timeout per request

  // ── Cache TTL ──
  cacheTTL: 25000,              // 25 detik cache

  // ── Token Pairs ──
  tokens: {
    PAXG: {
      id: 'pax-gold',
      symbol: 'PAXG',
      name: 'PAX Gold',
      coingeckoId: 'pax-gold',
      pairs: {
        binance: 'PAXGUSDT',
        okx: 'PAXG-USDT',
        bybit: 'PAXGUSDT',
        kucoin: 'PAXG-USDT',
        htx: 'paxgusdt',
        gateio: 'PAXG_USDT',
        mexc: 'PAXGUSDT',
      }
    },
    XAUT: {
      id: 'tether-gold',
      symbol: 'XAUT',
      name: 'Tether Gold',
      coingeckoId: 'tether-gold',
      pairs: {
        binance: null,          // Not available on Binance
        okx: 'XAUT-USDT',
        bybit: 'XAUTUSDT',
        kucoin: 'XAUT-USDT',
        htx: 'xautusdt',
        gateio: 'XAUT_USDT',
        mexc: 'XAUTUSDT',
        bitfinex: 'tXAUTUSD',
      }
    }
  },

  // ── Exchange Configurations ──
  exchanges: {
    binance: {
      name: 'Binance',
      color: '#F0B90B',
      fees: { maker: 0.10, taker: 0.10 },
      api: {
        ticker: 'https://api.binance.com/api/v3/ticker/24hr',
        klines: 'https://api.binance.com/api/v3/klines',
      }
    },
    okx: {
      name: 'OKX',
      color: '#FFFFFF',
      fees: { maker: 0.08, taker: 0.10 },
      api: {
        ticker: 'https://www.okx.com/api/v5/market/ticker',
        klines: 'https://www.okx.com/api/v5/market/candles',
      }
    },
    bybit: {
      name: 'Bybit',
      color: '#F7A600',
      fees: { maker: 0.10, taker: 0.10 },
      api: {
        ticker: 'https://api.bybit.com/v5/market/tickers',
        klines: 'https://api.bybit.com/v5/market/kline',
      }
    },
    kucoin: {
      name: 'KuCoin',
      color: '#24AE8F',
      fees: { maker: 0.10, taker: 0.10 },
      api: {
        ticker: 'https://api.kucoin.com/api/v1/market/stats',
        klines: 'https://api.kucoin.com/api/v1/market/candles',
      }
    },
    htx: {
      name: 'HTX',
      color: '#2B6DEA',
      fees: { maker: 0.20, taker: 0.20 },
      api: {
        ticker: 'https://api.huobi.pro/market/detail/merged',
        klines: 'https://api.huobi.pro/market/history/kline',
      }
    },
    gateio: {
      name: 'Gate.io',
      color: '#2354E6',
      fees: { maker: 0.10, taker: 0.10 },
      api: {
        ticker: 'https://api.gateio.ws/api/v4/spot/tickers',
        klines: 'https://api.gateio.ws/api/v4/spot/candlesticks',
      }
    },
    mexc: {
      name: 'MEXC',
      color: '#00B897',
      fees: { maker: 0.10, taker: 0.10 },
      api: {
        ticker: 'https://api.mexc.com/api/v3/ticker/24hr',
        klines: 'https://api.mexc.com/api/v3/klines',
      }
    },
    bitfinex: {
      name: 'Bitfinex',
      color: '#16B157',
      fees: { maker: 0.10, taker: 0.20 },
      api: {
        ticker: 'https://api-pub.bitfinex.com/v2/ticker',
        klines: 'https://api-pub.bitfinex.com/v2/candles',
      }
    }
  },

  // ── CoinGecko (Fallback) ──
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: 10,  // calls per minute (free tier)
  },

  // ── Arbitrage Thresholds ──
  arbitrage: {
    minSpreadAlert: 0.3,        // Minimum spread % to show alert
    goodSpread: 0.5,            // Good opportunity threshold
    greatSpread: 1.0,           // Great opportunity threshold
  },

  // ── Chart Settings ──
  chart: {
    maxDataPoints: 100,
    timeframes: [
      { label: '1J', value: '1h', minutes: 60 },
      { label: '4J', value: '4h', minutes: 240 },
      { label: '24J', value: '24h', minutes: 1440 },
      { label: '7H', value: '7d', minutes: 10080 },
    ],
  }
};
