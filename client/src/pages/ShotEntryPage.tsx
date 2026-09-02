import { useClubs } from '../hooks/useClubs';
import { useShots } from '../hooks/useShots';
import { ShotEntryForm } from '../components/shots/ShotEntryForm';
import { ShotHistoryTable } from '../components/shots/ShotHistoryTable';

// Must exactly match the name given to the Siri Shortcut built per the
// README's "音声だけで記録する" section (Dictate Text -> Get Contents of
// URL -> POST /api/shots/from-text). The shortcuts:// URL scheme is iOS-only
// — tapping this link on desktop/Android just does nothing, harmlessly.
const SHORTCUT_NAME = 'ゴルフ記録';

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
      <a
        href={`shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`}
        className="shortcut-launch-button"
      >
        🎤 音声で記録(ショートカット起動)
      </a>
      <ShotEntryForm clubs={clubs} onSubmit={addShot} />
      <h3>最近のショット</h3>
      <ShotHistoryTable shots={shots} clubs={clubs} onDelete={deleteShot} />
    </section>
  );
}
