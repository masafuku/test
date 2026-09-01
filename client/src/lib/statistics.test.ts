import { describe, expect, it } from 'vitest';
import {
  computeDistanceStats,
  computeDirectionalTendency,
  generateInsights,
  generateGappingInsights,
  MIN_SAMPLE_SIZE_FOR_INSIGHT,
} from './statistics';
import type { ShotRecord } from '../types/models';

function shot(overrides: Partial<ShotRecord>): ShotRecord {
  return {
    id: 'id',
    clubId: 'club-1',
    source: 'MANUAL',
    recordedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as ShotRecord;
}

describe('computeDistanceStats', () => {
  it('returns null for an empty array', () => {
    expect(computeDistanceStats([])).toBeNull();
  });

  it('ignores shots missing carryDistanceYds', () => {
    const shots = [shot({ carryDistanceYds: 150 }), shot({ carryDistanceYds: undefined })];
    const stats = computeDistanceStats(shots);
    expect(stats?.sampleSize).toBe(1);
  });

  it('computes mean/stddev/min/max correctly', () => {
    const shots = [140, 150, 160].map((d) => shot({ carryDistanceYds: d }));
    const stats = computeDistanceStats(shots)!;
    expect(stats.sampleSize).toBe(3);
    expect(stats.mean).toBe(150);
    expect(stats.min).toBe(140);
    expect(stats.max).toBe(160);
    // sample stddev of [140,150,160] = 10
    expect(stats.stddev).toBeCloseTo(10, 5);
  });

  it('gives zero stddev for identical distances', () => {
    const shots = [150, 150, 150].map((d) => shot({ carryDistanceYds: d }));
    const stats = computeDistanceStats(shots)!;
    expect(stats.stddev).toBe(0);
  });
});

describe('computeDirectionalTendency', () => {
  it('returns null when no shots have a direction', () => {
    expect(computeDirectionalTendency([shot({})])).toBeNull();
  });

  it('computes left/right percentages', () => {
    const shots = [
      shot({ direction: 'PUSH' }),
      shot({ direction: 'PUSH' }),
      shot({ direction: 'STRAIGHT' }),
    ];
    const tendency = computeDirectionalTendency(shots)!;
    expect(tendency.rightPct).toBeCloseTo((2 / 3) * 100);
    expect(tendency.straightPct).toBeCloseTo((1 / 3) * 100);
    expect(tendency.dominantDirection).toBe('PUSH');
  });
});

describe('generateInsights', () => {
  it('withholds insights below MIN_SAMPLE_SIZE_FOR_INSIGHT', () => {
    const shots = Array.from({ length: MIN_SAMPLE_SIZE_FOR_INSIGHT - 1 }, () =>
      shot({ carryDistanceYds: 150, direction: 'PUSH' }),
    );
    const distanceStats = computeDistanceStats(shots);
    const tendency = computeDirectionalTendency(shots);
    expect(generateInsights('7I', distanceStats, tendency)).toEqual([]);
  });

  it('flags a strong directional tendency once sample size is met', () => {
    const shots = Array.from({ length: MIN_SAMPLE_SIZE_FOR_INSIGHT }, () =>
      shot({ carryDistanceYds: 150, direction: 'PUSH' }),
    );
    const distanceStats = computeDistanceStats(shots);
    const tendency = computeDirectionalTendency(shots);
    const insights = generateInsights('7I', distanceStats, tendency);
    expect(insights.some((i) => i.kind === 'directional_tendency')).toBe(true);
  });

  it('flags high dispersion when stddev exceeds 15% of the mean', () => {
    const distances = [100, 140, 160, 200, 100];
    const shots = distances.map((d) => shot({ carryDistanceYds: d }));
    const distanceStats = computeDistanceStats(shots);
    const insights = generateInsights('Driver', distanceStats, null);
    expect(insights.some((i) => i.kind === 'high_dispersion')).toBe(true);
  });
});

describe('generateGappingInsights', () => {
  it('flags adjacent clubs whose mean distances are too close', () => {
    const makeStats = (mean: number) =>
      computeDistanceStats(
        Array.from({ length: MIN_SAMPLE_SIZE_FOR_INSIGHT }, () => shot({ carryDistanceYds: mean })),
      )!;

    const clubStats = [
      { clubName: '8 Iron', distanceStats: makeStats(140) },
      { clubName: '9 Iron', distanceStats: makeStats(142) },
    ];
    const insights = generateGappingInsights(clubStats);
    expect(insights).toHaveLength(1);
    expect(insights[0].kind).toBe('gapping');
  });

  it('does not flag clubs with a healthy gap', () => {
    const makeStats = (mean: number) =>
      computeDistanceStats(
        Array.from({ length: MIN_SAMPLE_SIZE_FOR_INSIGHT }, () => shot({ carryDistanceYds: mean })),
      )!;

    const clubStats = [
      { clubName: '8 Iron', distanceStats: makeStats(140) },
      { clubName: '9 Iron', distanceStats: makeStats(125) },
    ];
    expect(generateGappingInsights(clubStats)).toHaveLength(0);
  });
});
