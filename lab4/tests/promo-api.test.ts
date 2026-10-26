import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, PROMO_BASE, PROMO_URL } from './msw/server';
import { HttpPromoApi } from '../src/promo-api';
import { PromoService } from '../src/promo-service';
import { InMemoryNegativeCache } from './fakes/in-memory-negative-cache';

const api = new HttpPromoApi(PROMO_BASE);

describe('HttpPromoApi', () => {
  it('повертає знижку з успішної відповіді', async () => {
    await expect(api.lookup('SUMMER10')).resolves.toEqual({
      code: 'SUMMER10',
      discount: 0.1,
    });
  });

  it('статус 404 означає, що коду не існує', async () => {
    await expect(api.lookup('WINTER99')).resolves.toBeNull();
  });

  it.each([500, 503, 429])(
    'статус %i → PROMO_SERVICE_UNAVAILABLE',
    async (status) => {
      server.use(http.get(PROMO_URL, () => new HttpResponse(null, { status })));
      await expect(api.lookup('SUMMER10')).rejects.toThrow(
        'PROMO_SERVICE_UNAVAILABLE',
      );
    },
  );

  it.each([
    { name: 'знижка рядком', body: { code: 'SUMMER10', discount: '0.1' } },
    { name: 'без знижки', body: { code: 'SUMMER10' } },
    { name: 'знижка понад 100 %', body: { code: 'SUMMER10', discount: 1.5 } },
    { name: 'нульова знижка', body: { code: 'SUMMER10', discount: 0 } },
    { name: 'без коду', body: { discount: 0.1 } },
  ])('некоректний формат: $name → INVALID_PROMO_FORMAT', async ({ body }) => {
    server.use(http.get(PROMO_URL, () => HttpResponse.json(body)));
    await expect(api.lookup('SUMMER10')).rejects.toThrow(
      'INVALID_PROMO_FORMAT',
    );
  });

  it('тіло не є JSON → INVALID_PROMO_FORMAT', async () => {
    server.use(http.get(PROMO_URL, () => HttpResponse.text('<html>')));
    await expect(api.lookup('SUMMER10')).rejects.toThrow(
      'INVALID_PROMO_FORMAT',
    );
  });

  it('мережева помилка → PROMO_SERVICE_UNAVAILABLE', async () => {
    server.use(http.get(PROMO_URL, () => HttpResponse.error()));
    await expect(api.lookup('SUMMER10')).rejects.toThrow(
      'PROMO_SERVICE_UNAVAILABLE',
    );
  });

  it('передає код у шлях запиту', async () => {
    let path: string | undefined;
    server.use(
      http.get(PROMO_URL, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ code: 'VIP25', discount: 0.25 });
      }),
    );

    await api.lookup('VIP25');

    expect(path).toBe('/promo/VIP25');
  });
});

describe('PromoService + HttpPromoApi (через MSW)', () => {
  it('повторна перевірка недійсного коду не надсилає HTTP-запит', async () => {
    let requests = 0;
    server.use(
      http.get(PROMO_URL, () => {
        requests++;
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const service = new PromoService(api, new InMemoryNegativeCache(), {
      info: () => {},
      warn: () => {},
    });

    await service.check('WINTER99');
    await service.check('WINTER99');
    await service.check('winter99');

    expect(requests).toBe(1);
  });
});
