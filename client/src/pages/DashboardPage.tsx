import { useRef, useState } from 'react';
import { useClubs } from '../hooks/useClubs';
import { useShots } from '../hooks/useShots';
import { useSessions } from '../hooks/useSessions';
import { ClubStatsTable } from '../components/stats/ClubStatsTable';
import { InsightBadge } from '../components/stats/InsightBadge';
import { ShotScatterChart } from '../components/stats/ShotScatterChart';
import { computeDistanceStats, generateGappingInsights } from '../lib/statistics';
import { sortByBagOrder } from '../lib/clubOrder';
import type { ShotRecord } from '../types/models';

const TYPE_ICON = { RANGE: '🏌️', COURSE: '⛳' } as const;

export function DashboardPage() {
  const { clubs, loading: clubsLoading } = useClubs();
  const { shots: allShots, loading: shotsLoading, shotsForClub: shotsForClubAll } = useShots();
  const { sessions, loading: sessionsLoading } = useSessions();
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [focusedClubId, setFocusedClubId] = useState<string | undefined>(undefined);
  const scatterRef = useRef<HTMLDivElement>(null);

  if (clubsLoading || shotsLoading || sessionsLoading) return <p>読み込み中...</p>;

  const shotsForClub = (clubId: string): ShotRecord[] =>
    sessionFilter === 'ALL' ? shotsForClubAll(clubId) : shotsForClubAll(clubId).filter((s) => s.sessionId === sessionFilter);

  const activeClubs = sortByBagOrder(clubs.filter((c) => c.isActive ?? true));
  // When a specific session is selected, hide clubs that weren't used in it —
  // otherwise the table/chart is dominated by "no shots" rows for clubs that
  // simply weren't brought out that day. "全期間" keeps showing the full bag.
  const displayClubs =
    sessionFilter === 'ALL' ? activeClubs : activeClubs.filter((c) => shotsForClub(c.id).length > 0);

  const clubStatsForGapping = activeClubs
    .map((club) => {
      const distanceStats = computeDistanceStats(shotsForClub(club.id));
      return distanceStats ? { clubName: club.name, distanceStats } : null;
    })
    .filter((c): c is { clubName: string; distanceStats: NonNullable<ReturnType<typeof computeDistanceStats>> } => c != null);

  const gappingInsights = generateGappingInsights(clubStatsForGapping);

  function handleSelectClub(clubId: string) {
    setFocusedClubId(clubId);
    scatterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section>
      <h2>ダッシュボード</h2>

      {sessions.length > 0 && (
        <label className="session-filter">
          セッション
          <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
            <option value="ALL">全期間</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {TYPE_ICON[s.type]} {new Date(s.startedAt).toLocaleDateString()}
                {s.label ? `・${s.label}` : ''}({allShots.filter((sh) => sh.sessionId === s.id).length}打)
              </option>
            ))}
          </select>
        </label>
      )}

      {gappingInsights.map((insight, i) => (
        <InsightBadge key={i} insight={insight} />
      ))}
      {displayClubs.length > 0 && (
        <ClubStatsTable clubs={displayClubs} shotsForClub={shotsForClub} onSelectClub={handleSelectClub} />
      )}
      {activeClubs.length === 0 && <p>クラブが登録されていません。</p>}
      {activeClubs.length > 0 && displayClubs.length === 0 && <p>このセッションではまだショットが記録されていません。</p>}

      {displayClubs.length > 0 && (
        <div className="shot-scatter" ref={scatterRef}>
          <h3>散布図(クラブ別)</h3>
          <ShotScatterChart clubs={displayClubs} shotsForClub={shotsForClub} focusedClubId={focusedClubId} />
        </div>
      )}
    </section>
  );
}
