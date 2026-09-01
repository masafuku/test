import type { ShotLie, ShotStrength } from '../types/models';

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

export const LIE_LABELS: Record<ShotLie, string> = {
  TEE: 'ティー',
  FAIRWAY: 'フェアウェイ',
  ROUGH: 'ラフ',
  APPROACH: 'アプローチ',
};

export const LIE_OPTIONS: { value: ShotLie; label: string }[] = (
  Object.entries(LIE_LABELS) as [ShotLie, string][]
).map(([value, label]) => ({ value, label }));
