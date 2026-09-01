import { useClubs } from '../hooks/useClubs';
import { useShots } from '../hooks/useShots';
import { ShotEntryForm } from '../components/shots/ShotEntryForm';
import { ShotHistoryTable } from '../components/shots/ShotHistoryTable';

export function ShotEntryPage() {
  const { clubs, loading: clubsLoading } = useClubs();
  const { shots, loading: shotsLoading, addShot, deleteShot } = useShots();

  if (clubsLoading || shotsLoading) return <p>読み込み中...</p>;

  if (clubs.length === 0) {
    return <p>先に「クラブ管理」ページでクラブを登録してください。</p>;
  }

  return (
    <section>
      <h2>ショット入力</h2>
      <ShotEntryForm clubs={clubs} onSubmit={addShot} />
      <h3>最近のショット</h3>
      <ShotHistoryTable shots={shots} clubs={clubs} onDelete={deleteShot} />
    </section>
  );
}
