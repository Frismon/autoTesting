// ---------- Варіант 7: комісія за переказ коштів ----------

const FEE_PERCENT = 1;
const MIN_FEE = 5;
const MAX_FEE = 150;
/** Перекази понад цю суму потребують додаткової перевірки. */
const VERIFICATION_LIMIT = 50000;
/** Допуск похибки з рухомою комою під час перевірки цілих копійок. */
const KOPECK_EPSILON = 1e-6;

const toKopecks = (uah: number): number => Math.round(uah * 100);
const toUah = (kopecks: number): number => kopecks / 100;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const hasWholeKopecks = (uah: number): boolean =>
  Math.abs(uah * 100 - toKopecks(uah)) <= KOPECK_EPSILON;

function isValidAmount(amount: unknown): amount is number {
  return (
    typeof amount === 'number' &&
    Number.isFinite(amount) &&
    amount > 0 &&
    hasWholeKopecks(amount)
  );
}

function assertTransferable(amount: number): void {
  if (!isValidAmount(amount)) throw new Error('INVALID_AMOUNT');
  if (amount > VERIFICATION_LIMIT) throw new Error('VERIFICATION_REQUIRED');
}

/**
 * Комісія за переказ: 1 % від суми, не менше 5 і не більше 150 грн,
 * заокруглена до копійок (половина копійки — вгору).
 * Винятки: INVALID_AMOUNT, VERIFICATION_REQUIRED (сума понад 50 000 грн).
 */
export function calcTransferFee(amount: number): number {
  assertTransferable(amount);
  const feeKop = Math.round((toKopecks(amount) * FEE_PERCENT) / 100);
  return toUah(clamp(feeKop, toKopecks(MIN_FEE), toKopecks(MAX_FEE)));
}
