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
  ])(
    'мінімальна комісія 5 грн: $amount → $expected',
    ({ amount, expected }) => {
      expect(calcTransferFee(amount)).toBe(expected);
    },
  );

  it.each([
    { amount: 14999, expected: 149.99 },
    { amount: 15000, expected: 150 },
    { amount: 15001, expected: 150 },
    { amount: 40000, expected: 150 },
  ])(
    'максимальна комісія 150 грн: $amount → $expected',
    ({ amount, expected }) => {
      expect(calcTransferFee(amount)).toBe(expected);
    },
  );

  it('сума рівно 50 000 грн ще не потребує перевірки', () => {
    expect(calcTransferFee(50000)).toBe(150);
  });

  it.each([50000.01, 50001, 1000000])(
    'сума %s понад 50 000 грн потребує додаткової перевірки',
    (amount) => {
      expect(() => calcTransferFee(amount)).toThrow('VERIFICATION_REQUIRED');
    },
  );

  it.each([
    { amount: 1234.56, expected: 12.35 },
    { amount: 1234.44, expected: 12.34 },
    { amount: 1000.49, expected: 10 },
    { amount: 1000.5, expected: 10.01 },
    { amount: 501.5, expected: 5.02 },
  ])(
    'заокруглює комісію до копійок: $amount → $expected',
    ({ amount, expected }) => {
      expect(calcTransferFee(amount)).toBe(expected);
    },
  );

  it.each([NaN, Infinity, 100.001, '1000' as unknown as number])(
    'відхиляє некоректне значення суми %s',
    (amount) => {
      expect(() => calcTransferFee(amount)).toThrow('INVALID_AMOUNT');
    },
  );

  it.each([0.29, 100.01, 49999.99])('приймає суму з копійками %s', (amount) => {
    expect(() => calcTransferFee(amount)).not.toThrow();
  });
});
