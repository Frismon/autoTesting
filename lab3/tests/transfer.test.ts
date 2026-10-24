import { describe, it, expect } from 'vitest';
import { calcTransferFee } from '../src/transfer';

describe('calcTransferFee', () => {
  it.each([0, -1, -0.01])('відхиляє недодатну суму %s', (amount) => {
    expect(() => calcTransferFee(amount)).toThrow('INVALID_AMOUNT');
  });

  it.each([
    { amount: 1000, expected: 10 },
    { amount: 2000, expected: 20 },
    { amount: 10000, expected: 100 },
  ])('комісія 1 %: $amount → $expected', ({ amount, expected }) => {
    expect(calcTransferFee(amount)).toBe(expected);
  });

  it.each([
    { amount: 0.01, expected: 5 },
    { amount: 499, expected: 5 },
    { amount: 500, expected: 5 },
    { amount: 501, expected: 5.01 },
  ])('мінімальна комісія 5 грн: $amount → $expected', ({ amount, expected }) => {
    expect(calcTransferFee(amount)).toBe(expected);
  });

  it.each([
    { amount: 14999, expected: 149.99 },
    { amount: 15000, expected: 150 },
    { amount: 15001, expected: 150 },
    { amount: 40000, expected: 150 },
  ])('максимальна комісія 150 грн: $amount → $expected', ({ amount, expected }) => {
    expect(calcTransferFee(amount)).toBe(expected);
  });
});
