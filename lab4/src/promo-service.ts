// ---------- Варіант 7: перевірка промокоду з кешуванням негативного результату ----------

export interface PromoInfo {
  code: string;
  discount: number; // частка від 0 до 1
}

/** Довідник промокодів. null — коду не існує або він недійсний. */
export interface PromoApi {
  lookup(code: string): Promise<PromoInfo | null>;
}

/** Кеш негативних результатів: код → момент (мс), до якого результат дійсний. */
export interface NegativeCache {
  get(code: string): Promise<number | undefined>;
  set(code: string, expiresAt: number): Promise<void>;
}

export interface PromoLogger {
  info(message: string): void;
  warn(message: string): void;
}

export type PromoCheckResult =
  { valid: true; discount: number } | { valid: false };

/** Скільки часу пам’ятати, що код недійсний: 10 хвилин. */
export const NEGATIVE_TTL_MS = 10 * 60 * 1000;
const CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

export class PromoService {
  constructor(
    private api: PromoApi,
    private cache: NegativeCache,
    private logger: PromoLogger,
    private ttlMs = NEGATIVE_TTL_MS,
  ) {}

  async check(rawCode: string): Promise<PromoCheckResult> {
    const code = rawCode.trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) throw new Error('INVALID_CODE');

    if (await this.isKnownInvalid(code)) return { valid: false };

    const promo = await this.api.lookup(code);
    if (!promo) {
      await this.rememberInvalid(code);
      this.logger.info(`Промокод ${code} відхилено`);
      return { valid: false };
    }
    return { valid: true, discount: promo.discount };
  }

  private async isKnownInvalid(code: string): Promise<boolean> {
    try {
      const expiresAt = await this.cache.get(code);
      return expiresAt !== undefined && Date.now() < expiresAt;
    } catch {
      this.logger.warn('Кеш недоступний, перевірка через API');
      return false;
    }
  }

  private async rememberInvalid(code: string): Promise<void> {
    try {
      await this.cache.set(code, Date.now() + this.ttlMs);
    } catch {
      this.logger.warn(`Не вдалося закешувати промокод ${code}`);
    }
  }
}
