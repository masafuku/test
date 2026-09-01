import { describe, expect, it } from 'vitest';
import { matchClubFromText, parseShotText } from './parseShotText';
import type { Club } from '../types/models';

function club(id: string, name: string, category: Club['category']): Club {
  return { id, name, category, isActive: true, createdAt: '', updatedAt: '' };
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
    expect(result.strength).toBeNull();
    expect(result.lie).toBeNull();
    expect(result.lateralDeviationYds).toBeNull();
    expect(result.rawText).toBe('うーん、まあまあだった');
  });

  it('extracts strength keywords', () => {
    expect(parseShotText('ハーフで150').strength).toBe('HALF');
    expect(parseShotText('フルスイング150').strength).toBe('FULL');
    expect(parseShotText('ピッチエンドランで30').strength).toBe('PITCH_AND_RUN');
    expect(parseShotText('ロブで20').strength).toBe('LOB');
    expect(parseShotText('ランニングで40').strength).toBe('RUNNING');
    expect(parseShotText('150ヤード').strength).toBeNull();
  });

  it('extracts lie keywords', () => {
    expect(parseShotText('ティーショットで230').lie).toBe('TEE');
    expect(parseShotText('フェアウェイから150').lie).toBe('FAIRWAY');
    expect(parseShotText('ラフから140').lie).toBe('ROUGH');
    expect(parseShotText('アプローチで30').lie).toBe('APPROACH');
    expect(parseShotText('150ヤード').lie).toBeNull();
  });

  it('extracts a numeric lateral deviation next to a direction word, in either order, signed by side', () => {
    expect(parseShotText('ちょっと右5ヤード').lateralDeviationYds).toBe(5);
    expect(parseShotText('5ヤード右').lateralDeviationYds).toBe(5);
    expect(parseShotText('左3ヤード').lateralDeviationYds).toBe(-3);
    expect(parseShotText('3ヤード左').lateralDeviationYds).toBe(-3);
    // direction word alone, no number given -> categorical direction only
    expect(parseShotText('ちょっと右').lateralDeviationYds).toBeNull();
    expect(parseShotText('ちょっと右').direction).toBe('PUSH');
  });

  it('does not confuse the main carry distance with the lateral deviation number', () => {
    const result = parseShotText('150ヤード、ちょっと右5ヤード');
    expect(result.distanceYds).toBe(150);
    expect(result.lateralDeviationYds).toBe(5);
  });
});

describe('matchClubFromText', () => {
  it('matches numbered irons via "N番アイアン"', () => {
    expect(matchClubFromText('7番アイアンで150', BAG)?.name).toBe('7 Iron');
    expect(matchClubFromText('6アイアン', BAG)?.name).toBe('6 Iron');
  });

  it('matches woods, hybrid, utility, driver, putter', () => {
    expect(matchClubFromText('3番ウッドで200', BAG)?.name).toBe('3 Wood');
    expect(matchClubFromText('ハイブリッドで180', BAG)?.name).toBe('4 Hybrid');
    expect(matchClubFromText('ユーティリティで165', BAG)?.name).toBe('U');
    expect(matchClubFromText('ドライバーでフル230', BAG)?.name).toBe('Driver');
    expect(matchClubFromText('パターで', BAG)?.name).toBe('Putter');
  });

  it('matches wedges by loft degree and by common names', () => {
    expect(matchClubFromText('52度で60ヤード', BAG)?.name).toBe('52°');
    expect(matchClubFromText('サンドウェッジで50', BAG)?.name).toBe('56°');
    expect(matchClubFromText('アプローチウェッジで80', BAG)?.name).toBe('52°');
    expect(matchClubFromText('ピッチングウェッジで100', BAG)?.name).toBe('W');
  });

  it('returns null when nothing recognized, leaving the current tap-selection untouched', () => {
    expect(matchClubFromText('150ヤード、ちょっと右', BAG)).toBeNull();
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
