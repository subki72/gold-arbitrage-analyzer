// ============================================================
// calculator.js — Arbitrage profit calculator component
// ============================================================

import { appState } from '../services/state.js';
import { calculateArbitrageProfit, findBestBuy, findBestSell } from '../services/arbitrage.js';
import { formatCurrency, formatPercentage } from '../utils/formatters.js';
import { $ } from '../utils/helpers.js';

export function initCalculator() {
  appState.on('exchanges', populateDropdowns);

  const calcBtn = $('#calc-btn');
  if (calcBtn) {
    calcBtn.addEventListener('click', runCalculation);
  }

  // Auto-calculate on input change
  ['#calc-buy-exchange', '#calc-sell-exchange', '#calc-amount'].forEach(sel => {
    const el = $(sel);
    if (el) {
      const handler = (e) => {
        if (sel === '#calc-buy-exchange') appState.set('calcBuyExchange', el.value);
        if (sel === '#calc-sell-exchange') appState.set('calcSellExchange', el.value);
        if (sel === '#calc-amount') appState.set('calcAmount', parseFloat(el.value));
        runCalculation();
      };
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    }
  });

  // Auto-fill best pair button
  const autoPairBtn = $('#auto-pair-btn');
  if (autoPairBtn) {
    autoPairBtn.addEventListener('click', autoFillBestPair);
  }
}

function populateDropdowns(exchanges) {
  const buySelect = $('#calc-buy-exchange');
  const sellSelect = $('#calc-sell-exchange');
  if (!buySelect || !sellSelect) return;

  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);

  const buildOptions = (select, currentVal, type) => {
    const currentValue = currentVal || select.value;
    select.innerHTML = '<option value="">Pilih Exchange</option>';
    active.forEach(ex => {
      const option = document.createElement('option');
      option.value = ex.exchange;
      const price = type === 'buy' ? (ex.price.ask || ex.price.last) : (ex.price.bid || ex.price.last);
      option.textContent = `${ex.displayName} — ${formatCurrency(price)}`;
      select.appendChild(option);
    });
    if (currentValue) select.value = currentValue;
  };

  buildOptions(buySelect, appState.get('calcBuyExchange'), 'buy');
  buildOptions(sellSelect, appState.get('calcSellExchange'), 'sell');

  // Auto-fill best pair on first load
  if (!appState.get('calcBuyExchange')) {
    autoFillBestPair();
  }

  runCalculation();
}

function autoFillBestPair() {
  const exchanges = appState.get('exchanges');
  if (!exchanges || exchanges.length < 2) return;

  const bestBuy = findBestBuy(exchanges);
  const bestSell = findBestSell(exchanges);

  if (bestBuy && bestSell && bestBuy.exchange !== bestSell.exchange) {
    const buySelect = $('#calc-buy-exchange');
    const sellSelect = $('#calc-sell-exchange');
    if (buySelect) buySelect.value = bestBuy.exchange;
    if (sellSelect) sellSelect.value = bestSell.exchange;
    appState.update({
      calcBuyExchange: bestBuy.exchange,
      calcSellExchange: bestSell.exchange,
    });
    runCalculation();
  }
}

function runCalculation() {
  const exchanges = appState.get('exchanges');
  if (!exchanges) return;

  const buyId = $('#calc-buy-exchange')?.value;
  const sellId = $('#calc-sell-exchange')?.value;
  const amount = parseFloat($('#calc-amount')?.value) || 1;

  const buyEx = exchanges.find(e => e.exchange === buyId);
  const sellEx = exchanges.find(e => e.exchange === sellId);

  const result = calculateArbitrageProfit(buyEx, sellEx, amount);

  // Update result display
  updateResult('calc-buy-price', formatCurrency(result.buyPrice));
  updateResult('calc-sell-price', formatCurrency(result.sellPrice));
  updateResult('calc-buy-cost', formatCurrency(result.buyCost));
  updateResult('calc-sell-revenue', formatCurrency(result.sellRevenue));
  updateResult('calc-buy-fee', formatCurrency(result.buyFee));
  updateResult('calc-sell-fee', formatCurrency(result.sellFee));
  updateResult('calc-gross-profit', formatCurrency(result.grossProfit));

  const netEl = $('#calc-net-profit');
  if (netEl) {
    netEl.textContent = formatCurrency(result.netProfit);
    netEl.className = `calc-result-value ${result.isProfitable ? 'profit-positive' : 'profit-negative'}`;
  }

  const pctEl = $('#calc-profit-pct');
  if (pctEl) {
    pctEl.textContent = formatPercentage(result.profitPercentage, 3);
    pctEl.className = `calc-result-value ${result.isProfitable ? 'profit-positive' : 'profit-negative'}`;
  }

  // Update profit indicator
  const indicator = $('#profit-indicator');
  if (indicator) {
    if (!buyEx || !sellEx) {
      indicator.className = 'profit-indicator neutral';
      indicator.textContent = 'Pilih exchange';
    } else if (result.isProfitable) {
      indicator.className = 'profit-indicator profitable';
      indicator.textContent = '✓ Profitable';
    } else {
      indicator.className = 'profit-indicator not-profitable';
      indicator.textContent = '✗ Tidak Profitable';
    }
  }
}

function updateResult(id, value) {
  const el = $(`#${id}`);
  if (el) el.textContent = value;
}
