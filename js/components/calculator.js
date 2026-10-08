// ============================================================
// calculator.js — Arbitrage net profit calculator component
// ============================================================

import { appState } from '../services/state.js';
import { calculateArbitrageProfit, findBestBuy, findBestSell, findBestArbitrage } from '../services/arbitrage.js';
import { formatCurrency, formatPercentage } from '../utils/formatters.js';
import { $ } from '../utils/helpers.js';
import { CONFIG } from '../config.js';

export function initCalculator() {
  appState.on('exchanges', populateDropdowns);
  appState.on('selectedToken', onTokenChange);

  // Auto-calculate on input changes
  const watchedInputs = [
    '#calc-buy-exchange',
    '#calc-sell-exchange',
    '#calc-amount',
    '#calc-withdrawal-fee',
    '#calc-gas-fee',
    '#calc-transfer-fee',
  ];

  watchedInputs.forEach(sel => {
    const el = $(sel);
    if (el) {
      const handler = () => {
        if (sel === '#calc-buy-exchange') appState.set('calcBuyExchange', el.value || null);
        if (sel === '#calc-sell-exchange') appState.set('calcSellExchange', el.value || null);
        if (sel === '#calc-amount') {
          const val = parseFloat(el.value);
          appState.set('calcAmount', Number.isFinite(val) && val > 0 ? val : 1);
        }
        if (sel === '#calc-withdrawal-fee') {
          const val = parseFloat(el.value);
          appState.set('calcWithdrawalFee', Number.isFinite(val) && val >= 0 ? val : 0);
        }
        if (sel === '#calc-gas-fee') {
          const val = parseFloat(el.value);
          appState.set('calcGasFee', Number.isFinite(val) && val >= 0 ? val : 0);
        }
        if (sel === '#calc-transfer-fee') {
          const val = parseFloat(el.value);
          appState.set('calcTransferFeeRate', Number.isFinite(val) && val >= 0 ? val / 100 : 0);
        }
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

function onTokenChange(token) {
  // Reset transfer fee default for token
  const tokenConfig = CONFIG.tokens[token];
  const transferFeeInput = $('#calc-transfer-fee');
  if (transferFeeInput && tokenConfig) {
    const defaultPct = (tokenConfig.transferFeeRate || 0) * 100;
    transferFeeInput.value = defaultPct.toFixed(2);
    appState.set('calcTransferFeeRate', tokenConfig.transferFeeRate || 0);
  }

  // Clear or validate current selections against new token's pairs
  const pairs = tokenConfig?.pairs || {};
  const currentBuy = appState.get('calcBuyExchange');
  const currentSell = appState.get('calcSellExchange');

  if (currentBuy && !pairs[currentBuy]) {
    appState.set('calcBuyExchange', null);
  }
  if (currentSell && !pairs[currentSell]) {
    appState.set('calcSellExchange', null);
  }

  const exchanges = appState.get('exchanges');
  if (Array.isArray(exchanges) && exchanges.length > 0) {
    populateDropdowns(exchanges);
  }
}

function populateDropdowns(exchanges) {
  const buySelect = $('#calc-buy-exchange');
  const sellSelect = $('#calc-sell-exchange');
  if (!buySelect || !sellSelect) return;

  const token = appState.get('selectedToken') || 'PAXG';
  const tokenPairs = CONFIG.tokens[token]?.pairs || {};
  const active = (exchanges || []).filter(e => e.status === 'active' && e.price?.last > 0 && tokenPairs[e.exchange] !== null);

  const buildOptions = (select, currentVal, type) => {
    const existingVal = currentVal || select.value;
    select.innerHTML = '<option value="">Select Exchange</option>';

    active.forEach(ex => {
      const option = document.createElement('option');
      option.value = ex.exchange;
      const price = type === 'buy' ? (ex.price.ask || ex.price.last) : (ex.price.bid || ex.price.last);
      option.textContent = `${ex.displayName} — ${formatCurrency(price)}`;
      select.appendChild(option);
    });

    // Check if previous value is still valid in new options
    const isStillValid = active.some(e => e.exchange === existingVal);
    if (existingVal && isStillValid) {
      select.value = existingVal;
    } else {
      select.value = '';
    }
  };

  buildOptions(buySelect, appState.get('calcBuyExchange'), 'buy');
  buildOptions(sellSelect, appState.get('calcSellExchange'), 'sell');

  // Auto-fill best pair if either is empty
  if (!buySelect.value || !sellSelect.value) {
    autoFillBestPair();
  } else {
    runCalculation();
  }
}

function autoFillBestPair() {
  const exchanges = appState.get('exchanges');
  if (!Array.isArray(exchanges) || exchanges.length < 2) return;

  const buySelect = $('#calc-buy-exchange');
  const sellSelect = $('#calc-sell-exchange');
  if (!buySelect || !sellSelect) return;

  // First check optimal pair via findBestArbitrage
  const bestArb = findBestArbitrage(exchanges);
  if (bestArb?.buyExchange && bestArb?.sellExchange) {
    buySelect.value = bestArb.buyExchange.exchange;
    sellSelect.value = bestArb.sellExchange.exchange;

    appState.update({
      calcBuyExchange: bestArb.buyExchange.exchange,
      calcSellExchange: bestArb.sellExchange.exchange,
    });
    runCalculation();
    return;
  }

  // Fallback to distinct best buy and best sell
  const bestBuy = findBestBuy(exchanges);
  const bestSell = findBestSell(exchanges);

  if (bestBuy && bestSell && bestBuy.exchange !== bestSell.exchange) {
    buySelect.value = bestBuy.exchange;
    sellSelect.value = bestSell.exchange;

    appState.update({
      calcBuyExchange: bestBuy.exchange,
      calcSellExchange: bestSell.exchange,
    });
    runCalculation();
  }
}

function runCalculation() {
  const exchanges = appState.get('exchanges');
  if (!Array.isArray(exchanges)) return;

  const buyId = $('#calc-buy-exchange')?.value;
  const sellId = $('#calc-sell-exchange')?.value;

  const amountInput = parseFloat($('#calc-amount')?.value);
  const amount = Number.isFinite(amountInput) && amountInput > 0 ? amountInput : 1;

  const withdrawalFeeInput = parseFloat($('#calc-withdrawal-fee')?.value);
  const withdrawalFee = Number.isFinite(withdrawalFeeInput) && withdrawalFeeInput >= 0 ? withdrawalFeeInput : 0;

  const gasFeeInput = parseFloat($('#calc-gas-fee')?.value);
  const gasFee = Number.isFinite(gasFeeInput) && gasFeeInput >= 0 ? gasFeeInput : 0;

  const transferFeeInput = parseFloat($('#calc-transfer-fee')?.value);
  const transferFeeRate = Number.isFinite(transferFeeInput) && transferFeeInput >= 0
    ? transferFeeInput / 100
    : (appState.get('calcTransferFeeRate') ?? 0);

  const buyEx = exchanges.find(e => e.exchange === buyId);
  const sellEx = exchanges.find(e => e.exchange === sellId);

  const options = {
    withdrawalFee,
    gasFee,
    transferFeeRate,
  };

  const result = calculateArbitrageProfit(buyEx, sellEx, amount, options);

  // Update DOM displays
  updateResult('calc-buy-price', formatCurrency(result.buyPrice));
  updateResult('calc-sell-price', formatCurrency(result.sellPrice));
  updateResult('calc-buy-cost', formatCurrency(result.buyCost));
  updateResult('calc-sell-revenue', formatCurrency(result.sellRevenue));
  updateResult('calc-buy-fee', formatCurrency(result.buyFee));
  updateResult('calc-sell-fee', formatCurrency(result.sellFee));

  // Friction fees (withdrawal + gas + transfer)
  const totalFriction = result.transferFee + result.withdrawalFee + result.gasFee;
  updateResult('calc-transfer-fee-val', formatCurrency(result.transferFee));
  updateResult('calc-network-fee-val', formatCurrency(result.withdrawalFee + result.gasFee));
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

  // Update visual profit badge
  const indicator = $('#profit-indicator');
  if (indicator) {
    if (!buyEx || !sellEx || buyEx.exchange === sellEx.exchange) {
      indicator.className = 'profit-indicator neutral';
      indicator.textContent = 'Select valid pair';
    } else if (result.isProfitable) {
      indicator.className = 'profit-indicator profitable';
      indicator.textContent = '✓ Profitable';
    } else {
      indicator.className = 'profit-indicator not-profitable';
      indicator.textContent = '✗ Unprofitable';
    }
  }
}

function updateResult(elementId, text) {
  const el = $(`#${elementId}`);
  if (el) el.textContent = text;
}

export default {
  initCalculator,
};
