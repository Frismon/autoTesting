export type EctsGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'FX' | 'F';

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

/**
 * Нижні межі інтервалів шкали ЄКТС (за спаданням).
 * 90–100 A, 82–89 B, 74–81 C, 64–73 D, 60–63 E, 35–59 FX;
 * усе, що нижче 35 (0–34), — F.
 */
const ECTS_SCALE: ReadonlyArray<{ min: number; grade: EctsGrade }> = [
  { min: 90, grade: 'A' },
  { min: 82, grade: 'B' },
  { min: 74, grade: 'C' },
  { min: 64, grade: 'D' },
  { min: 60, grade: 'E' },
  { min: 35, grade: 'FX' },
];

/**
 * Перетворює оцінку за стобальною шкалою на оцінку ЄКТС.
 * Кидає помилку SCORE_OUT_OF_RANGE, якщо бал не є скінченним числом
 * або лежить поза діапазоном [0; 100].
 */
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
