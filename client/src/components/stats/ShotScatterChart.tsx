import { useState } from 'react';
import type { Club, ShotDirection, ShotRecord } from '../../types/models';
import { colorForIndex } from '../../lib/clubColors';

// Toptracer-style "club comparison" dispersion view: distance runs up the
// y-axis from the tee at the bottom, lateral miss runs left/right on the
// x-axis, and every club is overlaid on one chart in its own color with a
// legend to toggle clubs on/off. Each club's shot pattern is drawn as a
// dispersion ellipse (mean ± 1.5 stddev on each axis) rather than raw dots —
// with several clubs overlaid at once, a cloud of individual points becomes
// unreadable fast, while an ellipse stays legible and is exactly how
// launch-monitor "compare clubs" views (e.g. Toptracer) show shot shape.
//
// Real shot entries almost never carry a precise lateralDeviationYds (the
// entry form only captures the direction category — see ShotEntryForm), so
// that field is used when present and otherwise approximated from direction
// severity. This keeps the chart populated for normal use while still using
// real numbers wherever they exist.
const DIRECTION_OFFSET_YDS: Record<ShotDirection, number> = {
  HOOK: -18,
  PULL: -10,
  DRAW: -5,
  STRAIGHT: 0,
  FADE: 5,
  PUSH: 10,
  SLICE: 18,
};

function lateralYds(s: ShotRecord): number | null {
  if (s.lateralDeviationYds != null) return s.lateralDeviationYds;
  if (s.direction != null) return DIRECTION_OFFSET_YDS[s.direction];
  return null;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Sample stddev (n-1 denominator), matching lib/statistics.ts's convention. */
function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** How many stddevs out the ellipse boundary is drawn — wide enough to read as "shot shape", not just a tight core. */
const ELLIPSE_SIGMA = 1.5;
const MIN_SHOTS_FOR_ELLIPSE = 3;

const WIDTH = 640;
const HEIGHT = 520;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 44 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function niceStep(range: number): number {
  const candidates = [5, 10, 25, 50, 100];
  const target = range / 6;
  return candidates.reduce((best, c) => (Math.abs(c - target) < Math.abs(best - target) ? c : best), candidates[0]);
}

export function ShotScatterChart({ clubs, shotsForClub }: { clubs: Club[]; shotsForClub: (clubId: string) => ShotRecord[] }) {
  const series = clubs.map((club, i) => {
    const shots = shotsForClub(club.id).filter((s) => s.carryDistanceYds != null && lateralYds(s) != null);
    const xs = shots.map((s) => lateralYds(s)!);
    const ys = shots.map((s) => s.carryDistanceYds!);
    const meanX = xs.length > 0 ? mean(xs) : 0;
    const meanY = ys.length > 0 ? mean(ys) : 0;
    return {
      club,
      color: colorForIndex(i),
      shots,
      meanX,
      meanY,
      stdX: stddev(xs, meanX),
      stdY: stddev(ys, meanY),
    };
  });

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  function toggle(clubId: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) next.delete(clubId);
      else next.add(clubId);
      return next;
    });
  }

  const visibleSeries = series.filter((s) => !hidden.has(s.club.id) && s.shots.length > 0);

  if (series.every((s) => s.shots.length === 0)) {
    return <p>方向と飛距離の両方が記録されたショットがまだありません。</p>;
  }

  const maxDistance =
    visibleSeries.length > 0 ? Math.max(...visibleSeries.map((s) => s.meanY + ELLIPSE_SIGMA * s.stdY)) : 250;
  const yMax = Math.max(50, Math.ceil((maxDistance * 1.08) / 10) * 10);
  const yStep = niceStep(yMax);

  const maxLateral =
    visibleSeries.length > 0 ? Math.max(...visibleSeries.map((s) => Math.abs(s.meanX) + ELLIPSE_SIGMA * s.stdX)) : 20;
  const xHalfRange = Math.max(25, Math.ceil((maxLateral * 1.2) / 5) * 5);

  const xForLateral = (yds: number) => MARGIN.left + PLOT_W * ((yds + xHalfRange) / (xHalfRange * 2));
  const yForDistance = (yds: number) => MARGIN.top + PLOT_H * (1 - yds / yMax);

  const yGridlines: number[] = [];
  for (let v = yStep; v <= yMax; v += yStep) yGridlines.push(v);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="クラブ別ショット分布図" className="shot-scatter-svg">
        {/* fairway-style background band around the target line */}
        <rect
          x={xForLateral(-xHalfRange * 0.35)}
          y={MARGIN.top}
          width={xForLateral(xHalfRange * 0.35) - xForLateral(-xHalfRange * 0.35)}
          height={PLOT_H}
          fill="#eef7ee"
        />

        {yGridlines.map((v) => (
          <g key={v}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yForDistance(v)} y2={yForDistance(v)} stroke="#e5e5e5" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={yForDistance(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#888">
              {v}y
            </text>
          </g>
        ))}

        {/* target line: straight up from the tee */}
        <line x1={xForLateral(0)} x2={xForLateral(0)} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} stroke="#bbb" strokeWidth={1} strokeDasharray="3 3" />
        {/* tee position */}
        <circle cx={xForLateral(0)} cy={yForDistance(0)} r={4} fill="#555" />

        {visibleSeries.map(({ club, color, shots, meanX, meanY, stdX, stdY }) => {
          const cx = xForLateral(meanX);
          const cy = yForDistance(meanY);
          const tooltip = `${club.name}: 平均${Math.round(meanY)}y (n=${shots.length})`;

          if (shots.length < MIN_SHOTS_FOR_ELLIPSE) {
            // Too few shots for a meaningful ellipse — show the mean as a plain dot instead.
            return (
              <circle key={club.id} cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={1}>
                <title>{tooltip}</title>
              </circle>
            );
          }

          const rx = Math.max(4, xForLateral(meanX + ELLIPSE_SIGMA * stdX) - cx);
          const ry = Math.max(4, cy - yForDistance(meanY + ELLIPSE_SIGMA * stdY));

          return (
            <g key={club.id}>
              <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2}>
                <title>{tooltip}</title>
              </ellipse>
              <circle cx={cx} cy={cy} r={3} fill={color} />
            </g>
          );
        })}
      </svg>

      <div className="shot-scatter-legend">
        {series.map(({ club, color, shots }) => (
          <label key={club.id} className="shot-scatter-legend-item" style={{ opacity: shots.length === 0 ? 0.4 : 1 }}>
            <input
              type="checkbox"
              checked={!hidden.has(club.id)}
              disabled={shots.length === 0}
              onChange={() => toggle(club.id)}
            />
            <span className="legend-swatch" style={{ background: color }} />
            {club.name}
            <span className="legend-count">({shots.length})</span>
          </label>
        ))}
      </div>
    </div>
  );
}
