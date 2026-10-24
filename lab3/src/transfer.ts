const FEE_PERCENT = 1;
const MIN_FEE = 5;

export function calcTransferFee(amount: number): number {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const fee = (amount * FEE_PERCENT) / 100;
  return Math.min(Math.max(fee, MIN_FEE), 150);
}
