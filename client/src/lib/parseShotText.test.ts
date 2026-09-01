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

  it('prefers the unit-tagged number over an earlier unrelated number (club number, loft, etc.)', () => {
    expect(parseShotText('7番アイアン150ヤード').distanceYds).toBe(150);
    expect(parseShotText('7番アイアンで150ヤード、ちょっと右').distanceYds).toBe(150);
    expect(parseShotText('７番アイアン１５０ヤード').distanceYds).toBe(150);
    expect(parseShotText('52度で60ヤード').distanceYds).toBe(60);
  });

  it('matches ASCII distance units too', () => {
    expect(parseShotText('150y').distanceYds).toBe(150);
    expect(parseShotText('150 yds').distanceYds).toBe(150);
    expect(parseShotText('150m').distanceYds).toBe(150);
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
