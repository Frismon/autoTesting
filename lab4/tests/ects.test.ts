import { describe, it, expect } from 'vitest';
import { toEctsGrade } from '../src/ects';

describe('toEctsGrade', () => {
  it('повертає A для 95 балів', () => {
    // Arrange
    const score = 95;
    // Act
    const result = toEctsGrade(score);
    // Assert
    expect(result).toBe('A');
  });

  it('повертає відповідну літеру для балу з середини кожного інтервалу', () => {
    expect(toEctsGrade(85)).toBe('B');
    expect(toEctsGrade(77)).toBe('C');
    expect(toEctsGrade(68)).toBe('D');
    expect(toEctsGrade(61)).toBe('E');
    expect(toEctsGrade(45)).toBe('FX');
    expect(toEctsGrade(20)).toBe('F');
  });

  it('повертає вищу оцінку на нижній межі інтервалу (межові значення)', () => {
    expect(toEctsGrade(90)).toBe('A');
    expect(toEctsGrade(82)).toBe('B');
    expect(toEctsGrade(74)).toBe('C');
    expect(toEctsGrade(64)).toBe('D');
    expect(toEctsGrade(60)).toBe('E');
    expect(toEctsGrade(35)).toBe('FX');
  });

  it('повертає нижчу оцінку на верхній межі попереднього інтервалу', () => {
    expect(toEctsGrade(89)).toBe('B');
    expect(toEctsGrade(81)).toBe('C');
    expect(toEctsGrade(73)).toBe('D');
    expect(toEctsGrade(63)).toBe('E');
    expect(toEctsGrade(59)).toBe('FX');
    expect(toEctsGrade(34)).toBe('F');
  });

  it('приймає крайні значення шкали 0 і 100', () => {
    expect(toEctsGrade(0)).toBe('F');
    expect(toEctsGrade(100)).toBe('A');
  });

  it('не підвищує оцінку для дробового балу нижче межі', () => {
    expect(toEctsGrade(89.9)).toBe('B');
  });

  it("відхиляє від'ємний бал", () => {
    expect(() => toEctsGrade(-1)).toThrow('SCORE_OUT_OF_RANGE');
  });

  it('відхиляє бал понад 100', () => {
    expect(() => toEctsGrade(101)).toThrow('SCORE_OUT_OF_RANGE');
    expect(() => toEctsGrade(100.01)).toThrow('SCORE_OUT_OF_RANGE');
  });

  it('відхиляє NaN, нескінченність і нечислове значення', () => {
    expect(() => toEctsGrade(NaN)).toThrow('SCORE_OUT_OF_RANGE');
    expect(() => toEctsGrade(Infinity)).toThrow('SCORE_OUT_OF_RANGE');
    expect(() => toEctsGrade('95' as unknown as number)).toThrow(
      'SCORE_OUT_OF_RANGE',
    );
  });
});
