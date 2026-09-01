import { useState } from 'react';
import { useClubs } from '../hooks/useClubs';
import { useShots } from '../hooks/useShots';
import { ClubStatsCard } from '../components/stats/ClubStatsCard';
import { InsightBadge } from '../components/stats/InsightBadge';
import { ShotScatterChart } from '../components/stats/ShotScatterChart';
import { computeDistanceStats, generateGappingInsights } from '../lib/statistics';

const CATEGORY_ORDER = ['DRIVER', 'WOOD', 'HYBRID', 'IRON', 'WEDGE', 'PUTTER', 'OTHER'];

export function DashboardPage() {
  const { clubs, loading: clubsLoading } = useClubs();
  const { shots, loading: shotsLoading, shotsForClub } = useShots();
  const [scatterClubId, setScatterClubId] = useState<string>('');

  if (clubsLoading || shotsLoading) return <p>読み込み中...</p>;

  const activeClubs = clubs
    .filter((c) => c.isActive ?? true)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const scatterClub = activeClubs.find((c) => c.id === scatterClubId) ?? activeClubs[0];

  const clubStatsForGapping = activeClubs
    .map((club) => {
      const distanceStats = computeDistanceStats(shotsForClub(club.id));
      return distanceStats ? { clubName: club.name, distanceStats } : null;
    })
    .filter((c): c is { clubName: string; distanceStats: NonNullable<ReturnType<typeof computeDistanceStats>> } => c != null);

  const gappingInsights = generateGappingInsights(clubStatsForGapping);

  return (
    <section>
      <h2>ダッシュボード</h2>
      {gappingInsights.map((insight, i) => (
        <InsightBadge key={i} insight={insight} />
      ))}
      <div className="club-stats-grid">
        {activeClubs.map((club) => (
          <ClubStatsCard key={club.id} club={club} shots={shotsForClub(club.id)} />
        ))}
      </div>
      {activeClubs.length === 0 && <p>クラブが登録されていません。</p>}
      {shots.length === 0 && activeClubs.length > 0 && <p>まだショットが記録されていません。</p>}

      {activeClubs.length > 0 && (
        <div className="shot-scatter">
          <h3>
            散布図
            <select value={scatterClub?.id ?? ''} onChange={(e) => setScatterClubId(e.target.value)}>
              {activeClubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </h3>
          {scatterClub && <ShotScatterChart shots={shotsForClub(scatterClub.id)} />}
        </div>
      )}
    </section>
  );
}
