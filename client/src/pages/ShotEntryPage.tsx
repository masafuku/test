import { useClubs } from '../hooks/useClubs';
import { useShots } from '../hooks/useShots';
import { useSessions } from '../hooks/useSessions';
import { ShotEntryForm } from '../components/shots/ShotEntryForm';
import { ShotHistoryTable } from '../components/shots/ShotHistoryTable';
import { SessionBar } from '../components/sessions/SessionBar';

// Must exactly match the name given to the Siri Shortcut built per the
// README's "音声だけで記録する" section (Dictate Text -> Get Contents of
// URL -> POST /api/shots/from-text). The shortcuts:// URL scheme is iOS-only
// — tapping this link on desktop/Android just does nothing, harmlessly.
const SHORTCUT_NAME = 'ショット音声入力';

export function ShotEntryPage() {
  const { clubs, loading: clubsLoading } = useClubs();
  const { shots, loading: shotsLoading, addShot, deleteShot } = useShots();
  const { currentSession, loading: sessionsLoading, startSession, endSession } = useSessions();

  if (clubsLoading || shotsLoading || sessionsLoading) return <p>読み込み中...</p>;

  if (clubs.length === 0) {
    return <p>先に「クラブ管理」ページでクラブを登録してください。</p>;
  }

  // x-callback-url: after the Shortcut finishes (success, error, or the user
  // cancels), iOS automatically reopens this same page in Safari instead of
  // leaving the Shortcuts app in the foreground. No change to the Shortcut
  // itself needed — this is handled entirely by which URL scheme we link to.
  const returnUrl = encodeURIComponent(window.location.href);
  const shortcutUrl =
    `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}` +
    `&x-success=${returnUrl}&x-error=${returnUrl}&x-cancel=${returnUrl}`;

  return (
    <section>
      <h2>ショット入力</h2>
      <SessionBar
        currentSession={currentSession}
        shotCountInSession={currentSession ? shots.filter((s) => s.sessionId === currentSession.id).length : 0}
        onStart={startSession}
        onEnd={endSession}
      />
      <a href={shortcutUrl} className="shortcut-launch-button">
        <span>
          <span className="shortcut-launch-icon">🎤</span>
          音声で記録
        </span>
      </a>
      <ShotEntryForm clubs={clubs} onSubmit={addShot} />
      <h3>最近のショット</h3>
      <ShotHistoryTable shots={shots} clubs={clubs} onDelete={deleteShot} />
    </section>
  );
}
