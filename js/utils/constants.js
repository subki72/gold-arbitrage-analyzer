// ============================================================
// constants.js — Application constants & English UI labels
// ============================================================

// ── Exchange Metadata ──
export const EXCHANGE_META = {
  binance:  { icon: 'circle-dot', rank: 1, url: 'https://www.binance.com' },
  okx:      { icon: 'circle-dot', rank: 2, url: 'https://www.okx.com' },
  bybit:    { icon: 'circle-dot', rank: 3, url: 'https://www.bybit.com' },
  kucoin:   { icon: 'circle-dot', rank: 4, url: 'https://www.kucoin.com' },
  htx:      { icon: 'circle-dot', rank: 5, url: 'https://www.htx.com' },
  gateio:   { icon: 'circle-dot', rank: 6, url: 'https://www.gate.io' },
  mexc:     { icon: 'circle-dot', rank: 7, url: 'https://www.mexc.com' },
  bitfinex: { icon: 'circle-dot', rank: 8, url: 'https://www.bitfinex.com' },
};

// ── Chart Color Palette ──
export const CHART_COLORS = [
  '#F0B90B',  // Binance yellow
  '#AAAAAA',  // OKX white/gray
  '#F7A600',  // Bybit orange
  '#24AE8F',  // KuCoin green
  '#2B6DEA',  // HTX blue
  '#2354E6',  // Gate.io blue
  '#00B897',  // MEXC teal
  '#16B157',  // Bitfinex green
];

export const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '33');

// ── Status Labels ──
export const STATUS = {
  ACTIVE: 'active',
  ERROR: 'error',
  OFFLINE: 'offline',
  STALE: 'stale',
  LOADING: 'loading',
};

// ── UI Labels (100% English Standardization) ──
export const LABELS = {
  // Header
  appTitle: 'Gold Arbitrage Analyzer',
  appSubtitle: 'Gold Token Price Comparison & Arbitrage',
  
  // Stats Cards
  bestBuy: 'Lowest Price',
  bestBuyDesc: 'Best Buy Execution',
  bestSell: 'Highest Price',
  bestSellDesc: 'Best Sell Execution',
  maxSpread: 'Max Spread',
  maxSpreadDesc: 'Arbitrage Opportunity',
  totalVolume: '24h Volume',
  totalVolumeDesc: 'Total Market Turnover',

  // Charts
  priceComparison: 'Price Comparison Across Exchanges',
  priceHistory: 'Price History',
  spreadHeatmap: 'Spread Heatmap Matrix',
  volumeDistribution: 'Volume Distribution',
  spreadTrend: 'Spread Trend',

  // Table
  exchange: 'Exchange',
  price: 'Price',
  change24h: '24h Change',
  volume: 'Volume',
  fee: 'Fee (M/T)',
  spread: 'Spread vs Best',
  action: 'Action',

  // Calculator
  calcTitle: 'Arbitrage Calculator',
  buyFrom: 'Buy From',
  sellTo: 'Sell To',
  amount: 'Amount (troy oz)',
  withdrawalFee: 'Withdrawal Fee (USD)',
  gasFee: 'Gas Fee (USD)',
  transferFee: 'Token Transfer Fee',
  buyPrice: 'Buy Price',
  sellPrice: 'Sell Price',
  buyFee: 'Buy Fee',
  sellFee: 'Sell Fee',
  grossProfit: 'Gross Profit',
  netProfit: 'Net Profit',
  profitPercent: 'Profit Percentage',
  calculate: 'Calculate',
  profitable: '✓ Profitable',
  unprofitable: '✗ Unprofitable',
  selectExchange: 'Select exchange',
  autoPair: 'Auto-fill Best Pair',

  // Status & Telemetry
  loading: 'Loading data...',
  error: 'Failed to load data',
  lastUpdated: 'Last updated',
  autoRefresh: 'Auto Refresh',
  refreshNow: 'Refresh Now',
  online: 'Connected',
  offline: 'Disconnected',
  insufficientData: 'Insufficient Live Market Data',

  // Footer
  disclaimer: 'Data is for informational purposes only and does not constitute financial advice. Displayed prices are indicative and may differ from actual execution prices. Always conduct your own research (DYOR) before trading.',
  dataSource: 'Data Source: Exchange Public APIs',

  // Misc
  noData: 'No data available',
  notAvailable: 'N/A',
  all: 'All',
};

// ── Timeframe Labels ──
export const TIMEFRAMES = {
  '1h': '1 Hour',
  '4h': '4 Hours',
  '24h': '24 Hours',
  '7d': '7 Days',
};

export default {
  EXCHANGE_META,
  CHART_COLORS,
  CHART_COLORS_ALPHA,
  STATUS,
  LABELS,
  TIMEFRAMES,
};
