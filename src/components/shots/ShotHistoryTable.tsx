import type { Club, ShotRecord } from '../../types/models';

export function ShotHistoryTable({
  shots,
  clubs,
  onDelete,
}: {
  shots: ShotRecord[];
  clubs: Club[];
  onDelete: (id: string) => void;
}) {
  const clubName = (clubId: string) => clubs.find((c) => c.id === clubId)?.name ?? '(不明)';

  const sorted = [...shots].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  if (sorted.length === 0) {
    return <p>まだショットが記録されていません。</p>;
  }

  return (
    <table className="shot-history-table">
      <thead>
        <tr>
          <th>日時</th>
          <th>クラブ</th>
          <th>飛距離</th>
          <th>方向</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((shot) => (
          <tr key={shot.id}>
            <td>{new Date(shot.recordedAt).toLocaleString()}</td>
            <td>{clubName(shot.clubId)}</td>
            <td>{shot.carryDistanceYds != null ? `${shot.carryDistanceYds}y` : '-'}</td>
            <td>{shot.direction ?? '-'}</td>
            <td>
              <button onClick={() => onDelete(shot.id)}>削除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
