import { describe, it, expect } from 'vitest';
import {
  BFX_INDEX,
  createNormalizedData,
  normalizeBinance,
  normalizeOKX,
  normalizeBybit,
  normalizeKuCoin,
  normalizeHTX,
  normalizeGateIO,
  normalizeMEXC,
  normalizeBitfinex,
  normalizeCoinGeckoTicker,
} from '../js/api/normalizer.js';

describe('Market Normalizers - js/api/normalizer.js', () => {
  describe('BFX_INDEX constant', () => {
    it('defines named positional constants for Bitfinex v2 tuple', () => {
      expect(BFX_INDEX.BID).toBe(0);
      expect(BFX_INDEX.ASK).toBe(2);
      expect(BFX_INDEX.LAST_PRICE).toBe(6);
      expect(BFX_INDEX.VOLUME).toBe(7);
      expect(BFX_INDEX.HIGH).toBe(8);
      expect(BFX_INDEX.LOW).toBe(9);
    });
  });

  describe('createNormalizedData', () => {
    it('provides default schema contract for any exchange', () => {
      const data = createNormalizedData('binance');
      expect(data.exchange).toBe('binance');
      expect(data.displayName).toBe('Binance');
      expect(data.price.last).toBe(0);
      expect(data.fees.taker).toBe(0.10);
      expect(data.status).toBe('active');
    });
  });

  describe('normalizeBinance', () => {
    it('normalizes valid Binance 24hr ticker', () => {
      const raw = {
        symbol: 'PAXGUSDT',
        lastPrice: '2650.50',
        bidPrice: '2650.00',
        askPrice: '2651.00',
        highPrice: '2670.00',
        lowPrice: '2630.00',
        priceChange: '15.50',
        priceChangePercent: '0.589',
        volume: '120.5',
        quoteVolume: '319385.25',
      };
      const result = normalizeBinance(raw, 'PAXG/USDT');
      expect(result.exchange).toBe('binance');
      expect(result.price.last).toBe(2650.50);
      expect(result.price.bid).toBe(2650.00);
      expect(result.price.ask).toBe(2651.00);
      expect(result.volume24h.quote).toBe(319385.25);
    });

    it('returns null on invalid or empty Binance payload', () => {
      expect(normalizeBinance(null, 'PAXG/USDT')).toBeNull();
      expect(normalizeBinance({}, 'PAXG/USDT')).toBeNull();
    });
  });

  describe('normalizeOKX', () => {
    it('normalizes OKX ticker payload', () => {
      const raw = {
        data: [{
          instId: 'PAXG-USDT',
          last: '2652.10',
          bidPx: '2651.80',
          askPx: '2652.40',
          high24h: '2675.00',
          low24h: '2635.00',
          open24h: '2640.00',
          vol24h: '85.2',
          volCcy24h: '225958.92',
        }],
      };
      const result = normalizeOKX(raw, 'PAXG/USDT');
      expect(result.exchange).toBe('okx');
      expect(result.price.last).toBe(2652.10);
      expect(result.price.bid).toBe(2651.80);
      expect(result.change24h.absolute).toBeCloseTo(12.10, 4);
    });

    it('returns null on missing OKX data', () => {
      expect(normalizeOKX({ data: [] }, 'PAXG/USDT')).toBeNull();
      expect(normalizeOKX(null, 'PAXG/USDT')).toBeNull();
    });
  });

  describe('normalizeBybit', () => {
    it('normalizes Bybit spot ticker payload', () => {
      const raw = {
        result: {
          list: [{
            symbol: 'XAUTUSDT',
            lastPrice: '2648.70',
            bid1Price: '2648.20',
            ask1Price: '2649.00',
            highPrice24h: '2665.00',
            lowPrice24h: '2620.00',
            prevPrice24h: '2630.00',
            volume24h: '45.0',
            turnover24h: '119191.50',
          }],
        },
      };
      const result = normalizeBybit(raw, 'XAUT/USDT');
      expect(result.exchange).toBe('bybit');
      expect(result.price.last).toBe(2648.70);
      expect(result.price.bid).toBe(2648.20);
      expect(result.volume24h.quote).toBe(119191.50);
    });
  });

  describe('normalizeKuCoin', () => {
    it('normalizes KuCoin market stats payload', () => {
      const raw = {
        data: {
          last: '2649.50',
          buy: '2649.00',
          sell: '2650.00',
          high: '2668.00',
          low: '2625.00',
          changePrice: '10.50',
          changeRate: '0.004',
          vol: '60.0',
          volValue: '158970.00',
        },
      };
      const result = normalizeKuCoin(raw, 'PAXG/USDT');
      expect(result.exchange).toBe('kucoin');
      expect(result.price.last).toBe(2649.50);
      expect(result.change24h.percentage).toBeCloseTo(0.4, 2);
    });
  });

  describe('normalizeHTX', () => {
    it('normalizes HTX merged market ticker', () => {
      const raw = {
        tick: {
          close: 2651.00,
          open: 2640.00,
          bid: [2650.50, 1.5],
          ask: [2651.50, 2.0],
          high: 2670.00,
          low: 2630.00,
          amount: 35.0,
          vol: 92785.00,
        },
      };
      const result = normalizeHTX(raw, 'XAUT/USDT');
      expect(result.exchange).toBe('htx');
      expect(result.price.last).toBe(2651.00);
      expect(result.price.bid).toBe(2650.50);
      expect(result.price.ask).toBe(2651.50);
    });
  });

  describe('normalizeGateIO', () => {
    it('normalizes Gate.io spot ticker array', () => {
      const raw = [{
        currency_pair: 'PAXG_USDT',
        last: '2650.25',
        highest_bid: '2649.80',
        lowest_ask: '2650.70',
        high_24h: '2669.00',
        low_24h: '2631.00',
        change_percentage: '0.75',
        base_volume: '40.0',
        quote_volume: '106010.00',
      }];
      const result = normalizeGateIO(raw, 'PAXG/USDT');
      expect(result.exchange).toBe('gateio');
      expect(result.price.last).toBe(2650.25);
      expect(result.price.bid).toBe(2649.80);
      expect(result.price.ask).toBe(2650.70);
    });
  });

  describe('normalizeMEXC', () => {
    it('normalizes MEXC GOLD prefixed pair ticker', () => {
      const raw = {
        symbol: 'GOLD(PAXG)USDT',
        lastPrice: '2652.00',
        bidPrice: '2651.50',
        askPrice: '2652.50',
        highPrice: '2672.00',
        lowPrice: '2632.00',
        priceChange: '12.00',
        priceChangePercent: '0.45',
        volume: '55.0',
        quoteVolume: '145860.00',
      };
      const result = normalizeMEXC(raw, 'PAXG/USDT');
      expect(result.exchange).toBe('mexc');
      expect(result.price.last).toBe(2652.00);
      expect(result.price.bid).toBe(2651.50);
      expect(result.price.ask).toBe(2652.50);
    });
  });

  describe('normalizeBitfinex', () => {
    it('normalizes Bitfinex v2 ticker using BFX_INDEX constants', () => {
      // [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_PERC, LAST_PRICE, VOLUME, HIGH, LOW]
      const raw = [
        2648.0, 1.2, 2649.5, 2.5, 14.5, 0.0055, 2649.0, 30.5, 2665.0, 2625.0
      ];
      const result = normalizeBitfinex(raw, 'XAUT/USDT');
      expect(result.exchange).toBe('bitfinex');
      expect(result.price.last).toBe(2649.0);
      expect(result.price.bid).toBe(2648.0);
      expect(result.price.ask).toBe(2649.5);
      expect(result.price.high24h).toBe(2665.0);
      expect(result.price.low24h).toBe(2625.0);
      expect(result.change24h.percentage).toBeCloseTo(0.55, 2);
    });

    it('returns null on truncated Bitfinex array', () => {
      expect(normalizeBitfinex([2648.0], 'XAUT/USDT')).toBeNull();
      expect(normalizeBitfinex(null, 'XAUT/USDT')).toBeNull();
    });
  });

  describe('normalizeCoinGeckoTicker', () => {
    it('maps known CEX identifiers and calculates synthetic bid/ask from spread %', () => {
      const raw = {
        market: { identifier: 'binance' },
        last: 2650.0,
        volume: 100.0,
        bid_ask_spread_percentage: 0.1, // 0.1% spread
      };
      const result = normalizeCoinGeckoTicker(raw, 'PAXG');
      expect(result.exchange).toBe('binance');
      expect(result.price.last).toBe(2650.0);
      // bid: last * (1 - 0.1 / 200) = 2650 * (1 - 0.0005) = 2648.675
      expect(result.price.bid).toBeCloseTo(2648.675, 2);
      // ask: last * (1 + 0.1 / 200) = 2650 * (1 + 0.0005) = 2651.325
      expect(result.price.ask).toBeCloseTo(2651.325, 2);
    });

    it('returns null for unknown market identifier', () => {
      const raw = { market: { identifier: 'unknown_dex' }, last: 100 };
      expect(normalizeCoinGeckoTicker(raw, 'PAXG')).toBeNull();
    });
  });
});
