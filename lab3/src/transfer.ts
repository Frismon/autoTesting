export function calcTransferFee(amount: number): number {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  return amount / 100;
}
