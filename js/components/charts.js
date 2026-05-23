// ============================================================
// charts.js — Chart.js visualizations
// ============================================================

import { appState } from '../services/state.js';
import { rankExchanges } from '../services/arbitrage.js';
import { formatCurrency, formatPercentage, formatVolume } from '../utils/formatters.js';
import { CHART_COLORS, CHART_COLORS_ALPHA } from '../utils/constants.js';
import { CONFIG } from '../config.js';

let priceCompChart = null;
let priceHistoryChart = null;
let volumeChart = null;
let spreadTrendChart = null;

// ── Chart.js Global Defaults ──
function setChartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.color = '#9399a8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 17, 24, 0.95)';
  Chart.defaults.plugins.tooltip.titleColor = '#eef0f6';
  Chart.defaults.plugins.tooltip.bodyColor = '#9399a8';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(245, 184, 32, 0.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.displayColors = true;
}

export function initCharts() {
  setChartDefaults();
  appState.on('exchanges', updatePriceComparisonChart);
  appState.on('exchanges', updateVolumeChart);
  appState.on('priceHistory', updatePriceHistoryChart);
  appState.on('spreadHistory', updateSpreadTrendChart);

  // ── Timeframe selector ──
  document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.set('selectedTimeframe', btn.dataset.tf);
    });
  });
}

// ═══════════════════════════════════════
// Price Comparison Bar Chart
// ═══════════════════════════════════════
function updatePriceComparisonChart(exchanges) {
  const canvas = document.getElementById('price-comp-chart');
  if (!canvas || !window.Chart) return;

  const sorted = rankExchanges(exchanges, 'price', 'asc');
  if (sorted.length === 0) return;

  const labels = sorted.map(e => e.displayName);
  const prices = sorted.map(e => e.price.last);
  const colors = sorted.map(e => e.color || '#f5b820');
  const colorsAlpha = colors.map(c => c + '33');

  // Cari min dan max untuk skala yang lebih jelas
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.3 || maxPrice * 0.001;

  const data = {
    labels,
    datasets: [{
      label: 'Harga (USD)',
      data: prices,
      backgroundColor: colorsAlpha,
      borderColor: colors,
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.raw)}`,
          afterLabel: (ctx) => {
            const ex = sorted[ctx.dataIndex];
            return `Perubahan 24h: ${formatPercentage(ex.change24h.percentage)}`;
          }
        }
      }
    },
    scales: {
      x: {
        min: minPrice - padding,
        max: maxPrice + padding,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          callback: v => formatCurrency(v, 0),
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { weight: 500, size: 13 },
          color: '#eef0f6',
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    }
  };

  if (priceCompChart) {
    priceCompChart.data = data;
    priceCompChart.options.scales.x.min = minPrice - padding;
    priceCompChart.options.scales.x.max = maxPrice + padding;
    priceCompChart.update('active');
  } else {
    priceCompChart = new Chart(canvas, { type: 'bar', data, options });
  }
}

// ═══════════════════════════════════════
// Price History Line Chart
// ═══════════════════════════════════════
function updatePriceHistoryChart(historyData) {
  const canvas = document.getElementById('price-history-chart');
  if (!canvas || !window.Chart || !historyData) return;

  // historyData: { exchangeId: [[ts, price], ...], ... }
  const datasets = [];
  let colorIdx = 0;

  for (const [exchangeId, points] of Object.entries(historyData)) {
    if (!points || points.length === 0) continue;
    
    let label = exchangeId;
    let color = CHART_COLORS[colorIdx % CHART_COLORS.length];
    let borderWidth = 2;
    let borderDash = [];
    
    if (exchangeId === 'global_avg') {
      label = 'Rata-rata Global (CoinGecko)';
      color = '#f5b820'; // Gold
      borderWidth = 3;
      borderDash = [5, 5]; // Dashed line to distinguish from exact exchanges
    } else {
      const config = CONFIG.exchanges[exchangeId];
      if (config) {
        label = config.name;
        color = config.color || color;
      }
      colorIdx++;
    }

    datasets.push({
      label: label,
      data: points.map(([ts, price]) => ({ x: ts, y: price })),
      borderColor: color,
      backgroundColor: color + '15',
      borderWidth: borderWidth,
      borderDash: borderDash,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: false,
    });
  }

  if (datasets.length === 0) return;

  const data = { datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (items.length > 0) {
              return new Date(items[0].raw.x).toLocaleString('id-ID');
            }
            return '';
          },
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw.y)}`,
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'dd MMM',
          }
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          callback: v => formatCurrency(v, 0),
        }
      }
    },
    animation: {
      duration: 600,
    }
  };

  if (priceHistoryChart) {
    priceHistoryChart.data = data;
    priceHistoryChart.update('active');
  } else {
    priceHistoryChart = new Chart(canvas, { type: 'line', data, options });
  }
}

// ═══════════════════════════════════════
// Volume Doughnut Chart
// ═══════════════════════════════════════
function updateVolumeChart(exchanges) {
  const canvas = document.getElementById('volume-chart');
  if (!canvas || !window.Chart) return;

  const active = exchanges
    .filter(e => e.status === 'active' && e.volume24h.quote > 0)
    .sort((a, b) => b.volume24h.quote - a.volume24h.quote);

  if (active.length === 0) return;

  const labels = active.map(e => e.displayName);
  const volumes = active.map(e => e.volume24h.quote);
  const colors = active.map(e => e.color || '#888');

  const data = {
    labels,
    datasets: [{
      data: volumes,
      backgroundColor: colors.map(c => c + '66'),
      borderColor: colors,
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 11 },
          padding: 12,
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = volumes.reduce((a, b) => a + b, 0);
            const pct = ((ctx.raw / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${formatVolume(ctx.raw)} (${pct}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      duration: 800,
    }
  };

  if (volumeChart) {
    volumeChart.data = data;
    volumeChart.update('active');
  } else {
    volumeChart = new Chart(canvas, { type: 'doughnut', data, options });
  }
}

// ═══════════════════════════════════════
// Spread Trend Area Chart
// ═══════════════════════════════════════
function updateSpreadTrendChart(spreadHistory) {
  const canvas = document.getElementById('spread-trend-chart');
  if (!canvas || !window.Chart || !spreadHistory || spreadHistory.length === 0) return;

  const data = {
    labels: spreadHistory.map(p => new Date(p.timestamp)),
    datasets: [{
      label: 'Spread Maks (%)',
      data: spreadHistory.map(p => p.maxSpread),
      borderColor: '#f5b820',
      backgroundColor: 'rgba(245, 184, 32, 0.1)',
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 5,
      tension: 0.4,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (items.length > 0) {
              return new Date(items[0].label).toLocaleTimeString('id-ID');
            }
            return '';
          },
          label: (ctx) => ` Spread: ${formatPercentage(ctx.raw, 3)}`,
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: { displayFormats: { minute: 'HH:mm', hour: 'HH:mm' } },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          callback: v => v.toFixed(2) + '%',
        }
      }
    },
    animation: { duration: 600 }
  };

  if (spreadTrendChart) {
    spreadTrendChart.data = data;
    spreadTrendChart.update('active');
  } else {
    spreadTrendChart = new Chart(canvas, { type: 'line', data, options });
  }
}
