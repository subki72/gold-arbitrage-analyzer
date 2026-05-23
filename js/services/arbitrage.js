// ============================================================
// arbitrage.js — Mesin kalkulasi arbitrase
// ============================================================

import { CONFIG } from '../config.js';

/**
 * Cari exchange dengan harga terendah (best buy)
 * @param {Array} exchanges - Array of normalized exchange data
 * @returns {Object|null}
 */
export function findBestBuy(exchanges) {
  if (!exchanges || exchanges.length === 0) return null;
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length === 0) return null;
  return active.reduce((best, curr) =>
    curr.price.last < best.price.last ? curr : best
  );
}

/**
 * Cari exchange dengan harga tertinggi (best sell)
 * @param {Array} exchanges
 * @returns {Object|null}
 */
export function findBestSell(exchanges) {
  if (!exchanges || exchanges.length === 0) return null;
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length === 0) return null;
  return active.reduce((best, curr) =>
    curr.price.last > best.price.last ? curr : best
  );
}

/**
 * Hitung spread antara dua exchange
 * @param {Object} buyExchange
 * @param {Object} sellExchange
 * @returns {Object} { absolute, percentage }
 */
export function calculateSpread(buyExchange, sellExchange) {
  if (!buyExchange || !sellExchange) return { absolute: 0, percentage: 0 };
  
  const buyPrice = buyExchange.price.ask || buyExchange.price.last;
  const sellPrice = sellExchange.price.bid || sellExchange.price.last;
  const absolute = sellPrice - buyPrice;
  const percentage = buyPrice > 0 ? (absolute / buyPrice) * 100 : 0;

  return { absolute, percentage };
}

/**
 * Hitung profit arbitrase dengan fee
 * @param {Object} buyExchange
 * @param {Object} sellExchange
 * @param {number} amount - jumlah dalam troy ounces
 * @returns {Object}
 */
export function calculateArbitrageProfit(buyExchange, sellExchange, amount = 1) {
  if (!buyExchange || !sellExchange || amount <= 0) {
    return {
      buyPrice: 0, sellPrice: 0,
      buyCost: 0, sellRevenue: 0,
      buyFee: 0, sellFee: 0,
      grossProfit: 0, netProfit: 0,
      profitPercentage: 0,
      isProfitable: false,
    };
  }

  const buyPrice = buyExchange.price.ask || buyExchange.price.last;
  const sellPrice = sellExchange.price.bid || sellExchange.price.last;

  const buyCost = buyPrice * amount;
  const sellRevenue = sellPrice * amount;

  const buyFeeRate = buyExchange.fees.taker / 100;  // Taker fee saat beli
  const sellFeeRate = sellExchange.fees.maker / 100; // Maker fee saat jual

  const buyFee = buyCost * buyFeeRate;
  const sellFee = sellRevenue * sellFeeRate;

  const grossProfit = sellRevenue - buyCost;
  const netProfit = grossProfit - buyFee - sellFee;
  const profitPercentage = buyCost > 0 ? (netProfit / buyCost) * 100 : 0;

  return {
    buyPrice,
    sellPrice,
    buyCost,
    sellRevenue,
    buyFee,
    sellFee,
    grossProfit,
    netProfit,
    profitPercentage,
    isProfitable: netProfit > 0,
  };
}

/**
 * Generate matrix spread untuk heatmap
 * @param {Array} exchanges
 * @returns {Object} { exchanges: string[], matrix: number[][] }
 */
export function generateSpreadMatrix(exchanges) {
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  const names = active.map(e => e.displayName);
  const matrix = [];

  for (let i = 0; i < active.length; i++) {
    const row = [];
    for (let j = 0; j < active.length; j++) {
      if (i === j) {
        row.push(null); // Same exchange
      } else {
        // Buy from column exchange, sell at row exchange
        const spread = calculateSpread(active[j], active[i]);
        row.push(spread.percentage);
      }
    }
    matrix.push(row);
  }

  return { exchanges: names, ids: active.map(e => e.exchange), matrix };
}

/**
 * Ranking exchange berdasarkan kriteria
 * @param {Array} exchanges
 * @param {string} sortBy - 'price' | 'volume' | 'change'
 * @param {string} direction - 'asc' | 'desc'
 * @returns {Array}
 */
export function rankExchanges(exchanges, sortBy = 'price', direction = 'asc') {
  const active = [...exchanges].filter(e => e.price.last > 0);
  
  const comparators = {
    price: (a, b) => a.price.last - b.price.last,
    volume: (a, b) => a.volume24h.quote - b.volume24h.quote,
    change: (a, b) => a.change24h.percentage - b.change24h.percentage,
    name: (a, b) => a.displayName.localeCompare(b.displayName),
    fee: (a, b) => a.fees.taker - b.fees.taker,
  };

  const comparator = comparators[sortBy] || comparators.price;
  active.sort((a, b) => direction === 'asc' ? comparator(a, b) : comparator(b, a));
  
  return active;
}

/**
 * Cari peluang arbitrase terbaik
 * @param {Array} exchanges
 * @returns {Object}
 */
export function findBestArbitrage(exchanges) {
  const bestBuy = findBestBuy(exchanges);
  const bestSell = findBestSell(exchanges);
  
  if (!bestBuy || !bestSell || bestBuy.exchange === bestSell.exchange) {
    return null;
  }

  const profit = calculateArbitrageProfit(bestBuy, bestSell, 1);
  const spread = calculateSpread(bestBuy, bestSell);

  return {
    buyExchange: bestBuy,
    sellExchange: bestSell,
    spread,
    profit,
  };
}

/**
 * Hitung total volume dari semua exchange
 * @param {Array} exchanges
 * @returns {number}
 */
export function calculateTotalVolume(exchanges) {
  return exchanges
    .filter(e => e.status === 'active')
    .reduce((sum, e) => sum + (e.volume24h.quote || 0), 0);
}

/**
 * Hitung max spread dari semua kombinasi exchange
 * @param {Array} exchanges
 * @returns {Object} { buyExchange, sellExchange, spread }
 */
export function findMaxSpread(exchanges) {
  const active = exchanges.filter(e => e.status === 'active' && e.price.last > 0);
  if (active.length < 2) return null;

  let maxSpread = { percentage: -Infinity };
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

  return { buyExchange: bestBuyEx, sellExchange: bestSellEx, spread: maxSpread };
}
