export interface ParkingOptions {
  night?: boolean;
  weekend?: boolean;
}

const FREE_MINUTES = 15;
const FIRST_HOUR_MINUTES = 60;
const FIRST_HOUR_FEE = 30;
const EXTRA_HOUR_FEE = 20;
const DAILY_CAP = 200;

export function calcParkingFee(
  minutes: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: ParkingOptions = {},
): number {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error('INVALID_DURATION');
  }
  if (minutes <= FREE_MINUTES) return 0;
  if (minutes <= FIRST_HOUR_MINUTES) return FIRST_HOUR_FEE;

  const extraHours = Math.ceil(
    (minutes - FIRST_HOUR_MINUTES) / FIRST_HOUR_MINUTES,
  );
  const fee = FIRST_HOUR_FEE + extraHours * EXTRA_HOUR_FEE;
  return Math.min(fee, DAILY_CAP);
}
