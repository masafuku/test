import type { Club, ShotRecord } from '../../types/models';
import { computeDistanceStats, computeDirectionalTendency, MIN_SAMPLE_SIZE_FOR_INSIGHT } from '../../lib/statistics';

function tendencyLabel(tendency: ReturnType<typeof computeDirectionalTendency>): string {
  if (!tendency || tendency.sampleSize < MIN_SAMPLE_SIZE_FOR_INSIGHT) return '-';
  if (tendency.leftPct >= tendency.rightPct && tendency.leftPct >= tendency.straightPct) {
    return `左 ${Math.round(tendency.leftPct)}%`;
  }
  if (tendency.rightPct >= tendency.straightPct) {
    return `右 ${Math.round(tendency.rightPct)}%`;
  }
  return `直進 ${Math.round(tendency.straightPct)}%`;
}

/**
 * Row-per-club comparison table — same stats as the old ClubStatsCard grid,
 * but laid out so distances/dispersion/tendency line up in columns and are
 * easy to scan across clubs (e.g. spotting a gapping problem at a glance),
 * rather than requiring a card-by-card read.
 */
export function ClubStatsTable({ clubs, shotsForClub }: { clubs: Club[]; shotsForClub: (clubId: string) => ShotRecord[] }) {
  const rows = clubs.map((club) => {
    const shots = shotsForClub(club.id);
    return {
      club,
      distanceStats: computeDistanceStats(shots),
      tendency: computeDirectionalTendency(shots),
    };
  });

  return (
    <div className="club-stats-table-wrap">
      <table className="club-stats-table">
        <thead>
          <tr>
            <th>クラブ</th>
            <th>サンプル数</th>
            <th>平均飛距離</th>
            <th>標準偏差</th>
            <th>最小-最大</th>
            <th>方向の傾向</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ club, distanceStats, tendency }) => (
            <tr key={club.id}>
              <th scope="row">{club.name}</th>
              {distanceStats ? (
                <>
                  <td>{distanceStats.sampleSize}</td>
                  <td>{Math.round(distanceStats.mean)}y</td>
                  <td>±{Math.round(distanceStats.stddev)}y</td>
                  <td>
                    {Math.round(distanceStats.min)}y - {Math.round(distanceStats.max)}y
                  </td>
                  <td>{tendencyLabel(tendency)}</td>
                </>
              ) : (
                <td colSpan={5} className="no-data">
                  まだショットが記録されていません
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
