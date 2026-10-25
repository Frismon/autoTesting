import { describe, it, expect } from 'vitest';
import { applyRates, calcParkingFee } from '../src/parking';

describe('calcParkingFee', () => {
  it.each([-1, -60, 10.5])('відхиляє тривалість %s', (minutes) => {
    expect(() => calcParkingFee(minutes)).toThrow('INVALID_DURATION');
  });

  it.each([0, 1, 15])('перші 15 хвилин безкоштовні: %i', (minutes) => {
    expect(calcParkingFee(minutes)).toBe(0);
  });

  it.each([
    { minutes: 15, expected: 0 },
    { minutes: 16, expected: 30 },
    { minutes: 60, expected: 30 },
  ])('тривалість $minutes → $expected', ({ minutes, expected }) => {
    expect(calcParkingFee(minutes)).toBe(expected);
  });

  it.each([
    { minutes: 61, expected: 50 },
    { minutes: 120, expected: 50 },
    { minutes: 121, expected: 70 },
    { minutes: 180, expected: 70 },
  ])('наступні години: $minutes → $expected', ({ minutes, expected }) => {
    expect(calcParkingFee(minutes)).toBe(expected);
  });

  it.each([
    { minutes: 540, expected: 190 },
    { minutes: 600, expected: 200 },
    { minutes: 1440, expected: 200 },
  ])(
    'обмеження добової плати: $minutes → $expected',
    ({ minutes, expected }) => {
      expect(calcParkingFee(minutes)).toBe(expected);
    },
  );

  it.each([
    { minutes: 60, expected: 15 },
    { minutes: 121, expected: 35 },
    { minutes: 600, expected: 100 },
  ])('нічний тариф: $minutes → $expected', ({ minutes, expected }) => {
    expect(calcParkingFee(minutes, { night: true })).toBeCloseTo(expected, 2);
  });

  it.each([
    { minutes: 600, opts: { weekend: true }, expected: 160 },
    { minutes: 600, opts: { night: true, weekend: true }, expected: 80 },
  ])('вихідний: $minutes $opts → $expected', ({ minutes, opts, expected }) => {
    expect(calcParkingFee(minutes, opts)).toBeCloseTo(expected, 2);
  });
});

describe('applyRates', () => {
  it('заокруглює результат до копійок', () => {
    // 33 / 2 * 0.8 = 13.2 (без заокруглення — 13.200000000000001)
    expect(applyRates(33, { night: true, weekend: true })).toBe(13.2);
    // 101 * 0.8 = 80.8 (без заокруглення — 80.80000000000001)
    expect(applyRates(101, { weekend: true })).toBe(80.8);
  });

  it('повна плата заокруглена до копійок', () => {
    // 45 хв, ніч, вихідний: 30 / 2 * 0.8 = 12
    expect(calcParkingFee(45, { night: true, weekend: true })).toBe(12);
    // 121 хв, ніч, вихідний: 70 / 2 * 0.8 = 28
    expect(calcParkingFee(121, { night: true, weekend: true })).toBe(28);
  });
});
