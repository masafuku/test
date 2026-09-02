import { useEffect, useState } from 'react';
import type { Session } from '../../types/models';

const TYPE_ICON: Record<Session['type'], string> = { RANGE: '🏌️', COURSE: '⛳' };
const TYPE_LABEL: Record<Session['type'], string> = { RANGE: '練習場', COURSE: 'コース' };

function formatElapsed(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

/**
 * Manual session start/end control shown above the voice-entry button on
 * ShotEntryPage. "Currently open session" is decided server-side (see
 * useSessions/api.getCurrentSession) — this component just reflects it.
 */
export function SessionBar({
  currentSession,
  shotCountInSession,
  onStart,
  onEnd,
}: {
  currentSession: Session | null;
  shotCountInSession: number;
  onStart: (type: Session['type'], label?: string) => void;
  onEnd: (id: string) => void;
}) {
  const [label, setLabel] = useState('');
  // Re-render periodically so the elapsed-time readout stays roughly live
  // without needing a real timer/interval per tick precision.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!currentSession) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [currentSession]);
  // Clear the label input once a session actually starts, so a stale label
  // doesn't linger in the (now-hidden) input for the next start.
  useEffect(() => {
    if (currentSession) setLabel('');
  }, [currentSession]);

  if (currentSession) {
    return (
      <div className="session-bar session-bar-active">
        <div className="session-bar-info">
          <span className="session-bar-icon">{TYPE_ICON[currentSession.type]}</span>
          <div>
            <div className="session-bar-title">
              {TYPE_LABEL[currentSession.type]}
              {currentSession.label ? `・${currentSession.label}` : ''}
            </div>
            <div className="session-bar-meta">
              {formatElapsed(currentSession.startedAt)} 経過・{shotCountInSession}打
            </div>
          </div>
        </div>
        <button type="button" className="session-bar-end" onClick={() => onEnd(currentSession.id)}>
          終了
        </button>
      </div>
    );
  }

  return (
    <div className="session-bar">
      <input
        type="text"
        className="session-bar-label-input"
        placeholder="コース名など(任意)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div className="session-bar-start-buttons">
        <button type="button" onClick={() => onStart('RANGE', label || undefined)}>
          🏌️ 練習場を開始
        </button>
        <button type="button" onClick={() => onStart('COURSE', label || undefined)}>
          ⛳ コースを開始
        </button>
      </div>
    </div>
  );
}
