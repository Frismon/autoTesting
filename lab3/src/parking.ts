export interface ParkingOptions {
  night?: boolean;
  weekend?: boolean;
}

export function calcParkingFee(
  minutes: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: ParkingOptions = {},
): number {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error('INVALID_DURATION');
  }
  if (minutes <= 15) return 0;
  return 30;
}
