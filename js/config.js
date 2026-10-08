// ============================================================
// config.js — Gold Arbitrage Analyzer configuration
// ============================================================

export const CONFIG = {
  // ── Refresh Settings ──
  refreshInterval: 30000,       // 30 seconds default
  refreshIntervalOptions: [
    { label: '15s', value: 15000 },
    { label: '30s', value: 30000 },
    { label: '1m', value: 60000 },
    { label: '5m', value: 300000 },
  ],

  // ── API Timeout ──
  apiTimeout: 8000,             // 8 seconds request timeout

  // ── Cache TTL ──
  cacheTTL: 25000,              // 25 seconds cache TTL

  // ── Token Pairs ──
  tokens: {
    PAXG: {
      id: 'pax-gold',
      symbol: 'PAXG',
      name: 'PAX Gold',
      coingeckoId: 'pax-gold',
      transferFeeRate: 0.0002,  // 0.02% Paxos smart contract transfer fee
      pairs: {
        binance: 'PAXGUSDT',
        okx: 'PAXG-USDT',
        bybit: null,            // Not listed on Bybit spot
        kucoin: 'PAXG-USDT',
        htx: null,              // Not listed on HTX spot
        gateio: 'PAXG_USDT',
        mexc: 'GOLD(PAXG)USDT', // MEXC GOLD prefix with parentheses
        bitfinex: null,         // Not listed on Bitfinex
      }
    },
    XAUT: {
      id: 'tether-gold',
      symbol: 'XAUT',
      name: 'Tether Gold',
      coingeckoId: 'tether-gold',
      transferFeeRate: 0.0,     // No contract level transfer fee
      pairs: {
        binance: null,          // Not listed on Binance
        okx: 'XAUT-USDT',
        bybit: 'XAUTUSDT',
        kucoin: 'XAUT-USDT',
        htx: 'xautusdt',
        gateio: 'XAUT_USDT',
        mexc: 'GOLD(XAUT)USDT', // MEXC GOLD prefix with parentheses
        bitfinex: 'tXAUT:USD',  // Bitfinex colon symbol notation
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
      { label: '1H', value: '1h', minutes: 60 },
      { label: '4H', value: '4h', minutes: 240 },
      { label: '24H', value: '24h', minutes: 1440 },
      { label: '7D', value: '7d', minutes: 10080 },
    ],
  }
};

export default CONFIG;
