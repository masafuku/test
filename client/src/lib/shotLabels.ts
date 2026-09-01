import type { ShotStrength } from '../types/models';

export const STRENGTH_LABELS: Record<ShotStrength, string> = {
  FULL: 'フル',
  HALF: 'ハーフ',
  PITCH_AND_RUN: 'ピッチエンドラン',
  LOB: 'ロブ',
  RUNNING: 'ランニング',
};

export const STRENGTH_OPTIONS: { value: ShotStrength; label: string }[] = (
  Object.entries(STRENGTH_LABELS) as [ShotStrength, string][]
).map(([value, label]) => ({ value, label }));
