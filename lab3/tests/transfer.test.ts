import { describe, it, expect } from 'vitest';
import { calcTransferFee } from '../src/transfer';

describe('calcTransferFee', () => {
  it.each([0, -1, -0.01])('відхиляє недодатну суму %s', (amount) => {
    expect(() => calcTransferFee(amount)).toThrow('INVALID_AMOUNT');
  });
});
