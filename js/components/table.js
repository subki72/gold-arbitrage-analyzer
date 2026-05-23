// ============================================================
// table.js — Sortable comparison table component
// ============================================================

import { appState } from '../services/state.js';
import { rankExchanges, findBestBuy, findBestSell, calculateSpread } from '../services/arbitrage.js';
import { formatCurrency, formatPercentage, formatVolume } from '../utils/formatters.js';
import { $, $$ } from '../utils/helpers.js';
import { EXCHANGE_META } from '../utils/constants.js';

export function initTable() {
  appState.on('exchanges', updateTable);

  // Sort handlers
  document.querySelectorAll('.sort-header').forEach(th => {
    th.addEventListener('click', () => {
      const sortBy = th.dataset.sort;
      const currentSort = appState.get('tableSortBy');
      const currentDir = appState.get('tableSortDir');

      if (currentSort === sortBy) {
        appState.set('tableSortDir', currentDir === 'asc' ? 'desc' : 'asc');
      } else {
        appState.set('tableSortBy', sortBy);
        appState.set('tableSortDir', 'asc');
      }

      // Re-render
      updateTable(appState.get('exchanges'));
    });
  });
}

function updateTable(exchanges) {
  const tbody = $('#exchange-table-body');
  if (!tbody) return;

  const active = exchanges.filter(e => e.price.last > 0);
  if (active.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">Tidak ada data tersedia</td></tr>';
    return;
  }

  const sortBy = appState.get('tableSortBy') || 'price';
  const sortDir = appState.get('tableSortDir') || 'asc';
  const sorted = rankExchanges(active, sortBy, sortDir);

  const bestBuy = findBestBuy(active);
  const bestSell = findBestSell(active);

  // Update sort indicators
  $$('.sort-header').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortBy) {
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  // Build rows
  const fragment = document.createDocumentFragment();

  sorted.forEach(ex => {
    const tr = document.createElement('tr');
    tr.className = 'table-row';
    if (ex.status === 'error') tr.classList.add('row-error');

    const isBestBuy = bestBuy && ex.exchange === bestBuy.exchange;
    const isBestSell = bestSell && ex.exchange === bestSell.exchange;

    // Spread from best buy
    const spreadFromBest = bestBuy ? calculateSpread(bestBuy, ex) : null;

    const changeClass = ex.change24h.percentage >= 0 ? 'trend-up' : 'trend-down';
    const meta = EXCHANGE_META[ex.exchange] || {};

    tr.innerHTML = `
      <td class="cell-exchange">
        <svg class="exchange-icon" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="${ex.color}" stroke="${ex.color}" stroke-opacity="0.3" stroke-width="2"/></svg>
        <span class="exchange-name">${ex.displayName}</span>
        ${isBestBuy ? '<span class="badge badge-buy">Termurah</span>' : ''}
        ${isBestSell ? '<span class="badge badge-sell">Termahal</span>' : ''}
        ${ex.status === 'error' ? '<span class="badge badge-error">Error</span>' : ''}
      </td>
      <td class="cell-price">
        <span class="price-value">${formatCurrency(ex.price.last)}</span>
        <span class="price-range">${formatCurrency(ex.price.low24h, 0)} — ${formatCurrency(ex.price.high24h, 0)}</span>
      </td>
      <td class="cell-change">
        <span class="${changeClass}">${formatPercentage(ex.change24h.percentage)}</span>
        <span class="change-abs">${formatCurrency(ex.change24h.absolute)}</span>
      </td>
      <td class="cell-volume">
        <span>${formatVolume(ex.volume24h.quote)}</span>
        <span class="volume-base">${ex.volume24h.base.toFixed(1)} oz</span>
      </td>
      <td class="cell-fee">
        <span>${ex.fees.maker}% / ${ex.fees.taker}%</span>
        <span class="fee-label">M / T</span>
      </td>
      <td class="cell-spread">
        ${spreadFromBest ? `
          <span class="${spreadFromBest.percentage > 0 ? 'trend-up' : ''}">${formatPercentage(spreadFromBest.percentage, 3)}</span>
          <span class="spread-abs">${formatCurrency(spreadFromBest.absolute)}</span>
        ` : '<span>—</span>'}
      </td>
      <td class="cell-action">
        <a href="${meta.url || '#'}" target="_blank" rel="noopener" class="action-link" title="Buka ${ex.displayName}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
          </svg>
        </a>
      </td>
    `;

    fragment.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}
