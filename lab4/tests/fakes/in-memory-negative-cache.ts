import type { NegativeCache } from '../../src/promo-service';

export class InMemoryNegativeCache implements NegativeCache {
  private items = new Map<string, number>();

  async get(code: string): Promise<number | undefined> {
    return this.items.get(code);
  }
  async set(code: string, expiresAt: number): Promise<void> {
    this.items.set(code, expiresAt);
  }
  has(code: string): boolean {
    return this.items.has(code);
  }
  get size(): number {
    return this.items.size;
  }
}
