const FEE_PERCENT = 1;
const MIN_FEE = 5;
const MAX_FEE = 150;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function calcTransferFee(amount: number): number {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  if (amount > 50000) throw new Error('VERIFICATION_REQUIRED');
  const fee = (amount * FEE_PERCENT) / 100;
  return clamp(fee, MIN_FEE, MAX_FEE);
}
