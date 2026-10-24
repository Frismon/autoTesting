const FEE_PERCENT = 1;
const MIN_FEE = 5;
const MAX_FEE = 150;
const VERIFICATION_LIMIT = 50000;

const toKopecks = (uah: number): number => Math.round(uah * 100);
const toUah = (kopecks: number): number => kopecks / 100;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

function assertTransferable(amount: number): void {
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6
  ) {
    throw new Error('INVALID_AMOUNT');
  }
  if (amount > VERIFICATION_LIMIT) throw new Error('VERIFICATION_REQUIRED');
}

export function calcTransferFee(amount: number): number {
  assertTransferable(amount);
  const feeKop = Math.round((toKopecks(amount) * FEE_PERCENT) / 100);
  return toUah(clamp(feeKop, toKopecks(MIN_FEE), toKopecks(MAX_FEE)));
}
