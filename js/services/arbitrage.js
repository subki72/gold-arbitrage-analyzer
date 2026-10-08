// ============================================================
// arbitrage.js — Arbitrage mathematical & execution engine
// ============================================================

import { roundFinancial } from '../utils/formatters.js';

/**
 * Get effective buy price (ask price preferred for taker buy order, fallback to last)
 * @param {Object} exchange
 * @returns {number}
 */
export function getEffectiveBuyPrice(exchange) {
  if (!exchange || !exchange.price) return 0;
  return exchange.price.ask > 0 ? exchange.price.ask : (exchange.price.last || 0);
}

/**
 * Get effective sell price (bid price preferred for taker sell order, fallback to last)
 * @param {Object} exchange
 * @returns {number}
 */
export function getEffectiveSellPrice(exchange) {
  if (!exchange || !exchange.price) return 0;
  return exchange.price.bid > 0 ? exchange.price.bid : (exchange.price.last || 0);
}

/**
 * Find exchange with lowest buy price (lowest ask)
 * @param {Array} exchanges - Array of normalized exchange data
 * @returns {Object|null}
 */
export function findBestBuy(exchanges) {
  if (!Array.isArray(exchanges) || exchanges.length === 0) return null;
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length === 0) return null;

  return active.reduce((best, curr) => {
    const currPrice = getEffectiveBuyPrice(curr);
    const bestPrice = getEffectiveBuyPrice(best);
    return (currPrice > 0 && currPrice < bestPrice) ? curr : best;
  });
}

/**
 * Find exchange with highest sell price (highest bid)
 * @param {Array} exchanges - Array of normalized exchange data
 * @returns {Object|null}
 */
export function findBestSell(exchanges) {
  if (!Array.isArray(exchanges) || exchanges.length === 0) return null;
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length === 0) return null;

  return active.reduce((best, curr) => {
    const currPrice = getEffectiveSellPrice(curr);
    const bestPrice = getEffectiveSellPrice(best);
    return (currPrice > 0 && currPrice > bestPrice) ? curr : best;
  });
}

/**
 * Calculate spread between two exchanges (Buy from buyExchange, Sell to sellExchange)
 * @param {Object} buyExchange
 * @param {Object} sellExchange
 * @returns {{ absolute: number, percentage: number }}
 */
export function calculateSpread(buyExchange, sellExchange) {
  if (!buyExchange || !sellExchange) {
    return { absolute: 0, percentage: 0 };
  }

  const buyPrice = getEffectiveBuyPrice(buyExchange);
  const sellPrice = getEffectiveSellPrice(sellExchange);

  if (buyPrice <= 0 || sellPrice <= 0) {
    return { absolute: 0, percentage: 0 };
  }

  const absolute = roundFinancial(sellPrice - buyPrice, 4);
  const percentage = roundFinancial((absolute / buyPrice) * 100, 4);

  return { absolute, percentage };
}

/**
 * Calculate arbitrage net profit accounting for taker fees, withdrawal fees, token transfer fees, and gas
 * @param {Object} buyExchange
 * @param {Object} sellExchange
 * @param {number} [amount=1] - Amount in troy ounces
 * @param {Object} [options={}] - Additional fee parameters
 * @param {number} [options.withdrawalFee=0] - Exchange withdrawal fee in USD
 * @param {number} [options.gasFee=0] - Estimated network gas fee in USD
 * @param {number} [options.transferFeeRate=0] - On-chain token transfer fee (e.g. 0.0002 for PAXG 0.02%)
 * @returns {Object}
 */
export function calculateArbitrageProfit(buyExchange, sellExchange, amount = 1, options = {}) {
  if (!buyExchange || !sellExchange || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return {
      buyPrice: 0,
      sellPrice: 0,
      buyCost: 0,
      sellRevenue: 0,
      buyFee: 0,
      sellFee: 0,
      transferFee: 0,
      withdrawalFee: 0,
      gasFee: 0,
      totalFees: 0,
      grossProfit: 0,
      netProfit: 0,
      profitPercentage: 0,
      isProfitable: false,
    };
  }

  const buyPrice = getEffectiveBuyPrice(buyExchange);
  const sellPrice = getEffectiveSellPrice(sellExchange);

  const buyCost = roundFinancial(buyPrice * amount, 4);
  const sellRevenue = roundFinancial(sellPrice * amount, 4);

  // Both sides of instant spatial arbitrage are liquidity-taking TAKER orders
  const buyFeeRate = (buyExchange.fees?.taker ?? 0.10) / 100;
  const sellFeeRate = (sellExchange.fees?.taker ?? 0.10) / 100;

  const buyFee = roundFinancial(buyCost * buyFeeRate, 4);
  const sellFee = roundFinancial(sellRevenue * sellFeeRate, 4);

  // Optional friction costs
  const transferFeeRate = typeof options.transferFeeRate === 'number' && Number.isFinite(options.transferFeeRate)
    ? options.transferFeeRate
    : 0;
  const transferFee = roundFinancial(buyCost * transferFeeRate, 4);

  const withdrawalFee = typeof options.withdrawalFee === 'number' && Number.isFinite(options.withdrawalFee)
    ? options.withdrawalFee
    : 0;
  const gasFee = typeof options.gasFee === 'number' && Number.isFinite(options.gasFee)
    ? options.gasFee
    : 0;

  const totalFees = roundFinancial(buyFee + sellFee + transferFee + withdrawalFee + gasFee, 4);
  const grossProfit = roundFinancial(sellRevenue - buyCost, 4);
  const netProfit = roundFinancial(grossProfit - totalFees, 4);
  const profitPercentage = buyCost > 0 ? roundFinancial((netProfit / buyCost) * 100, 4) : 0;

  return {
    buyPrice,
    sellPrice,
    buyCost,
    sellRevenue,
    buyFee,
    sellFee,
    transferFee,
    withdrawalFee,
    gasFee,
    totalFees,
    grossProfit,
    netProfit,
    profitPercentage,
    isProfitable: netProfit > 0.0001,
  };
}

/**
 * Generate spread matrix for heatmap visualization
 * @param {Array} exchanges
 * @returns {{ exchanges: string[], ids: string[], matrix: (number|null)[][] }}
 */
export function generateSpreadMatrix(exchanges) {
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  const names = active.map(e => e.displayName);
  const matrix = [];

  for (let i = 0; i < active.length; i++) {
    const row = [];
    for (let j = 0; j < active.length; j++) {
      if (i === j) {
        row.push(null); // Diagonal: same exchange
      } else {
        // Buy from column exchange (j), sell at row exchange (i)
        const spread = calculateSpread(active[j], active[i]);
        row.push(spread.percentage);
      }
    }
    matrix.push(row);
  }

  return {
    exchanges: names,
    ids: active.map(e => e.exchange),
    matrix,
  };
}

/**
 * Rank exchanges based on specified criteria
 * @param {Array} exchanges
 * @param {string} [sortBy='price'] - 'price' | 'volume' | 'change' | 'name' | 'fee'
 * @param {string} [direction='asc'] - 'asc' | 'desc'
 * @returns {Array}
 */
export function rankExchanges(exchanges, sortBy = 'price', direction = 'asc') {
  const active = [...exchanges].filter(e => e.price.last > 0);

  const comparators = {
    price: (a, b) => a.price.last - b.price.last,
    volume: (a, b) => (a.volume24h?.quote || 0) - (b.volume24h?.quote || 0),
    change: (a, b) => (a.change24h?.percentage || 0) - (b.change24h?.percentage || 0),
    name: (a, b) => a.displayName.localeCompare(b.displayName),
    fee: (a, b) => (a.fees?.taker || 0) - (b.fees?.taker || 0),
  };

  const comparator = comparators[sortBy] || comparators.price;
  active.sort((a, b) => (direction === 'asc' ? comparator(a, b) : comparator(b, a)));

  return active;
}

/**
 * Find the optimal arbitrage opportunity across all active exchange pairs
 * @param {Array} exchanges
 * @param {number} [amount=1]
 * @param {Object} [options={}]
 * @returns {Object|null}
 */
export function findBestArbitrage(exchanges, amount = 1, options = {}) {
  const active = (exchanges || []).filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length < 2) return null;

  let bestOpportunity = null;
  let maxNetProfit = -Infinity;

  for (let i = 0; i < active.length; i++) {
    for (let j = 0; j < active.length; j++) {
      if (i === j) continue;
      const buyEx = active[i];
      const sellEx = active[j];

      const profit = calculateArbitrageProfit(buyEx, sellEx, amount, options);
      const spread = calculateSpread(buyEx, sellEx);

      if (profit.netProfit > maxNetProfit) {
        maxNetProfit = profit.netProfit;
        bestOpportunity = {
          buyExchange: buyEx,
          sellExchange: sellEx,
          spread,
          profit,
        };
      }
    }
  }

  return bestOpportunity;
}

/**
 * Calculate aggregated quote turnover volume across all active exchanges
 * @param {Array} exchanges
 * @returns {number}
 */
export function calculateTotalVolume(exchanges) {
  if (!Array.isArray(exchanges)) return 0;
  return roundFinancial(
    exchanges
      .filter(e => e.status === 'active')
      .reduce((sum, e) => sum + (e.volume24h?.quote || 0), 0),
    2
  );
}

/**
 * Find highest spread across all valid exchange combinations
 * @param {Array} exchanges
 * @returns {Object|null} { buyExchange, sellExchange, spread }
 */
export function findMaxSpread(exchanges) {
  const active = (exchanges || []).filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length < 2) return null;

  let maxSpread = { percentage: -Infinity, absolute: 0 };
  let bestBuyEx = null;
  let bestSellEx = null;

  for (let i = 0; i < active.length; i++) {
    for (let j = 0; j < active.length; j++) {
      if (i === j) continue;
      const spread = calculateSpread(active[i], active[j]);
      if (spread.percentage > maxSpread.percentage) {
        maxSpread = spread;
        bestBuyEx = active[i];
        bestSellEx = active[j];
      }
    }
  }

  if (!bestBuyEx || !bestSellEx) return null;

  return {
    buyExchange: bestBuyEx,
    sellExchange: bestSellEx,
    spread: maxSpread,
  };
}

export default {
  getEffectiveBuyPrice,
  getEffectiveSellPrice,
  findBestBuy,
  findBestSell,
  calculateSpread,
  calculateArbitrageProfit,
  generateSpreadMatrix,
  rankExchanges,
  findBestArbitrage,
  calculateTotalVolume,
  findMaxSpread,
};
