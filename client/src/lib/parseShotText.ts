import type { ShotDirection } from '../types/models';

export interface ParsedShotText {
  distanceYds: number | null;
  direction: ShotDirection | null;
  rawText: string;
}

/**
 * Parses free text — typically produced by iOS's built-in keyboard dictation,
 * not a speech-recognition API we implement ourselves — into a distance and
 * a direction. Deliberately does NOT try to extract the club: club name
 * phrasing varies too much (and dictation mishears it too easily) for a
 * rule-based parser to stay robust, so club selection stays a tap in the UI
 * and this function only has to solve a much narrower problem.
 *
 * Never throws: on no match it just leaves that field null so the UI can
 * fall back to manual entry instead of silently discarding the input.
 */
export function parseShotText(text: string): ParsedShotText {
  return {
    distanceYds: extractDistance(text),
    direction: extractDirection(text),
    rawText: text,
  };
}

function normalizeDigits(text: string): string {
  // Full-width digits/comma -> half-width, so "１４５" and "145" match the same regex.
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/,/g, '');
}

function extractDistance(text: string): number | null {
  const normalized = normalizeDigits(text);

  // Prefer a number explicitly tagged with a distance unit (yard/y/m).
  const withUnit = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ヤード|yd|yds|y|メートル|m)\b/i);
  if (withUnit) {
    return parseFloat(withUnit[1]);
  }

  // Fall back to the first bare number mentioned — most voice memos about a
  // shot only contain one number, the distance.
  const bareNumber = normalized.match(/\d+(?:\.\d+)?/);
  if (bareNumber) {
    return parseFloat(bareNumber[0]);
  }

  return null;
}

interface DirectionRule {
  direction: ShotDirection;
  keywords: string[];
}

// Order matters: more specific shot-shape words are checked before plain
// left/right words, so "スライス" wins over a generic "右".
const DIRECTION_RULES: DirectionRule[] = [
  { direction: 'SLICE', keywords: ['スライス'] },
  { direction: 'HOOK', keywords: ['フック'] },
  { direction: 'DRAW', keywords: ['ドロー'] },
  { direction: 'FADE', keywords: ['フェード'] },
  { direction: 'PULL', keywords: ['引っかけ', 'ちょいひだり'] },
  { direction: 'PUSH', keywords: ['押し出し'] },
  { direction: 'STRAIGHT', keywords: ['まっすぐ', 'ストレート', '真っ直ぐ'] },
  { direction: 'PUSH', keywords: ['右'] },
  { direction: 'PULL', keywords: ['左'] },
];

function extractDirection(text: string): ShotDirection | null {
  for (const rule of DIRECTION_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.direction;
    }
  }
  return null;
}
