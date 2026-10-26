import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PromoService,
  NEGATIVE_TTL_MS,
  type PromoApi,
  type PromoLogger,
  type NegativeCache,
} from '../src/promo-service';
import { InMemoryNegativeCache } from './fakes/in-memory-negative-cache';

const NOW = new Date('2026-03-15T10:00:00.000Z');

describe('PromoService', () => {
  let api: PromoApi;
  let cache: InMemoryNegativeCache;
  let logger: PromoLogger;
  let service: PromoService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    api = {
      lookup: vi.fn(async (code: string) =>
        code === 'SUMMER10' ? { code, discount: 0.1 } : null,
      ),
    }; // stub
    cache = new InMemoryNegativeCache(); // fake
    logger = { info: vi.fn(), warn: vi.fn() }; // spy
    service = new PromoService(api, cache, logger);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('повертає знижку для дійсного коду', async () => {
    await expect(service.check('SUMMER10')).resolves.toEqual({
      valid: true,
      discount: 0.1,
    });
  });

  it('позитивний результат не кешується', async () => {
    await service.check('SUMMER10');
    await service.check('SUMMER10');

    expect(cache.size).toBe(0);
    expect(api.lookup).toHaveBeenCalledTimes(2);
  });

  it('запамʼятовує недійсний код у кеші на 10 хвилин', async () => {
    await expect(service.check('WINTER99')).resolves.toEqual({ valid: false });

    await expect(cache.get('WINTER99')).resolves.toBe(
      NOW.getTime() + NEGATIVE_TTL_MS,
    );
  });

  it('повторна перевірка того самого коду не спричиняє запиту', async () => {
    const first = await service.check('WINTER99');
    const second = await service.check('WINTER99');

    expect(second).toEqual(first);
    expect(api.lookup).toHaveBeenCalledTimes(1);
  });

  it('нормалізує код: регістр і пробіли не обходять кеш', async () => {
    await service.check('winter99');
    await service.check('  WINTER99 ');

    expect(cache.has('WINTER99')).toBe(true);
    expect(api.lookup).toHaveBeenCalledTimes(1);
  });

  it('кеш одного коду не впливає на інший', async () => {
    await service.check('WINTER99');
    await service.check('AUTUMN50');

    expect(api.lookup).toHaveBeenCalledTimes(2);
    expect(cache.size).toBe(2);
  });

  it.each([
    { elapsed: NEGATIVE_TTL_MS - 1, requests: 1 },
    { elapsed: NEGATIVE_TTL_MS, requests: 2 },
    { elapsed: NEGATIVE_TTL_MS + 1, requests: 2 },
  ])(
    'термін кешу: через $elapsed мс запитів до API — $requests',
    async ({ elapsed, requests }) => {
      await service.check('WINTER99');
      vi.setSystemTime(NOW.getTime() + elapsed);

      await service.check('WINTER99');

      expect(api.lookup).toHaveBeenCalledTimes(requests);
    },
  );

  it.each(['', 'AB1', 'SUMMER-10', 'A'.repeat(17)])(
    'відхиляє код некоректного формату «%s» без звертання до API',
    async (code) => {
      await expect(service.check(code)).rejects.toThrow('INVALID_CODE');
      expect(api.lookup).not.toHaveBeenCalled();
    },
  );

  it('записує в журнал відхилений код, але не дійсний', async () => {
    await service.check('SUMMER10');
    await service.check('WINTER99');

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('WINTER99'),
    );
  });

  describe('відмови залежностей', () => {
    it('недоступність API не кешується як негативний результат', async () => {
      api.lookup = vi
        .fn()
        .mockRejectedValueOnce(new Error('PROMO_SERVICE_UNAVAILABLE'))
        .mockResolvedValueOnce({ code: 'SUMMER10', discount: 0.1 });

      await expect(service.check('SUMMER10')).rejects.toThrow(
        'PROMO_SERVICE_UNAVAILABLE',
      );
      expect(cache.size).toBe(0);
      expect(logger.info).not.toHaveBeenCalled();

      await expect(service.check('SUMMER10')).resolves.toEqual({
        valid: true,
        discount: 0.1,
      });
    });

    it('некоректна відповідь API не кешується', async () => {
      api.lookup = vi.fn().mockRejectedValue(new Error('INVALID_PROMO_FORMAT'));

      await expect(service.check('WINTER99')).rejects.toThrow(
        'INVALID_PROMO_FORMAT',
      );
      expect(cache.size).toBe(0);
    });

    it('за недоступного кешу перевіряє код через API', async () => {
      const brokenCache: NegativeCache = {
        get: vi.fn().mockRejectedValue(new Error('CACHE_DOWN')),
        set: vi.fn().mockRejectedValue(new Error('CACHE_DOWN')),
      };
      service = new PromoService(api, brokenCache, logger);

      await expect(service.check('SUMMER10')).resolves.toEqual({
        valid: true,
        discount: 0.1,
      });
      await expect(service.check('WINTER99')).resolves.toEqual({
        valid: false,
      });
      expect(logger.warn).toHaveBeenCalledTimes(3);
    });
  });
});
