import { describe, it, expect } from 'vitest';
import { estimateDelivery, type Region } from '../src/order';

describe('estimateDelivery', () => {
  it('повертає 3 дні для звичайної доставки в центр до cut-off', () => {
    // Arrange
    const region: Region = 'center';
    const isExpress = false;

    // Act
    const days = estimateDelivery(region, isExpress, 10);

    // Assert
    expect(days).toBe(3);
  });

  it.each([
    { region: 'local' as const, isExpress: false, expected: 1 },
    { region: 'local' as const, isExpress: true, expected: 1 },
    { region: 'west' as const, isExpress: false, expected: 2 },
    { region: 'west' as const, isExpress: true, expected: 1 },
    { region: 'center' as const, isExpress: false, expected: 3 },
    { region: 'center' as const, isExpress: true, expected: 2 },
    { region: 'east' as const, isExpress: false, expected: 5 },
    { region: 'east' as const, isExpress: true, expected: 3 },
  ])(
    'регіон $region, експрес = $isExpress → $expected дн.',
    ({ region, isExpress, expected }) => {
      expect(estimateDelivery(region, isExpress)).toBe(expected);
    },
  );

  it.each([
    { orderHour: 13, expected: 2 },
    { orderHour: 14, expected: 3 },
    { orderHour: 15, expected: 3 },
  ])(
    'межа cut-off: замовлення о $orderHour:00 у west → $expected дн.',
    ({ orderHour, expected }) => {
      expect(estimateDelivery('west', false, orderHour)).toBe(expected);
    },
  );

  it('додає день після cut-off і для експрес-доставки', () => {
    expect(estimateDelivery('east', true, 18)).toBe(4);
  });

  it('експрес ніколи не повільніший за звичайну доставку', () => {
    const regions: Region[] = ['local', 'west', 'center', 'east'];
    const slower = regions.filter(
      (r) => estimateDelivery(r, true) > estimateDelivery(r, false),
    );
    expect(slower).toEqual([]);
  });

  it.each([0, 1, 22, 23])('приймає допустиму годину %i', (orderHour) => {
    expect(() => estimateDelivery('local', false, orderHour)).not.toThrow();
  });

  it.each([-1, 24, 12.5, NaN])('відхиляє годину замовлення %s', (orderHour) => {
    expect(() => estimateDelivery('local', false, orderHour)).toThrow(
      'INVALID_ORDER_HOUR',
    );
  });

  it.each(['north', '', 'toString'])(
    'відхиляє невідомий регіон «%s»',
    (region) => {
      expect(() => estimateDelivery(region as Region, false)).toThrow(
        'UNKNOWN_REGION',
      );
    },
  );

  it.each([1, 'true', undefined])(
    'відхиляє небулевий прапорець експрес-доставки %s',
    (flag) => {
      expect(() =>
        estimateDelivery('west', flag as unknown as boolean),
      ).toThrow('INVALID_EXPRESS_FLAG');
    },
  );
});
