import type { ShotDirection, ShotRecord } from '../types/models';

/** Below this many shots for a club, insights are withheld rather than shown from a misleadingly small sample. */
export const MIN_SAMPLE_SIZE_FOR_INSIGHT = 5;

export interface DistanceStats {
  sampleSize: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
}

export interface DirectionalTendency {
  sampleSize: number;
  counts: Partial<Record<ShotDirection, number>>;
  leftPct: number;
  rightPct: number;
  straightPct: number;
  dominantDirection: ShotDirection | null;
  /** Signed mean lateral deviation in yards, only present when shots recorded it. Negative = left, positive = right. */
  meanLateralDeviationYds: number | null;
  lateralDeviationStddevYds: number | null;
}

export interface Insight {
  kind: 'high_dispersion' | 'directional_tendency' | 'gapping';
  message: string;
}

const LEFT_DIRECTIONS: ShotDirection[] = ['DRAW', 'PULL', 'HOOK'];
const RIGHT_DIRECTIONS: ShotDirection[] = ['FADE', 'PUSH', 'SLICE'];

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Computes carry-distance stats for one club's shots. Shots missing carryDistanceYds are ignored. */
export function computeDistanceStats(shots: ShotRecord[]): DistanceStats | null {
  const distances = shots
    .map((s) => s.carryDistanceYds)
    .filter((d): d is number => d != null);

  if (distances.length === 0) return null;

  const avg = mean(distances);
  return {
    sampleSize: distances.length,
    mean: avg,
    stddev: stddev(distances, avg),
    min: Math.min(...distances),
    max: Math.max(...distances),
  };
}

/** Computes directional tendency for one club's shots, from both the categorical direction and (if present) numeric lateral deviation. */
export function computeDirectionalTendency(
  shots: ShotRecord[],
): DirectionalTendency | null {
  const directions = shots
    .map((s) => s.direction)
    .filter((d): d is ShotDirection => d != null);

  if (directions.length === 0) return null;

  const counts: Partial<Record<ShotDirection, number>> = {};
  for (const d of directions) {
    counts[d] = (counts[d] ?? 0) + 1;
  }

  const leftCount = LEFT_DIRECTIONS.reduce((n, d) => n + (counts[d] ?? 0), 0);
  const rightCount = RIGHT_DIRECTIONS.reduce((n, d) => n + (counts[d] ?? 0), 0);
  const straightCount = counts.STRAIGHT ?? 0;

  const total = directions.length;
  let dominantDirection: ShotDirection | null = null;
  let dominantCount = 0;
  for (const [dir, count] of Object.entries(counts) as [ShotDirection, number][]) {
    if (count > dominantCount) {
      dominantDirection = dir;
      dominantCount = count;
    }
  }

  const lateralDeviations = shots
    .map((s) => s.lateralDeviationYds)
    .filter((d): d is number => d != null);

  const meanLateralDeviationYds =
    lateralDeviations.length > 0 ? mean(lateralDeviations) : null;
  const lateralDeviationStddevYds =
    lateralDeviations.length > 1
      ? stddev(lateralDeviations, meanLateralDeviationYds as number)
      : null;

  return {
    sampleSize: total,
    counts,
    leftPct: (leftCount / total) * 100,
    rightPct: (rightCount / total) * 100,
    straightPct: (straightCount / total) * 100,
    dominantDirection,
    meanLateralDeviationYds,
    lateralDeviationStddevYds,
  };
}

/** Per-club rule-based insights: dispersion and directional tendency. Withheld below MIN_SAMPLE_SIZE_FOR_INSIGHT. */
export function generateInsights(
  clubName: string,
  distanceStats: DistanceStats | null,
  tendency: DirectionalTendency | null,
): Insight[] {
  const insights: Insight[] = [];

  if (distanceStats && distanceStats.sampleSize >= MIN_SAMPLE_SIZE_FOR_INSIGHT) {
    const dispersionRatio = distanceStats.stddev / distanceStats.mean;
    if (dispersionRatio > 0.15) {
      insights.push({
        kind: 'high_dispersion',
        message: `${clubName}は飛距離のばらつきが大きめです(平均${Math.round(
          distanceStats.mean,
        )}y、標準偏差±${Math.round(distanceStats.stddev)}y)。`,
      });
    }
  }

  if (tendency && tendency.sampleSize >= MIN_SAMPLE_SIZE_FOR_INSIGHT) {
    if (tendency.rightPct > 60) {
      insights.push({
        kind: 'directional_tendency',
        message: `${clubName}は右に出やすい傾向があります(${Math.round(
          tendency.rightPct,
        )}%のショットが右方向)。`,
      });
    } else if (tendency.leftPct > 60) {
      insights.push({
        kind: 'directional_tendency',
        message: `${clubName}は左に出やすい傾向があります(${Math.round(
          tendency.leftPct,
        )}%のショットが左方向)。`,
      });
    }
  }

  return insights;
}

/**
 * Cross-club "gapping" insight: flags adjacent clubs (by mean carry distance)
 * whose average distances are too close together to be useful.
 */
export function generateGappingInsights(
  clubStats: { clubName: string; distanceStats: DistanceStats }[],
  minGapYds = 8,
): Insight[] {
  const eligible = clubStats
    .filter((c) => c.distanceStats.sampleSize >= MIN_SAMPLE_SIZE_FOR_INSIGHT)
    .sort((a, b) => b.distanceStats.mean - a.distanceStats.mean);

  const insights: Insight[] = [];
  for (let i = 0; i < eligible.length - 1; i++) {
    const longer = eligible[i];
    const shorter = eligible[i + 1];
    const gap = longer.distanceStats.mean - shorter.distanceStats.mean;
    if (gap < minGapYds) {
      insights.push({
        kind: 'gapping',
        message: `${longer.clubName}と${shorter.clubName}の平均飛距離差が${Math.round(
          gap,
        )}yしかありません。`,
      });
    }
  }
  return insights;
}
