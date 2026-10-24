const FEE_PERCENT = 1;
const MIN_FEE = 5;
const MAX_FEE = 150;
const VERIFICATION_LIMIT = 50000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

function assertTransferable(amount: number): void {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  if (amount > VERIFICATION_LIMIT) throw new Error('VERIFICATION_REQUIRED');
}

export function calcTransferFee(amount: number): number {
  assertTransferable(amount);
  const amountKop = Math.round(amount * 100);
  const feeKop = Math.round((amountKop * FEE_PERCENT) / 100);
  return clamp(feeKop, MIN_FEE * 100, MAX_FEE * 100) / 100;
}
