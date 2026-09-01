import { describe, expect, it } from 'vitest';
import { parseShotText } from './parseShotText';

describe('parseShotText', () => {
  it('extracts distance with a yard unit and a direction keyword', () => {
    const result = parseShotText('145ヤード、ちょっと右');
    expect(result.distanceYds).toBe(145);
    expect(result.direction).toBe('PUSH');
  });

  it('extracts a bare number with no unit as the distance', () => {
    const result = parseShotText('150くらい 左');
    expect(result.distanceYds).toBe(150);
    expect(result.direction).toBe('PULL');
  });

  it('normalizes full-width digits', () => {
    const result = parseShotText('１４５ヤード');
    expect(result.distanceYds).toBe(145);
  });

  it('recognizes shot-shape words over generic left/right words', () => {
    expect(parseShotText('スライスした').direction).toBe('SLICE');
    expect(parseShotText('フックした').direction).toBe('HOOK');
  });

  it('recognizes straight', () => {
    expect(parseShotText('まっすぐ150').direction).toBe('STRAIGHT');
  });

  it('returns nulls without throwing when nothing matches', () => {
    const result = parseShotText('うーん、まあまあだった');
    expect(result.distanceYds).toBeNull();
    expect(result.direction).toBeNull();
    expect(result.rawText).toBe('うーん、まあまあだった');
  });
});
