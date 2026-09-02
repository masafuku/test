import { describe, expect, it } from 'vitest';
import { matchClubFromText, parseShotText, type Club } from './parseShotText';

// Mirrors client/src/lib/parseShotText.test.ts's key cases — see that file's
// comment about keeping the two copies in sync.

function club(id: string, name: string, category: string): Club {
  return { id, name, category };
}

const BAG: Club[] = [
  club('1', 'Driver', 'DRIVER'),
  club('2', '3 Wood', 'WOOD'),
  club('3', '4 Hybrid', 'HYBRID'),
  club('4', '6 Iron', 'IRON'),
  club('5', '7 Iron', 'IRON'),
  club('6', 'U', 'IRON'),
  club('7', 'W', 'WEDGE'),
  club('8', '52°', 'WEDGE'),
  club('9', '56°', 'WEDGE'),
  club('10', 'Putter', 'PUTTER'),
];

describe('parseShotText (server copy)', () => {
  it('prefers the unit-tagged number over an earlier unrelated number', () => {
    expect(parseShotText('7番アイアン150ヤード').distanceYds).toBe(150);
  });

  it('extracts strength and lie keywords', () => {
    expect(parseShotText('ハーフで150').strength).toBe('HALF');
    expect(parseShotText('ラフから140').lie).toBe('ROUGH');
  });

  it('extracts a numeric lateral deviation next to a direction word', () => {
    expect(parseShotText('ちょっと右5ヤード').lateralDeviationYds).toBe(5);
    expect(parseShotText('左3ヤード').lateralDeviationYds).toBe(-3);
  });

  it('returns nulls without throwing when nothing matches', () => {
    const result = parseShotText('うーん、まあまあだった');
    expect(result.distanceYds).toBeNull();
    expect(result.direction).toBeNull();
    expect(result.strength).toBeNull();
    expect(result.lie).toBeNull();
  });

  it('full sentence: club + lie + strength + distance + direction + lateral deviation all extracted together', () => {
    const text = '7番アイアン、ラフからハーフで150ヤード、ちょっと右5ヤード';
    const parsed = parseShotText(text);
    const matchedClub = matchClubFromText(text, BAG);
    expect(matchedClub?.name).toBe('7 Iron');
    expect(parsed.lie).toBe('ROUGH');
    expect(parsed.strength).toBe('HALF');
    expect(parsed.distanceYds).toBe(150);
    expect(parsed.direction).toBe('PUSH');
    expect(parsed.lateralDeviationYds).toBe(5);
  });
});

describe('matchClubFromText (server copy)', () => {
  it('matches numbered irons, wedges by degree, and named clubs', () => {
    expect(matchClubFromText('7番アイアンで150', BAG)?.name).toBe('7 Iron');
    expect(matchClubFromText('52度で60ヤード', BAG)?.name).toBe('52°');
    expect(matchClubFromText('ドライバーでフル230', BAG)?.name).toBe('Driver');
    expect(matchClubFromText('パターで', BAG)?.name).toBe('Putter');
  });

  it('returns null when nothing recognized', () => {
    expect(matchClubFromText('150ヤード、ちょっと右', BAG)).toBeNull();
  });
});
