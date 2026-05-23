// ============================================================
// statsCards.js — Stats cards component (Best Buy, Best Sell, Max Spread, Volume)
// ============================================================

import { appState } from '../services/state.js';
import { findBestBuy, findBestSell, findMaxSpread, calculateTotalVolume } from '../services/arbitrage.js';
import { formatCurrency, formatPercentage, formatVolume } from '../utils/formatters.js';
import { animateValue, $ } from '../utils/helpers.js';

export function initStatsCards() {
  appState.on('exchanges', updateStatsCards);
}

function updateStatsCards(exchanges) {
  if (!exchanges || exchanges.length === 0) return;

  const bestBuy = findBestBuy(exchanges);
  const bestSell = findBestSell(exchanges);
  const maxSpreadInfo = findMaxSpread(exchanges);
  const totalVolume = calculateTotalVolume(exchanges);

  // ── Best Buy Card ──
  updateCard('best-buy', {
    value: bestBuy?.price.last,
    formatter: v => formatCurrency(v),
    sub: bestBuy?.displayName || '—',
    trend: bestBuy?.change24h.percentage,
    accentClass: 'card-green',
  });

  // ── Best Sell Card ──
  updateCard('best-sell', {
    value: bestSell?.price.last,
    formatter: v => formatCurrency(v),
    sub: bestSell?.displayName || '—',
    trend: bestSell?.change24h.percentage,
    accentClass: 'card-gold',
  });

  // ── Max Spread Card ──
  const spreadPair = maxSpreadInfo
    ? `${maxSpreadInfo.buyExchange.displayName} → ${maxSpreadInfo.sellExchange.displayName}`
    : '—';
  updateCard('max-spread', {
    value: maxSpreadInfo?.spread.percentage,
    formatter: v => formatPercentage(v, 3),
    sub: spreadPair,
    spreadValue: maxSpreadInfo?.spread.absolute,
    accentClass: getSpreadClass(maxSpreadInfo?.spread.percentage),
  });

  // ── Total Volume Card ──
  updateCard('total-volume', {
    value: totalVolume,
    formatter: v => formatVolume(v),
    sub: `${exchanges.filter(e => e.status === 'active').length} exchange aktif`,
    accentClass: 'card-blue',
  });
}

function updateCard(cardId, { value, formatter, sub, trend, spreadValue, accentClass }) {
  const valueEl = $(`#${cardId}-value`);
  const subEl = $(`#${cardId}-sub`);
  const trendEl = $(`#${cardId}-trend`);
  const card = $(`#${cardId}-card`);

  if (valueEl && value != null) {
    animateValue(valueEl, value, 600, formatter);
  }

  if (subEl && sub) {
    subEl.textContent = sub;
  }

  if (trendEl && trend != null) {
    trendEl.textContent = formatPercentage(trend);
    trendEl.className = `card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`;
  }

  if (spreadValue != null) {
    const spreadAbsEl = $(`#${cardId}-abs`);
    if (spreadAbsEl) {
      spreadAbsEl.textContent = formatCurrency(spreadValue);
    }
  }

  // Update accent class
  if (card && accentClass) {
    card.className = card.className.replace(/card-(green|gold|red|blue|warning)/g, '').trim();
    card.classList.add(accentClass);
  }
}

function getSpreadClass(percentage) {
  if (percentage >= 1.0) return 'card-green';
  if (percentage >= 0.5) return 'card-gold';
  if (percentage >= 0.3) return 'card-warning';
  return 'card-blue';
}
