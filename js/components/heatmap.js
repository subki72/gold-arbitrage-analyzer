// ============================================================
// heatmap.js — Arbitrage spread matrix heatmap component
// ============================================================

import { appState } from '../services/state.js';
import { generateSpreadMatrix } from '../services/arbitrage.js';
import { formatPercentage } from '../utils/formatters.js';
import { interpolateColor, $, createElement } from '../utils/helpers.js';
import { CONFIG } from '../config.js';

export function initHeatmap() {
  appState.on('exchanges', updateHeatmap);
}

function updateHeatmap(exchanges) {
  const container = $('#heatmap-container');
  if (!container) return;

  const active = (exchanges || []).filter(e => e.status === 'active' && e.price?.last > 0);
  if (active.length < 2) {
    container.innerHTML = '';
    const noData = createElement('p', {
      className: 'no-data',
      textContent: 'At least 2 active exchanges are required for heatmap matrix',
    });
    container.appendChild(noData);
    return;
  }

  const { exchanges: names, ids, matrix } = generateSpreadMatrix(active);

  // Pre-calculate max spread and global best spread once (O(n^2) instead of O(n^4))
  let maxAbsSpread = 0;
  let globalBestSpread = -Infinity;

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const val = matrix[i][j];
      if (val !== null && Number.isFinite(val)) {
        if (Math.abs(val) > maxAbsSpread) {
          maxAbsSpread = Math.abs(val);
        }
        if (val > globalBestSpread) {
          globalBestSpread = val;
        }
      }
    }
  }
  if (maxAbsSpread === 0) maxAbsSpread = 1;

  // Build table structure safely
  const table = createElement('table', { className: 'heatmap-table' });
  const thead = createElement('thead');
  const headerRow = createElement('tr');

  // Top-left corner
  const cornerTh = createElement('th', { className: 'heatmap-corner' });
  const cornerLabel = createElement('span', {
    className: 'heatmap-label',
    textContent: 'Sell ↓ / Buy →',
  });
  cornerTh.appendChild(cornerLabel);
  headerRow.appendChild(cornerTh);

  // Exchange column headers
  names.forEach((name, i) => {
    const th = createElement('th', { className: 'heatmap-header' });
    const abbr = name.length > 7 ? name.slice(0, 6) + '.' : name;
    const exNameSpan = createElement('span', {
      className: 'heatmap-exname',
      textContent: abbr,
    });
    const color = CONFIG.exchanges[ids[i]]?.color || '#ffffff';
    exNameSpan.style.color = color;
    th.appendChild(exNameSpan);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows
  const tbody = createElement('tbody');
  matrix.forEach((row, i) => {
    const tr = createElement('tr');

    // Row header (Sell exchange)
    const rowHeader = createElement('td', { className: 'heatmap-row-header' });
    const rowNameSpan = createElement('span', {
      textContent: names[i],
    });
    const color = CONFIG.exchanges[ids[i]]?.color || '#ffffff';
    rowNameSpan.style.color = color;
    rowHeader.appendChild(rowNameSpan);
    tr.appendChild(rowHeader);

    // Data cells
    row.forEach((val, j) => {
      const td = createElement('td', { className: 'heatmap-cell' });

      if (val === null) {
        // Diagonal: same exchange
        td.classList.add('heatmap-diagonal');
        td.textContent = '—';
      } else {
        const normalizedVal = Math.abs(val) / maxAbsSpread;
        const bg = val > 0
          ? interpolateColor(normalizedVal, [152, 69, 35], [100, 80, 50])
          : interpolateColor(normalizedVal, [0, 0, 30], [0, 75, 45]);

        td.style.backgroundColor = bg;
        td.style.color = normalizedVal > 0.5 ? '#ffffff' : '#cccccc';

        const valSpan = createElement('span', {
          className: 'heatmap-value',
          textContent: `${val >= 0 ? '+' : ''}${val.toFixed(3)}%`,
        });
        td.appendChild(valSpan);
        td.title = `Buy on ${names[j]}, Sell on ${names[i]}: ${formatPercentage(val, 3)}`;

        // Highlight best opportunity using pre-calculated globalBestSpread
        if (val === globalBestSpread && globalBestSpread > 0) {
          td.classList.add('heatmap-best');
        }
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);
}

export default {
  initHeatmap,
};
