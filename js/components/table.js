// ============================================================
// table.js — Comparison table component with safe DOM rendering
// ============================================================

import { appState } from '../services/state.js';
import { rankExchanges, findBestBuy, findBestSell, calculateSpread } from '../services/arbitrage.js';
import { formatCurrency, formatPercentage, formatVolume } from '../utils/formatters.js';
import { $, $$ } from '../utils/helpers.js';
import { EXCHANGE_META } from '../utils/constants.js';

export function initTable() {
  appState.on('exchanges', updateTable);

  // Column sort click handlers
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

      updateTable(appState.get('exchanges') || []);
    });
  });
}

function updateTable(exchanges) {
  const tbody = $('#exchange-table-body');
  if (!tbody) return;

  if (!exchanges || exchanges.length === 0) {
    tbody.innerHTML = '';
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 7;
    emptyCell.className = 'no-data';
    emptyCell.textContent = 'No market data available';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }

  const active = exchanges.filter(e => e.status === 'active' && e.price?.last > 0);
  const offline = exchanges.filter(e => e.status !== 'active' || !e.price?.last);

  const sortBy = appState.get('tableSortBy') || 'price';
  const sortDir = appState.get('tableSortDir') || 'asc';
  const sortedActive = rankExchanges(active, sortBy, sortDir);
  const displayList = [...sortedActive, ...offline];

  const bestBuy = findBestBuy(active);
  const bestSell = findBestSell(active);

  // Update sort indicators in header
  $$('.sort-header').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortBy) {
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  const fragment = document.createDocumentFragment();

  displayList.forEach(ex => {
    const isOffline = ex.status === 'offline' || ex.status === 'error' || !ex.price?.last;
    const tr = document.createElement('tr');
    tr.className = isOffline ? 'table-row row-error' : 'table-row';

    const isBestBuy = !isOffline && bestBuy && ex.exchange === bestBuy.exchange;
    const isBestSell = !isOffline && bestSell && ex.exchange === bestSell.exchange;
    const spreadFromBest = (!isOffline && bestBuy) ? calculateSpread(bestBuy, ex) : null;
    const meta = EXCHANGE_META[ex.exchange] || {};
    const safeColor = ex.color || '#888888';

    // 1. Cell: Exchange
    const cellExchange = document.createElement('td');
    cellExchange.className = 'cell-exchange';

    // SVG dot icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'exchange-icon');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 14 14');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '7');
    circle.setAttribute('cy', '7');
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', safeColor);
    circle.setAttribute('stroke', safeColor);
    circle.setAttribute('stroke-opacity', '0.3');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);
    cellExchange.appendChild(svg);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'exchange-name';
    nameSpan.textContent = ex.displayName || ex.exchange;
    cellExchange.appendChild(nameSpan);

    if (isBestBuy) {
      const badgeBuy = document.createElement('span');
      badgeBuy.className = 'badge badge-buy';
      badgeBuy.textContent = 'Best Buy';
      cellExchange.appendChild(badgeBuy);
    }

    if (isBestSell) {
      const badgeSell = document.createElement('span');
      badgeSell.className = 'badge badge-sell';
      badgeSell.textContent = 'Best Sell';
      cellExchange.appendChild(badgeSell);
    }

    if (isOffline) {
      const badgeErr = document.createElement('span');
      badgeErr.className = 'badge badge-error';
      badgeErr.textContent = 'Offline';
      cellExchange.appendChild(badgeErr);
    }
    tr.appendChild(cellExchange);

    // 2. Cell: Price
    const cellPrice = document.createElement('td');
    cellPrice.className = 'cell-price';
    const priceVal = document.createElement('span');
    priceVal.className = 'price-value';
    priceVal.textContent = isOffline ? '$—' : formatCurrency(ex.price?.last);
    cellPrice.appendChild(priceVal);

    const priceRange = document.createElement('span');
    priceRange.className = 'price-range';
    priceRange.textContent = isOffline
      ? '—'
      : `${formatCurrency(ex.price?.low24h, 0)} — ${formatCurrency(ex.price?.high24h, 0)}`;
    cellPrice.appendChild(priceRange);
    tr.appendChild(cellPrice);

    // 3. Cell: Change 24h
    const cellChange = document.createElement('td');
    cellChange.className = 'cell-change';
    const changeSpan = document.createElement('span');
    if (isOffline) {
      changeSpan.className = 'text-muted';
      changeSpan.textContent = '—';
    } else {
      const changePct = ex.change24h?.percentage || 0;
      changeSpan.className = changePct >= 0 ? 'trend-up' : 'trend-down';
      changeSpan.textContent = formatPercentage(changePct);
    }
    cellChange.appendChild(changeSpan);

    const changeAbs = document.createElement('span');
    changeAbs.className = 'change-abs';
    changeAbs.textContent = isOffline ? '—' : formatCurrency(ex.change24h?.absolute || 0);
    cellChange.appendChild(changeAbs);
    tr.appendChild(cellChange);

    // 4. Cell: Volume
    const cellVolume = document.createElement('td');
    cellVolume.className = 'cell-volume';
    const volSpan = document.createElement('span');
    volSpan.textContent = isOffline ? '$—' : formatVolume(ex.volume24h?.quote || 0);
    cellVolume.appendChild(volSpan);

    const volBase = document.createElement('span');
    volBase.className = 'volume-base';
    volBase.textContent = isOffline ? '—' : `${(ex.volume24h?.base || 0).toFixed(1)} oz`;
    cellVolume.appendChild(volBase);
    tr.appendChild(cellVolume);

    // 5. Cell: Fees
    const cellFee = document.createElement('td');
    cellFee.className = 'cell-fee';
    const feeSpan = document.createElement('span');
    feeSpan.textContent = `${ex.fees?.maker ?? 0.1}% / ${ex.fees?.taker ?? 0.1}%`;
    cellFee.appendChild(feeSpan);

    const feeLabel = document.createElement('span');
    feeLabel.className = 'fee-label';
    feeLabel.textContent = 'M / T';
    feeLabel.title = 'Maker Fee / Taker Fee';
    cellFee.appendChild(feeLabel);
    tr.appendChild(cellFee);

    // 6. Cell: Spread
    const cellSpread = document.createElement('td');
    cellSpread.className = 'cell-spread';
    if (!isOffline && spreadFromBest) {
      const spreadPctSpan = document.createElement('span');
      if (spreadFromBest.percentage > 0) spreadPctSpan.className = 'trend-up';
      spreadPctSpan.textContent = formatPercentage(spreadFromBest.percentage, 3);
      cellSpread.appendChild(spreadPctSpan);

      const spreadAbsSpan = document.createElement('span');
      spreadAbsSpan.className = 'spread-abs';
      spreadAbsSpan.textContent = formatCurrency(spreadFromBest.absolute);
      cellSpread.appendChild(spreadAbsSpan);
    } else {
      const emptySpan = document.createElement('span');
      emptySpan.textContent = '—';
      cellSpread.appendChild(emptySpan);
    }
    tr.appendChild(cellSpread);

    // 7. Cell: Action link
    const cellAction = document.createElement('td');
    cellAction.className = 'cell-action';
    const actionLink = document.createElement('a');
    actionLink.href = meta.url || '#';
    actionLink.target = '_blank';
    actionLink.rel = 'noopener noreferrer';
    actionLink.className = 'action-link';
    actionLink.title = `Open ${ex.displayName}`;

    const linkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    linkSvg.setAttribute('width', '16');
    linkSvg.setAttribute('height', '16');
    linkSvg.setAttribute('viewBox', '0 0 24 24');
    linkSvg.setAttribute('fill', 'none');
    linkSvg.setAttribute('stroke', 'currentColor');
    linkSvg.setAttribute('stroke-width', '2');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3');
    linkSvg.appendChild(path);
    actionLink.appendChild(linkSvg);
    cellAction.appendChild(actionLink);
    tr.appendChild(cellAction);

    fragment.appendChild(tr);
  });

  tbody.replaceChildren(fragment);
}

export default {
  initTable,
};
