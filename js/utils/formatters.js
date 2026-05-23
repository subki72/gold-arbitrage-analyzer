// ============================================================
// formatters.js — Format angka, mata uang, dan waktu
// ============================================================

/**
 * Format angka sebagai mata uang USD
 * @param {number} value
 * @param {number} decimals - jumlah desimal (default: 2)
 * @returns {string}
 */
export function formatCurrency(value, decimals = 2) {
  if (value == null || isNaN(value)) return '$—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format angka sebagai persentase
 * @param {number} value - nilai dalam persen (misal 1.23 untuk 1.23%)
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format volume besar (K, M, B)
 * @param {number} value
 * @returns {string}
 */
export function formatVolume(value) {
  if (value == null || isNaN(value)) return '$—';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/**
 * Format angka dengan pemisah ribuan
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format timestamp ke waktu relatif (Bahasa Indonesia)
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const diff = Math.floor((now - ts) / 1000);

  if (diff < 5) return 'baru saja';
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

/**
 * Format timestamp ke string waktu lokal
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format timestamp ke string tanggal dan waktu
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatDateTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format spread dengan warna class
 * @param {number} spread - spread dalam persen
 * @returns {{ text: string, className: string }}
 */
export function formatSpread(spread) {
  const text = formatPercentage(spread, 3);
  let className = 'spread-neutral';
  if (spread >= 1.0) className = 'spread-great';
  else if (spread >= 0.5) className = 'spread-good';
  else if (spread >= 0.3) className = 'spread-fair';
  else if (spread > 0) className = 'spread-low';
  return { text, className };
}
