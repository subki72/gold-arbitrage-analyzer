import { describe, it, expect } from 'vitest';
import {
  roundFinancial,
  formatCurrency,
  formatPercentage,
  formatVolume,
  formatNumber,
  formatTimeAgo,
  formatTime,
  formatDateTime,
  formatSpreadBadge,
} from '../js/utils/formatters.js';

describe('Formatters - js/utils/formatters.js', () => {
  describe('roundFinancial', () => {
    it('eliminates IEEE 754 precision artifacts', () => {
      // 0.1 + 0.2 is 0.30000000000000004 in raw JS float
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(roundFinancial(0.1 + 0.2, 4)).toBe(0.3);

      // 0.7 * 0.1 is 0.06999999999999999 in raw JS float
      expect(0.7 * 0.1).not.toBe(0.07);
      expect(roundFinancial(0.7 * 0.1, 4)).toBe(0.07);
    });

    it('returns 0 for non-numeric or non-finite values', () => {
      expect(roundFinancial(NaN)).toBe(0);
      expect(roundFinancial(null)).toBe(0);
      expect(roundFinancial('200')).toBe(0);
      expect(roundFinancial(Infinity)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats valid numbers to USD currency strings', () => {
      expect(formatCurrency(2650.5)).toBe('$2,650.50');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('returns $— for empty strings, null, undefined, and booleans (DATA-01 fix)', () => {
      expect(formatCurrency('')).toBe('$—');
      expect(formatCurrency(false)).toBe('$—');
      expect(formatCurrency(true)).toBe('$—');
      expect(formatCurrency(null)).toBe('$—');
      expect(formatCurrency(undefined)).toBe('$—');
      expect(formatCurrency(NaN)).toBe('$—');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentages with sign and decimals', () => {
      expect(formatPercentage(1.234, 2)).toBe('+1.23%');
      expect(formatPercentage(-0.456, 2)).toBe('-0.46%');
      expect(formatPercentage(0, 2)).toBe('0.00%');
    });

    it('returns —% for invalid inputs', () => {
      expect(formatPercentage(null)).toBe('—%');
      expect(formatPercentage(undefined)).toBe('—%');
      expect(formatPercentage('abc')).toBe('—%');
    });
  });

  describe('formatVolume', () => {
    it('formats large volumes with B, M, K suffixes', () => {
      expect(formatVolume(2500000000)).toBe('$2.50B');
      expect(formatVolume(15400000)).toBe('$15.40M');
      expect(formatVolume(24500)).toBe('$24.5K');
      expect(formatVolume(500.5)).toBe('$500.50');
    });

    it('returns $— for non-numeric volume', () => {
      expect(formatVolume(null)).toBe('$—');
      expect(formatVolume(NaN)).toBe('$—');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234567.89, 2)).toBe('1,234,567.89');
    });

    it('returns — for non-numerics', () => {
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber('')).toBe('—');
    });
  });

  describe('formatTimeAgo', () => {
    it('returns relative English time descriptions', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 2000)).toBe('just now');
      expect(formatTimeAgo(now - 30000)).toBe('30s ago');
      expect(formatTimeAgo(now - 120000)).toBe('2m ago');
      expect(formatTimeAgo(now - 7200000)).toBe('2h ago');
      expect(formatTimeAgo(now - 172800000)).toBe('2d ago');
    });
  });

  describe('formatTime & formatDateTime', () => {
    it('formats timestamps into valid date/time strings', () => {
      const ts = 1770000000000;
      expect(formatTime(ts)).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(formatDateTime(ts)).not.toBe('—');
    });

    it('returns — on invalid timestamps', () => {
      expect(formatTime('invalid')).toBe('—');
      expect(formatDateTime('invalid')).toBe('—');
    });
  });

  describe('formatSpreadBadge', () => {
    it('returns appropriate CSS classes based on spread thresholds', () => {
      expect(formatSpreadBadge(1.2).className).toBe('spread-great');
      expect(formatSpreadBadge(0.6).className).toBe('spread-good');
      expect(formatSpreadBadge(0.35).className).toBe('spread-ok');
      expect(formatSpreadBadge(0.1).className).toBe('spread-neutral');
    });
  });
});
