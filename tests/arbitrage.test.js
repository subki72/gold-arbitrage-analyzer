import { describe, it, expect } from 'vitest';
import {
  findBestBuy,
  findBestSell,
  calculateSpread,
  calculateArbitrageProfit,
  generateSpreadMatrix,
  rankExchanges,
  findBestArbitrage,
  calculateTotalVolume,
  findMaxSpread,
  getEffectiveBuyPrice,
  getEffectiveSellPrice,
} from '../js/services/arbitrage.js';

describe('Arbitrage Engine - js/services/arbitrage.js', () => {
  const mockExchanges = [
    {
      exchange: 'binance',
      displayName: 'Binance',
      color: '#F0B90B',
      price: { last: 2600.0, bid: 2599.5, ask: 2600.5, high24h: 2620, low24h: 2580 },
      change24h: { absolute: 10, percentage: 0.38 },
      volume24h: { base: 1000, quote: 2600000 },
      fees: { maker: 0.10, taker: 0.10 },
      status: 'active',
    },
    {
      exchange: 'okx',
      displayName: 'OKX',
      color: '#FFFFFF',
      price: { last: 2615.0, bid: 2614.0, ask: 2616.0, high24h: 2630, low24h: 2590 },
      change24h: { absolute: 25, percentage: 0.96 },
      volume24h: { base: 800, quote: 2092000 },
      fees: { maker: 0.08, taker: 0.10 },
      status: 'active',
    },
    {
      exchange: 'kucoin',
      displayName: 'KuCoin',
      color: '#24AE8F',
      price: { last: 2595.0, bid: 2594.0, ask: 2596.0, high24h: 2610, low24h: 2570 },
      change24h: { absolute: -5, percentage: -0.19 },
      volume24h: { base: 500, quote: 1297500 },
      fees: { maker: 0.10, taker: 0.10 },
      status: 'active',
    },
    {
      exchange: 'bybit',
      displayName: 'Bybit',
      color: '#F7A600',
      price: { last: 0, bid: 0, ask: 0, high24h: 0, low24h: 0 },
      change24h: { absolute: 0, percentage: 0 },
      volume24h: { base: 0, quote: 0 },
      fees: { maker: 0.10, taker: 0.10 },
      status: 'offline',
    },
  ];

  describe('findBestBuy & findBestSell', () => {
    it('selects exchange with lowest ask price as best buy', () => {
      const bestBuy = findBestBuy(mockExchanges);
      expect(bestBuy).not.toBeNull();
      expect(bestBuy.exchange).toBe('kucoin');
      expect(getEffectiveBuyPrice(bestBuy)).toBe(2596.0);
    });

    it('selects exchange with highest bid price as best sell', () => {
      const bestSell = findBestSell(mockExchanges);
      expect(bestSell).not.toBeNull();
      expect(bestSell.exchange).toBe('okx');
      expect(getEffectiveSellPrice(bestSell)).toBe(2614.0);
    });

    it('handles empty or non-array inputs gracefully', () => {
      expect(findBestBuy([])).toBeNull();
      expect(findBestBuy(null)).toBeNull();
      expect(findBestSell([])).toBeNull();
      expect(findBestSell(undefined)).toBeNull();
    });

    it('ignores offline exchanges and exchanges with 0 price', () => {
      const offlineOnly = [
        { exchange: 'x', status: 'offline', price: { last: 0, bid: 0, ask: 0 } },
      ];
      expect(findBestBuy(offlineOnly)).toBeNull();
      expect(findBestSell(offlineOnly)).toBeNull();
    });
  });

  describe('calculateSpread', () => {
    it('computes correct absolute and percentage spread', () => {
      const buyEx = mockExchanges.find(e => e.exchange === 'kucoin'); // ask 2596
      const sellEx = mockExchanges.find(e => e.exchange === 'okx');    // bid 2614
      const spread = calculateSpread(buyEx, sellEx);

      expect(spread.absolute).toBe(18.0);
      expect(spread.percentage).toBeCloseTo((18 / 2596) * 100, 4);
    });

    it('returns 0 when buy or sell exchange is missing', () => {
      expect(calculateSpread(null, mockExchanges[0])).toEqual({ absolute: 0, percentage: 0 });
      expect(calculateSpread(mockExchanges[0], null)).toEqual({ absolute: 0, percentage: 0 });
    });
  });

  describe('calculateArbitrageProfit (Taker Fee & Friction Modeling)', () => {
    const buyEx = mockExchanges.find(e => e.exchange === 'kucoin'); // ask 2596, taker 0.10%
    const sellEx = mockExchanges.find(e => e.exchange === 'okx');   // bid 2614, taker 0.10%, maker 0.08%

    it('applies taker fee on the sell side (verifying BUG-02 fix)', () => {
      const result = calculateArbitrageProfit(buyEx, sellEx, 1);
      // Buy cost: 2596 * 1 = 2596
      // Buy fee: 2596 * 0.001 = 2.596
      // Sell rev: 2614 * 1 = 2614
      // Sell fee MUST use taker fee (0.10%), NOT maker fee (0.08%):
      // 2614 * 0.001 = 2.614 (if it used maker fee, it would be 2.0912)
      expect(result.buyFee).toBe(2.596);
      expect(result.sellFee).toBe(2.614);
      expect(result.grossProfit).toBe(18.0);
      expect(result.netProfit).toBeCloseTo(18.0 - 2.596 - 2.614, 4);
      expect(result.isProfitable).toBe(true);
    });

    it('deducts on-chain token transfer fee (PAXG 0.02%)', () => {
      const options = { transferFeeRate: 0.0002 };
      const result = calculateArbitrageProfit(buyEx, sellEx, 1, options);
      // transferFee = 2596 * 0.0002 = 0.5192
      expect(result.transferFee).toBe(0.5192);
      expect(result.totalFees).toBeCloseTo(2.596 + 2.614 + 0.5192, 4);
      expect(result.netProfit).toBeCloseTo(18.0 - result.totalFees, 4);
    });

    it('deducts withdrawal and gas fees', () => {
      const options = {
        withdrawalFee: 5.0,
        gasFee: 2.5,
        transferFeeRate: 0.0002,
      };
      const result = calculateArbitrageProfit(buyEx, sellEx, 1, options);
      expect(result.withdrawalFee).toBe(5.0);
      expect(result.gasFee).toBe(2.5);
      const expectedTotalFees = 2.596 + 2.614 + 0.5192 + 5.0 + 2.5;
      expect(result.totalFees).toBeCloseTo(expectedTotalFees, 4);
      expect(result.netProfit).toBeCloseTo(18.0 - expectedTotalFees, 4);
    });

    it('marks isProfitable as false when costs exceed gross profit', () => {
      const options = { withdrawalFee: 25.0 }; // $25 fee exceeds $18 spread
      const result = calculateArbitrageProfit(buyEx, sellEx, 1, options);
      expect(result.netProfit).toBeLessThan(0);
      expect(result.isProfitable).toBe(false);
    });

    it('handles invalid or zero amount safely', () => {
      const zeroResult = calculateArbitrageProfit(buyEx, sellEx, 0);
      expect(zeroResult.isProfitable).toBe(false);
      expect(zeroResult.netProfit).toBe(0);

      const negResult = calculateArbitrageProfit(buyEx, sellEx, -5);
      expect(negResult.isProfitable).toBe(false);
      expect(negResult.netProfit).toBe(0);
    });
  });

  describe('generateSpreadMatrix', () => {
    it('produces an n x n matrix with null diagonal', () => {
      const active = mockExchanges.filter(e => e.status === 'active');
      const { exchanges, matrix } = generateSpreadMatrix(active);

      expect(exchanges.length).toBe(3);
      expect(matrix.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(matrix[i][i]).toBeNull();
      }
    });
  });

  describe('rankExchanges', () => {
    it('sorts exchanges by price ascending and descending', () => {
      const asc = rankExchanges(mockExchanges, 'price', 'asc');
      expect(asc[0].exchange).toBe('kucoin'); // 2595
      expect(asc[asc.length - 1].exchange).toBe('okx'); // 2615

      const desc = rankExchanges(mockExchanges, 'price', 'desc');
      expect(desc[0].exchange).toBe('okx');
      expect(desc[desc.length - 1].exchange).toBe('kucoin');
    });

    it('sorts exchanges by volume', () => {
      const byVol = rankExchanges(mockExchanges, 'volume', 'desc');
      expect(byVol[0].exchange).toBe('binance'); // 2600000
    });
  });

  describe('findBestArbitrage & findMaxSpread', () => {
    it('finds pair with greatest arbitrage net profit', () => {
      const best = findBestArbitrage(mockExchanges);
      expect(best).not.toBeNull();
      expect(best.buyExchange.exchange).toBe('kucoin');
      expect(best.sellExchange.exchange).toBe('okx');
      expect(best.profit.isProfitable).toBe(true);
    });

    it('finds maximum spread combination', () => {
      const max = findMaxSpread(mockExchanges);
      expect(max).not.toBeNull();
      expect(max.buyExchange.exchange).toBe('kucoin');
      expect(max.sellExchange.exchange).toBe('okx');
      expect(max.spread.percentage).toBeGreaterThan(0);
    });

    it('returns null if fewer than 2 active exchanges exist', () => {
      expect(findMaxSpread([mockExchanges[0]])).toBeNull();
      expect(findBestArbitrage([mockExchanges[0]])).toBeNull();
      // Only 1 active and 1 offline
      const mixed = [mockExchanges[0], mockExchanges[3]];
      expect(findMaxSpread(mixed)).toBeNull();
      expect(findBestArbitrage(mixed)).toBeNull();
    });

    it('ensures buyExchange and sellExchange are distinct entities', () => {
      const best = findBestArbitrage(mockExchanges);
      expect(best.buyExchange.exchange).not.toBe(best.sellExchange.exchange);
      const max = findMaxSpread(mockExchanges);
      expect(max.buyExchange.exchange).not.toBe(max.sellExchange.exchange);
    });
  });

  describe('calculateTotalVolume', () => {
    it('sums turnover of active exchanges only', () => {
      const total = calculateTotalVolume(mockExchanges);
      expect(total).toBe(2600000 + 2092000 + 1297500);
    });

    it('returns 0 when no active exchanges exist', () => {
      expect(calculateTotalVolume([])).toBe(0);
      expect(calculateTotalVolume([mockExchanges[3]])).toBe(0);
    });
  });
});
