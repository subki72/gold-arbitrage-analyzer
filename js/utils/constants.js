// ============================================================
// constants.js — Konstanta aplikasi
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
  STALE: 'stale',
  LOADING: 'loading',
};

// ── UI Labels (Bahasa Indonesia) ──
export const LABELS = {
  // Header
  appTitle: 'Gold Arbitrage Analyzer',
  appSubtitle: 'Analisa Perbandingan Harga Emas',
  
  // Stats Cards
  bestBuy: 'Harga Terendah',
  bestBuyDesc: 'Tempat Beli Terbaik',
  bestSell: 'Harga Tertinggi',
  bestSellDesc: 'Tempat Jual Terbaik',
  maxSpread: 'Spread Terbesar',
  maxSpreadDesc: 'Peluang Arbitrase',
  totalVolume: 'Volume 24 Jam',
  totalVolumeDesc: 'Total Perdagangan',

  // Charts
  priceComparison: 'Perbandingan Harga',
  priceHistory: 'Riwayat Harga',
  spreadHeatmap: 'Peta Sebaran Spread',
  volumeDistribution: 'Distribusi Volume',
  spreadTrend: 'Tren Spread',

  // Table
  exchange: 'Exchange',
  price: 'Harga',
  change24h: 'Perubahan 24J',
  volume: 'Volume',
  fee: 'Fee',
  spread: 'Spread',
  action: 'Aksi',

  // Calculator
  calcTitle: 'Kalkulator Arbitrase',
  buyFrom: 'Beli Dari',
  sellTo: 'Jual Ke',
  amount: 'Jumlah (oz)',
  buyPrice: 'Harga Beli',
  sellPrice: 'Harga Jual',
  buyFee: 'Fee Beli',
  sellFee: 'Fee Jual',
  grossProfit: 'Profit Kotor',
  netProfit: 'Profit Bersih',
  profitPercent: 'Persentase Profit',
  calculate: 'Hitung',

  // Status
  loading: 'Memuat data...',
  error: 'Gagal memuat data',
  lastUpdated: 'Terakhir diperbarui',
  autoRefresh: 'Refresh Otomatis',
  refreshNow: 'Refresh Sekarang',
  online: 'Terhubung',
  offline: 'Tidak Terhubung',

  // Footer
  disclaimer: 'Data bersifat informasional, bukan saran investasi. Harga yang ditampilkan adalah harga indikasi dan mungkin berbeda dari harga eksekusi aktual.',
  dataSource: 'Sumber Data',

  // Misc
  noData: 'Data tidak tersedia',
  notAvailable: 'N/A',
  all: 'Semua',
};

// ── Timeframe Labels ──
export const TIMEFRAMES = {
  '1h': '1 Jam',
  '4h': '4 Jam',
  '24h': '24 Jam',
  '7d': '7 Hari',
};
