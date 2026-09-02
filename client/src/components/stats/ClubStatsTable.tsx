import { useState } from 'react';
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

type SortKey = 'default' | 'sampleSize' | 'mean' | 'stddev' | 'min' | 'max';
type SortDir = 'asc' | 'desc';

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'sampleSize', label: 'サンプル数' },
  { key: 'mean', label: '平均飛距離' },
  { key: 'stddev', label: '標準偏差' },
  { key: 'min', label: '最小-最大' },
];

/**
 * Row-per-club comparison table — same stats as the old ClubStatsCard grid,
 * but laid out so distances/dispersion/tendency line up in columns and are
 * easy to scan across clubs (e.g. spotting a gapping problem at a glance),
 * rather than requiring a card-by-card read. Column headers are clickable to
 * sort; "方向の傾向" is a composite label so it's excluded from sorting.
 */
export function ClubStatsTable({
  clubs,
  shotsForClub,
  onSelectClub,
}: {
  clubs: Club[];
  shotsForClub: (clubId: string) => ShotRecord[];
  onSelectClub?: (clubId: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = clubs.map((club, defaultIndex) => {
    const shots = shotsForClub(club.id);
    return {
      club,
      defaultIndex,
      distanceStats: computeDistanceStats(shots),
      tendency: computeDirectionalTendency(shots),
    };
  });

  function handleHeaderClick(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (sortKey === 'default') return a.defaultIndex - b.defaultIndex;
    // Clubs with no recorded shots always sort last, regardless of direction.
    if (!a.distanceStats && !b.distanceStats) return a.defaultIndex - b.defaultIndex;
    if (!a.distanceStats) return 1;
    if (!b.distanceStats) return -1;

    const av = a.distanceStats[sortKey];
    const bv = b.distanceStats[sortKey];
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  return (
    <div className="club-stats-table-wrap">
      <table className="club-stats-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleHeaderClick('default')}>
              クラブ
            </th>
            {SORTABLE_COLUMNS.map(({ key, label }) => (
              <th key={key} className="sortable" onClick={() => handleHeaderClick(key)}>
                {label}
                {sortArrow(key)}
              </th>
            ))}
            <th>方向の傾向</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map(({ club, distanceStats, tendency }) => (
            <tr key={club.id}>
              <th scope="row">
                {distanceStats && onSelectClub ? (
                  <button type="button" className="club-name-button" onClick={() => onSelectClub(club.id)}>
                    {club.name}
                  </button>
                ) : (
                  club.name
                )}
              </th>
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
