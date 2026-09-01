import type { ShotDirection, ShotRecord } from '../../types/models';

// Fixed left-to-right order, matching the LEFT_DIRECTIONS/RIGHT_DIRECTIONS
// classification in lib/statistics.ts (severity increasing away from center).
const DIRECTION_ORDER: ShotDirection[] = ['HOOK', 'PULL', 'DRAW', 'STRAIGHT', 'FADE', 'PUSH', 'SLICE'];

const WIDTH = 640;
const HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 44 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

/** Deterministic pseudo-random in [-1, 1], stable per shot id so re-renders don't jitter. */
function stableJitter(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash % 1000) / 1000) * 2 - 1;
}

/** Picks a "nice" gridline step (multiple of 5/10/25/50) for the given range. */
function niceStep(range: number): number {
  const candidates = [5, 10, 25, 50, 100];
  const target = range / 5;
  return candidates.reduce((best, c) => (Math.abs(c - target) < Math.abs(best - target) ? c : best), candidates[0]);
}

export function ShotScatterChart({ shots }: { shots: ShotRecord[] }) {
  const plottable = shots.filter((s) => s.carryDistanceYds != null && s.direction != null);

  if (plottable.length === 0) {
    return <p>方向と飛距離の両方が記録されたショットがまだありません。</p>;
  }

  const distances = plottable.map((s) => s.carryDistanceYds!);
  const rawMin = Math.min(...distances);
  const rawMax = Math.max(...distances);
  const step = niceStep(Math.max(rawMax - rawMin, 1));
  const yMin = Math.floor(rawMin / step) * step - step;
  const yMax = Math.ceil(rawMax / step) * step + step;

  const colWidth = PLOT_W / DIRECTION_ORDER.length;
  const xForDirection = (d: ShotDirection) => MARGIN.left + (DIRECTION_ORDER.indexOf(d) + 0.5) * colWidth;
  const yForDistance = (yds: number) => MARGIN.top + PLOT_H * (1 - (yds - yMin) / (yMax - yMin));

  const gridlines: number[] = [];
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) gridlines.push(v);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="方向と飛距離の散布図" className="shot-scatter-svg">
      {/* horizontal gridlines + y-axis labels */}
      {gridlines.map((v) => (
        <g key={v}>
          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={yForDistance(v)}
            y2={yForDistance(v)}
            stroke="#eee"
            strokeWidth={1}
          />
          <text x={MARGIN.left - 8} y={yForDistance(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#888">
            {v}y
          </text>
        </g>
      ))}

      {/* center "straight" reference line */}
      <line
        x1={xForDirection('STRAIGHT')}
        x2={xForDirection('STRAIGHT')}
        y1={MARGIN.top}
        y2={MARGIN.top + PLOT_H}
        stroke="#ddd"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* x-axis category labels */}
      {DIRECTION_ORDER.map((d) => (
        <text
          key={d}
          x={xForDirection(d)}
          y={MARGIN.top + PLOT_H + 20}
          textAnchor="middle"
          fontSize={11}
          fill="#888"
        >
          {d}
        </text>
      ))}

      {/* shots, jittered within their direction column so overlapping balls stay visible */}
      {plottable.map((s) => {
        const cx = xForDirection(s.direction!) + stableJitter(s.id) * (colWidth * 0.32);
        const cy = yForDistance(s.carryDistanceYds!);
        return (
          <circle key={s.id} cx={cx} cy={cy} r={5} fill="#2c7a4b" fillOpacity={0.75} stroke="#1e5a37" strokeWidth={1}>
            <title>
              {Math.round(s.carryDistanceYds!)}y / {s.direction} / {new Date(s.recordedAt).toLocaleDateString('ja-JP')}
            </title>
          </circle>
        );
      })}
    </svg>
  );
}
