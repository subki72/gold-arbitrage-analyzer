// ============================================================
// heatmap.js — Spread heatmap matrix component
// ============================================================

import { appState } from '../services/state.js';
import { generateSpreadMatrix } from '../services/arbitrage.js';
import { formatPercentage, formatCurrency } from '../utils/formatters.js';
import { interpolateColor, $, createElement } from '../utils/helpers.js';
import { CONFIG } from '../config.js';

export function initHeatmap() {
  appState.on('exchanges', updateHeatmap);
}

function updateHeatmap(exchanges) {
  const container = $('#heatmap-container');
  if (!container) return;

  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length < 2) {
    container.innerHTML = '<p class="no-data">Minimal 2 exchange diperlukan untuk heatmap</p>';
    return;
  }

  const { exchanges: names, ids, matrix } = generateSpreadMatrix(active);

  // Cari max spread untuk normalisasi warna
  let maxAbsSpread = 0;
  matrix.forEach(row => {
    row.forEach(val => {
      if (val !== null) maxAbsSpread = Math.max(maxAbsSpread, Math.abs(val));
    });
  });
  if (maxAbsSpread === 0) maxAbsSpread = 1;

  // Build table
  const table = createElement('table', { className: 'heatmap-table' });

  // Header row
  const thead = createElement('thead');
  const headerRow = createElement('tr');
  headerRow.appendChild(createElement('th', {
    className: 'heatmap-corner',
    innerHTML: '<span class="heatmap-label">Jual ↓ / Beli →</span>'
  }));
  names.forEach((name, i) => {
    const th = createElement('th', { className: 'heatmap-header' });
    const abbr = name.length > 6 ? name.slice(0, 5) + '.' : name;
    th.innerHTML = `<span class="heatmap-exname" style="color:${CONFIG.exchanges[ids[i]]?.color || '#fff'}">${abbr}</span>`;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows
  const tbody = createElement('tbody');
  matrix.forEach((row, i) => {
    const tr = createElement('tr');

    // Row header (sell exchange)
    const rowHeader = createElement('td', { className: 'heatmap-row-header' });
    rowHeader.innerHTML = `<span style="color:${CONFIG.exchanges[ids[i]]?.color || '#fff'}">${names[i]}</span>`;
    tr.appendChild(rowHeader);

    // Data cells
    row.forEach((val, j) => {
      const td = createElement('td', { className: 'heatmap-cell' });

      if (val === null) {
        // Same exchange (diagonal)
        td.classList.add('heatmap-diagonal');
        td.innerHTML = '—';
      } else {
        // Normalize value for color: positive spread = green to red intensity
        const normalizedVal = Math.abs(val) / maxAbsSpread;
        const bg = val > 0
          ? interpolateColor(normalizedVal, [152, 69, 35], [100, 80, 50])  // green range
          : interpolateColor(normalizedVal, [0, 0, 30], [0, 75, 45]);     // red range

        td.style.backgroundColor = bg;
        td.style.color = normalizedVal > 0.5 ? '#fff' : '#ccc';
        td.innerHTML = `<span class="heatmap-value">${val >= 0 ? '+' : ''}${val.toFixed(3)}%</span>`;
        td.title = `Beli di ${names[j]}, Jual di ${names[i]}: ${formatPercentage(val, 3)}`;

        // Highlight best opportunity
        if (val === Math.max(...matrix.flat().filter(v => v !== null))) {
          td.classList.add('heatmap-best');
        }
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  // Replace content
  container.innerHTML = '';
  container.appendChild(table);
}
