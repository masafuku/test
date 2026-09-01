import type { Club, ShotRecord } from '../../types/models';
import {
  computeDistanceStats,
  computeDirectionalTendency,
  generateInsights,
  MIN_SAMPLE_SIZE_FOR_INSIGHT,
} from '../../lib/statistics';
import { InsightBadge } from './InsightBadge';

export function ClubStatsCard({ club, shots }: { club: Club; shots: ShotRecord[] }) {
  const distanceStats = computeDistanceStats(shots);
  const tendency = computeDirectionalTendency(shots);
  const insights = generateInsights(club.name, distanceStats, tendency);

  const sampleSize = distanceStats?.sampleSize ?? 0;

  return (
    <div className="club-stats-card">
      <h3>{club.name}</h3>
      {sampleSize === 0 && <p>まだショットが記録されていません。</p>}
      {sampleSize > 0 && sampleSize < MIN_SAMPLE_SIZE_FOR_INSIGHT && (
        <p>
          あと{MIN_SAMPLE_SIZE_FOR_INSIGHT - sampleSize}打記録すると気づきが表示されます(現在{sampleSize}打)。
        </p>
      )}
      {distanceStats && (
        <dl>
          <dt>サンプル数</dt>
          <dd>{distanceStats.sampleSize}</dd>
          <dt>平均飛距離</dt>
          <dd>{Math.round(distanceStats.mean)}y</dd>
          <dt>標準偏差</dt>
          <dd>±{Math.round(distanceStats.stddev)}y</dd>
          <dt>最小-最大</dt>
          <dd>
            {Math.round(distanceStats.min)}y - {Math.round(distanceStats.max)}y
          </dd>
        </dl>
      )}
      {insights.map((insight, i) => (
        <InsightBadge key={i} insight={insight} />
      ))}
    </div>
  );
}
