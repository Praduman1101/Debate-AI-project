/**
 * Frontend helper utilities tests
 * Run with: jest src/utils/helpers.test.js
 */

import {
  formatDuration,
  formatDate,
  formatRelativeTime,
  truncate,
  capitalize,
  scoreToGrade,
  getResultConfig,
  clamp,
  getInitials,
  calcWinRate,
  formatDelta,
} from './helpers';

describe('formatDuration()', () => {
  it('returns "0s" for zero', ()   => expect(formatDuration(0)).toBe('0s'));
  it('returns seconds',     ()   => expect(formatDuration(45)).toBe('45s'));
  it('returns minutes+secs',()   => expect(formatDuration(125)).toBe('2m 5s'));
  it('returns hours+mins',  ()   => expect(formatDuration(3661)).toBe('1h 1m'));
  it('handles undefined',   ()   => expect(formatDuration()).toBe('0s'));
  it('handles negative',    ()   => expect(formatDuration(-10)).toBe('0s'));
});

describe('truncate()', () => {
  it('does not truncate short strings',    () => expect(truncate('hello', 10)).toBe('hello'));
  it('truncates long strings with ellipsis',() => {
    const result = truncate('abcdefghijk', 8);
    expect(result).toHaveLength(8);
    expect(result.endsWith('…')).toBe(true);
  });
  it('handles empty string', () => expect(truncate('', 10)).toBe(''));
});

describe('capitalize()', () => {
  it('capitalizes first letter',   () => expect(capitalize('hello')).toBe('Hello'));
  it('handles already capitalized',() => expect(capitalize('Hello')).toBe('Hello'));
  it('handles empty string',       () => expect(capitalize('')).toBe(''));
  it('handles single char',        () => expect(capitalize('a')).toBe('A'));
});

describe('scoreToGrade()', () => {
  it('A+ for 90+',  () => expect(scoreToGrade(95).grade).toBe('A+'));
  it('A for 80-89', () => expect(scoreToGrade(85).grade).toBe('A'));
  it('B for 70-79', () => expect(scoreToGrade(75).grade).toBe('B'));
  it('C for 60-69', () => expect(scoreToGrade(65).grade).toBe('C'));
  it('D for 50-59', () => expect(scoreToGrade(55).grade).toBe('D'));
  it('F for below 50', () => expect(scoreToGrade(40).grade).toBe('F'));
  it('returns a color',   () => expect(typeof scoreToGrade(80).color).toBe('string'));
});

describe('getResultConfig()', () => {
  it('returns win config for "user"',     () => expect(getResultConfig('user').label).toBe('Won'));
  it('returns loss config for "opponent"',() => expect(getResultConfig('opponent').label).toBe('Lost'));
  it('returns draw config for "draw"',    () => expect(getResultConfig('draw').label).toBe('Draw'));
  it('handles unknown winner',            () => expect(getResultConfig(null).label).toBe('—'));
});

describe('clamp()', () => {
  it('clamps above max', () => expect(clamp(150, 0, 100)).toBe(100));
  it('clamps below min', () => expect(clamp(-5,  0, 100)).toBe(0));
  it('passes through value in range', () => expect(clamp(50, 0, 100)).toBe(50));
});

describe('getInitials()', () => {
  it('returns initials for full name', () => expect(getInitials('John Doe')).toBe('JD'));
  it('returns single char for one name',() => expect(getInitials('Alice')).toBe('A'));
  it('limits to 2 chars',              () => expect(getInitials('A B C')).toBe('AB'));
  it('handles empty string',           () => expect(getInitials('')).toBe('?'));
});

describe('calcWinRate()', () => {
  it('calculates percentage', () => expect(calcWinRate(3, 10)).toBe(30));
  it('returns 0 for 0 total', () => expect(calcWinRate(5, 0)).toBe(0));
  it('handles 100%',          () => expect(calcWinRate(10, 10)).toBe(100));
});

describe('formatDelta()', () => {
  it('prefixes positive with +', () => expect(formatDelta(5)).toBe('+5'));
  it('keeps negative sign',      () => expect(formatDelta(-3)).toBe('-3'));
  it('handles zero',             () => expect(formatDelta(0)).toBe('+0'));
});
