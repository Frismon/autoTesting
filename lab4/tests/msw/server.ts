import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const RATE_URL = 'https://api.example.com/rate';

export const PROMO_BASE = 'https://promo.example.com';
export const PROMO_URL = `${PROMO_BASE}/promo/:code`;
/** Довідник дійсних промокодів, який «повертає» підмінений HTTP-сервіс. */
export const PROMO_CODES: Record<string, number> = {
  SUMMER10: 0.1,
  VIP25: 0.25,
};

export const handlers = [
  http.get(RATE_URL, () => HttpResponse.json({ rate: 41.25 })),
  http.get(PROMO_URL, ({ params }) => {
    const code = String(params.code);
    const discount = PROMO_CODES[code];
    return discount === undefined
      ? HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
      : HttpResponse.json({ code, discount });
  }),
];

export const server = setupServer(...handlers);
