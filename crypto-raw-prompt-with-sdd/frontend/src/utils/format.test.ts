import { describe, it, expect } from 'vitest';
import { formatUSD, formatCrypto, formatPercent } from './format';

describe('formatUSD', () => {
  it('formats a positive number with two decimals', () => {
    expect(formatUSD(1234.5)).toBe('$1,234.50');
  });

  it('formats a negative number', () => {
    expect(formatUSD(-500)).toBe('-$500.00');
  });

  it('formats zero', () => {
    expect(formatUSD(0)).toBe('$0.00');
  });

  it('rounds to two decimal places', () => {
    expect(formatUSD(1234.567)).toBe('$1,234.57');
  });

  it('formats very large values', () => {
    expect(formatUSD(1_000_000_000)).toBe('$1,000,000,000.00');
  });

  it('formats very small values', () => {
    expect(formatUSD(0.01)).toBe('$0.01');
  });
});

describe('formatCrypto', () => {
  it('trims trailing zeros', () => {
    expect(formatCrypto(0.001)).toBe('0.001');
  });

  it('formats whole numbers without decimals', () => {
    expect(formatCrypto(10)).toBe('10');
  });

  it('preserves up to 8 decimal places', () => {
    expect(formatCrypto(0.12345678)).toBe('0.12345678');
  });

  it('rounds beyond 8 decimal places', () => {
    expect(formatCrypto(0.123456789)).toBe('0.12345679');
  });

  it('formats large numbers with commas', () => {
    expect(formatCrypto(1500.5)).toBe('1,500.5');
  });

  it('formats zero', () => {
    expect(formatCrypto(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('formats a positive percentage with + sign', () => {
    expect(formatPercent(12.345)).toBe('+12.35%');
  });

  it('formats a negative percentage', () => {
    expect(formatPercent(-5.6)).toBe('-5.60%');
  });

  it('formats zero as positive', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('formats very large percentages', () => {
    expect(formatPercent(1000)).toBe('+1000.00%');
  });

  it('formats very small percentages', () => {
    expect(formatPercent(0.001)).toBe('+0.00%');
  });
});
