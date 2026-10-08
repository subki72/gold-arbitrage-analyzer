// ============================================================
// formatters.js — Number, currency, and date/time formatters
// ============================================================

import { CONFIG } from '../config.js';

/**
 * Safe financial decimal rounding to prevent IEEE 754 precision artifacts
 * @param {number} value
 * @param {number} [decimals=4]
 * @returns {number}
 */
export function roundFinancial(value, decimals = 4) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format numeric value as USD currency string
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatCurrency(value, decimals = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '$—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format numeric value as percentage string
 * @param {number} value - Value in percentage (e.g. 1.23 for 1.23%)
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatPercentage(value, decimals = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—%';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large turnover volume with metric suffixes (K, M, B)
 * @param {number} value
 * @returns {string}
 */
export function formatVolume(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '$—';
  }
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/**
 * Format numeric value with comma thousands separators
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format timestamp into relative time string (English)
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const ts = timestamp instanceof Date ? timestamp.getTime() : Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) return '—';

  const diff = Math.floor((now - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Format timestamp into local time string (en-US)
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format timestamp into full date and time string (en-US)
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatDateTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format spread with CSS status classification
 * @param {number} spread - Spread percentage
 * @returns {{ text: string, className: string }}
 */
export function formatSpreadBadge(spread) {
  if (typeof spread !== 'number' || !Number.isFinite(spread)) {
    return { text: '—', className: '' };
  }
  if (spread >= CONFIG.arbitrage.greatSpread) {
    return { text: formatPercentage(spread), className: 'spread-great' };
  }
  if (spread >= CONFIG.arbitrage.goodSpread) {
    return { text: formatPercentage(spread), className: 'spread-good' };
  }
  if (spread >= CONFIG.arbitrage.minSpreadAlert) {
    return { text: formatPercentage(spread), className: 'spread-ok' };
  }
  return { text: formatPercentage(spread), className: 'spread-neutral' };
}

export default {
  roundFinancial,
  formatCurrency,
  formatPercentage,
  formatVolume,
  formatNumber,
  formatTimeAgo,
  formatTime,
  formatDateTime,
  formatSpreadBadge,
};
