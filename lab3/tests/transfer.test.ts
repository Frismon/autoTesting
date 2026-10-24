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
});
