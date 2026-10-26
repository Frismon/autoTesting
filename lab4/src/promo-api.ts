import type { PromoApi, PromoInfo } from './promo-service';

export class HttpPromoApi implements PromoApi {
  constructor(private baseUrl: string) {}

  async lookup(code: string): Promise<PromoInfo | null> {
    let response: Response;
    try {
      response = await fetch(
        `${this.baseUrl}/promo/${encodeURIComponent(code)}`,
      );
    } catch {
      throw new Error('PROMO_SERVICE_UNAVAILABLE');
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('PROMO_SERVICE_UNAVAILABLE');

    const data = await response.json().catch(() => undefined);
    if (
      typeof data?.code !== 'string' ||
      typeof data.discount !== 'number' ||
      data.discount <= 0 ||
      data.discount > 1
    ) {
      throw new Error('INVALID_PROMO_FORMAT');
    }
    return { code: data.code, discount: data.discount };
  }
}
