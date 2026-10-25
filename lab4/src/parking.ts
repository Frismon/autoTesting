export interface ParkingOptions {
  night?: boolean;
  weekend?: boolean;
}

const FREE_MINUTES = 15;
const FIRST_HOUR_MINUTES = 60;
const FIRST_HOUR_FEE = 30;
const EXTRA_HOUR_FEE = 20;
const DAILY_CAP = 200;
const NIGHT_RATE = 0.5;
const WEEKEND_RATE = 0.8;

const round2 = (n: number): number => Math.round(n * 100) / 100;

function assertValidDuration(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error('INVALID_DURATION');
  }
}

export function calcBaseFee(minutes: number): number {
  if (minutes <= FREE_MINUTES) return 0;
  if (minutes <= FIRST_HOUR_MINUTES) return FIRST_HOUR_FEE;

  const extraHours = Math.ceil(
    (minutes - FIRST_HOUR_MINUTES) / FIRST_HOUR_MINUTES,
  );
  return Math.min(FIRST_HOUR_FEE + extraHours * EXTRA_HOUR_FEE, DAILY_CAP);
}

export function applyRates(fee: number, options: ParkingOptions): number {
  let result = fee;
  if (options.night) result *= NIGHT_RATE;
  if (options.weekend) result *= WEEKEND_RATE;
  return round2(result);
}

export function calcParkingFee(
  minutes: number,
  options: ParkingOptions = {},
): number {
  assertValidDuration(minutes);
  return applyRates(calcBaseFee(minutes), options);
}
