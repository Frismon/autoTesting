export type EctsGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'FX' | 'F';

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

const ECTS_SCALE: ReadonlyArray<{ min: number; grade: EctsGrade }> = [
  { min: 90, grade: 'A' },
  { min: 82, grade: 'B' },
  { min: 74, grade: 'C' },
  { min: 64, grade: 'D' },
  { min: 60, grade: 'E' },
  { min: 35, grade: 'FX' },
];

export function toEctsGrade(score: number): EctsGrade {
  if (
    typeof score !== 'number' ||
    !Number.isFinite(score) ||
    score < MIN_SCORE ||
    score > MAX_SCORE
  ) {
    throw new Error('SCORE_OUT_OF_RANGE');
  }
  for (const { min, grade } of ECTS_SCALE) {
    if (score >= min) {
      return grade;
    }
  }
  return 'F';
}
