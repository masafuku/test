import type { Club, ShotDirection, ShotLie, ShotStrength } from '../types/models';

export interface ParsedShotText {
  distanceYds: number | null;
  direction: ShotDirection | null;
  lateralDeviationYds: number | null;
  strength: ShotStrength | null;
  lie: ShotLie | null;
  rawText: string;
}

/**
 * Parses free text — typically produced by iOS's built-in keyboard dictation,
 * not a speech-recognition API we implement ourselves — into distance,
 * direction, strength and lie. Club is intentionally NOT handled here (see
 * matchClubFromText below): it needs the caller's actual registered club
 * list to be reliable, so it can't be a pure function of the text alone.
 *
 * Never throws: on no match a field is just left null so the UI can fall
 * back to manual/tap entry instead of silently discarding the input.
 */
export function parseShotText(text: string): ParsedShotText {
  return {
    distanceYds: extractDistance(text),
    direction: extractDirection(text),
    lateralDeviationYds: extractLateralDeviationYds(text),
    strength: extractStrength(text),
    lie: extractLie(text),
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
  // \b (word boundary) only applies to the ASCII unit aliases below —
  // ヤード/メートル are never \w in JS regex, so a trailing \b after them can
  // never be a boundary and the match always fails, silently falling through
  // to the bare-number fallback and picking up an unrelated earlier number
  // (e.g. "7番アイアン150ヤード" would wrongly extract "7").
  const withUnit = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ヤード|メートル|yds?\b|y\b|m\b)/i);
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

const UNIT = '(?:ヤード|メートル|yds?|y|m)?';

/**
 * Numeric left/right miss distance, only when a number sits right next to a
 * 右/左 word (either order: "右5ヤード" or "5ヤード右") — this keeps it from
 * ever being confused with the main carry-distance number extracted above.
 * Right = positive, left = negative. Returns null if no number is given
 * (the categorical `direction` from extractDirection is still available).
 */
function extractLateralDeviationYds(text: string): number | null {
  const normalized = normalizeDigits(text);

  const rightAfter = normalized.match(new RegExp(`右\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`));
  if (rightAfter) return parseFloat(rightAfter[1]);
  const rightBefore = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT}\\s*右`));
  if (rightBefore) return parseFloat(rightBefore[1]);

  const leftAfter = normalized.match(new RegExp(`左\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`));
  if (leftAfter) return -parseFloat(leftAfter[1]);
  const leftBefore = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT}\\s*左`));
  if (leftBefore) return -parseFloat(leftBefore[1]);

  return null;
}

interface KeywordRule<T extends string> {
  value: T;
  keywords: string[];
}

function matchKeywordRules<T extends string>(text: string, rules: KeywordRule<T>[]): T | null {
  for (const rule of rules) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.value;
  }
  return null;
}

// Longer/more specific phrases first so e.g. "ピッチエンドラン" isn't shadowed
// by a shorter, unrelated substring of another rule.
const STRENGTH_RULES: KeywordRule<ShotStrength>[] = [
  { value: 'PITCH_AND_RUN', keywords: ['ピッチエンドラン', 'ピッチアンドラン'] },
  { value: 'RUNNING', keywords: ['ランニング'] },
  { value: 'LOB', keywords: ['ロブ'] },
  { value: 'HALF', keywords: ['ハーフ'] },
  { value: 'FULL', keywords: ['フル'] },
];

function extractStrength(text: string): ShotStrength | null {
  return matchKeywordRules(text, STRENGTH_RULES);
}

const LIE_RULES: KeywordRule<ShotLie>[] = [
  { value: 'TEE', keywords: ['ティーショット', 'ティー'] },
  { value: 'FAIRWAY', keywords: ['フェアウェイ'] },
  { value: 'ROUGH', keywords: ['ラフ'] },
  { value: 'APPROACH', keywords: ['アプローチ'] },
];

function extractLie(text: string): ShotLie | null {
  return matchKeywordRules(text, LIE_RULES);
}

/**
 * Matches dictated club phrasing against the caller's actual registered
 * clubs — a finite, known set, so this can be far more reliable than free-form
 * club-name extraction. Best-effort: unrecognized phrasing returns null and
 * the UI leaves whatever club was already tap-selected untouched.
 *
 * NOTE: the numbered-iron/wood/degree rules assume club names shaped like
 * "N Iron" / "N Wood" / "NN°" (see lib/clubDefaults.ts's STANDARD_BAG). If
 * the bag's naming convention changes, these rules need revisiting.
 */
export function matchClubFromText(text: string, clubs: Club[]): Club | null {
  const normalized = normalizeDigits(text);

  // 1. The club's own registered name appears verbatim (handles clubs named
  //    exactly "U", "W", "52°", "Putter", "Driver", etc.).
  const exact = clubs.find((c) => normalized.includes(c.name));
  if (exact) return exact;

  const byName = (name: string) => clubs.find((c) => c.name === name) ?? null;

  const iron = normalized.match(/([1-9])\s*番?\s*アイアン/);
  if (iron) {
    const club = byName(`${iron[1]} Iron`);
    if (club) return club;
  }

  const wood = normalized.match(/([1-9])\s*番?\s*ウッド/);
  if (wood) {
    const club = byName(`${wood[1]} Wood`);
    if (club) return club;
  }

  const hybrid = normalized.match(/([1-9])?\s*番?\s*ハイブリッド/);
  if (hybrid) {
    const club = hybrid[1] ? byName(`${hybrid[1]} Hybrid`) : clubs.find((c) => c.category === 'HYBRID');
    if (club) return club;
  }

  if (/ユーティリティ/.test(normalized)) {
    const club = byName('U');
    if (club) return club;
  }

  if (/ドライバー/.test(normalized)) {
    const club = clubs.find((c) => c.category === 'DRIVER');
    if (club) return club;
  }

  const degree = normalized.match(/(\d{2})\s*度/);
  if (degree) {
    const club = byName(`${degree[1]}°`);
    if (club) return club;
  }

  if (/ピッチングウェッジ|\bPW\b/i.test(normalized)) {
    const club = byName('W');
    if (club) return club;
  }
  if (/サンドウェッジ|\bSW\b/i.test(normalized)) {
    const club = byName('56°');
    if (club) return club;
  }
  if (/アプローチウェッジ|\bAW\b/i.test(normalized)) {
    const club = byName('52°');
    if (club) return club;
  }

  if (/パター/.test(normalized)) {
    const club = clubs.find((c) => c.category === 'PUTTER');
    if (club) return club;
  }

  return null;
}
