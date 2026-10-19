export type Tier = 'basic' | 'silver' | 'gold';

export interface OrderItem {
  sku: string;
  price: number;
  qty: number;
}

export const TIER_DISCOUNT: Record<Tier, number> = {
  basic: 0,
  silver: 0.05,
  gold: 0.1,
};

export const BIG_ORDER_FROM = 2000;
export const BIG_ORDER_BONUS = 0.05;
export const MAX_DISCOUNT = 0.25;
export const FREE_SHIPPING_FROM = 1000;
export const SHIPPING_FEE = 60;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcSubtotal(items: OrderItem[]): number {
  if (items.length === 0) throw new Error('EMPTY_ORDER');
  return items.reduce((sum, item) => {
    if (item.price < 0) throw new Error('NEGATIVE_PRICE');
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error('INVALID_QTY');
    }
    return sum + item.price * item.qty;
  }, 0);
}

export function calcDiscountRate(
  tier: Tier,
  subtotal: number,
  promoRate = 0,
): number {
  if (promoRate < 0) throw new Error('INVALID_PROMO');
  let rate = TIER_DISCOUNT[tier];
  if (subtotal >= BIG_ORDER_FROM) rate += BIG_ORDER_BONUS;
  return Math.min(rate + promoRate, MAX_DISCOUNT);
}

export function calcShipping(amount: number): number {
  return amount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}

export function calcOrderTotal(
  items: OrderItem[],
  tier: Tier,
  promoRate = 0,
): number {
  const subtotal = calcSubtotal(items);
  const rate = calcDiscountRate(tier, subtotal, promoRate);
  const afterDiscount = round2(subtotal * (1 - rate));
  return round2(afterDiscount + calcShipping(afterDiscount));
}

// ---------- Варіант 7: оцінка терміну доставки ----------

export type Region = 'local' | 'west' | 'center' | 'east';

/** Кількість робочих днів доставки: [звичайна, експрес]. */
export const DELIVERY_DAYS: Record<
  Region,
  { standard: number; express: number }
> = {
  local: { standard: 1, express: 1 }, // Закарпатська область
  west: { standard: 2, express: 1 }, // західні області
  center: { standard: 3, express: 2 }, // центральні області та Київ
  east: { standard: 5, express: 3 }, // східні та південні області
};

/** Замовлення, оформлені від цієї години, відправляються наступного дня. */
export const CUTOFF_HOUR = 14;

/**
 * Оцінює термін доставки в робочих днях.
 * region — один із чотирьох регіонів; isExpress — прискорена доставка;
 * orderHour — година оформлення замовлення (0–23, за замовчуванням 12).
 * Винятки: UNKNOWN_REGION, INVALID_EXPRESS_FLAG, INVALID_ORDER_HOUR.
 */
export function estimateDelivery(
  region: Region,
  isExpress: boolean,
  orderHour = 12,
): number {
  if (!Object.hasOwn(DELIVERY_DAYS, region)) {
    throw new Error('UNKNOWN_REGION');
  }
  if (typeof isExpress !== 'boolean') {
    throw new Error('INVALID_EXPRESS_FLAG');
  }
  if (!Number.isInteger(orderHour) || orderHour < 0 || orderHour > 23) {
    throw new Error('INVALID_ORDER_HOUR');
  }
  const plan = DELIVERY_DAYS[region];
  const days = isExpress ? plan.express : plan.standard;
  return orderHour >= CUTOFF_HOUR ? days + 1 : days;
}
