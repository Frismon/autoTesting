import { describe, it, expect } from 'vitest';
import { calcParkingFee } from '../src/parking';

describe('calcParkingFee', () => {
  it.each([-1, -60, 10.5])('відхиляє тривалість %s', (minutes) => {
    expect(() => calcParkingFee(minutes)).toThrow('INVALID_DURATION');
  });

  it.each([0, 1, 15])('перші 15 хвилин безкоштовні: %i', (minutes) => {
    expect(calcParkingFee(minutes)).toBe(0);
  });
});
