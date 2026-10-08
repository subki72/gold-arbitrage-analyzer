// ============================================================
// statsCards.js — Primary KPI cards component (Best Buy, Best Sell, Max Spread, Volume)
// ============================================================

import { appState } from '../services/state.js';
import {
  findBestBuy,
  findBestSell,
  findMaxSpread,
  calculateTotalVolume,
  getEffectiveBuyPrice,
  getEffectiveSellPrice,
} from '../services/arbitrage.js';
import { formatCurrency, formatPercentage, formatVolume } from '../utils/formatters.js';
import { animateValue, $ } from '../utils/helpers.js';
import { CONFIG } from '../config.js';

export function initStatsCards() {
  appState.on('exchanges', updateStatsCards);
}

function updateStatsCards(exchanges) {
  const safeExchanges = Array.isArray(exchanges) ? exchanges : [];
  const bestBuy = findBestBuy(safeExchanges);
  const bestSell = findBestSell(safeExchanges);
  const maxSpreadInfo = findMaxSpread(safeExchanges);
  const totalVolume = calculateTotalVolume(safeExchanges);
  const activeCount = safeExchanges.filter(e => e.status === 'active' && e.price?.last > 0).length;

  // ── Best Buy Card ──
  updateCard('best-buy', {
    value: bestBuy ? getEffectiveBuyPrice(bestBuy) : null,
    formatter: v => formatCurrency(v),
    sub: bestBuy?.displayName || '—',
    trend: bestBuy?.change24h?.percentage,
    accentClass: 'card-green',
  });

  // ── Best Sell Card ──
  updateCard('best-sell', {
    value: bestSell ? getEffectiveSellPrice(bestSell) : null,
    formatter: v => formatCurrency(v),
    sub: bestSell?.displayName || '—',
    trend: bestSell?.change24h?.percentage,
    accentClass: 'card-gold',
  });

  // ── Max Spread Card ──
  const spreadPair = maxSpreadInfo
    ? `${maxSpreadInfo.buyExchange.displayName} → ${maxSpreadInfo.sellExchange.displayName}`
    : '—';
  updateCard('max-spread', {
    value: maxSpreadInfo?.spread?.percentage,
    formatter: v => formatPercentage(v, 3),
    sub: spreadPair,
    spreadValue: maxSpreadInfo?.spread?.absolute,
    accentClass: getSpreadClass(maxSpreadInfo?.spread?.percentage || 0),
  });

  // ── Total Volume Card ──
  updateCard('total-volume', {
    value: activeCount > 0 ? totalVolume : null,
    formatter: v => formatVolume(v),
    sub: `${activeCount} active ${activeCount === 1 ? 'exchange' : 'exchanges'}`,
    accentClass: 'card-blue',
  });
}

function updateCard(cardId, { value, formatter, sub, trend, spreadValue, accentClass }) {
  const valueEl = $(`#${cardId}-value`);
  const subEl = $(`#${cardId}-sub`);
  const trendEl = $(`#${cardId}-trend`);
  const card = $(`#${cardId}-card`);

  if (valueEl && value != null && Number.isFinite(value)) {
    animateValue(valueEl, value, 600, formatter);
  } else if (valueEl) {
    valueEl.textContent = cardId === 'max-spread' ? '—%' : '$—';
  }

  if (subEl) {
    subEl.textContent = sub || '—';
  }

  if (trendEl && trend != null && Number.isFinite(trend)) {
    trendEl.textContent = formatPercentage(trend);
    trendEl.className = `card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`;
  } else if (trendEl) {
    trendEl.textContent = '—';
    trendEl.className = 'card-trend';
  }

  const spreadAbsEl = $(`#${cardId}-abs`);
  if (spreadAbsEl) {
    if (spreadValue != null && Number.isFinite(spreadValue)) {
      spreadAbsEl.textContent = formatCurrency(spreadValue);
    } else {
      spreadAbsEl.textContent = '—';
    }
  }

  // Update visual accent class
  if (card && accentClass) {
    card.className = card.className.replace(/card-(green|gold|red|blue|warning)/g, '').trim();
    card.classList.add(accentClass);
  }
}

function getSpreadClass(percentage) {
  if (percentage >= CONFIG.arbitrage.greatSpread) return 'card-green';
  if (percentage >= CONFIG.arbitrage.goodSpread) return 'card-gold';
  if (percentage >= CONFIG.arbitrage.minSpreadAlert) return 'card-warning';
  return 'card-blue';
}

export default {
  initStatsCards,
};
