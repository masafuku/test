import { useState } from 'react';
import type { Club, ShotDirection } from '../../types/models';
import { parseShotText } from '../../lib/parseShotText';
import type { NewShotInput } from '../../hooks/useShots';

const DIRECTIONS: ShotDirection[] = ['STRAIGHT', 'DRAW', 'FADE', 'PULL', 'PUSH', 'SLICE', 'HOOK'];

const DISTANCE_MIN = 0;
const DISTANCE_MAX = 300;
const DEFAULT_DISTANCE = '150';

export function ShotEntryForm({
  clubs,
  onSubmit,
}: {
  clubs: Club[];
  onSubmit: (input: NewShotInput) => void;
}) {
  const activeClubs = clubs.filter((c) => c.isActive ?? true);
  const [clubId, setClubId] = useState(activeClubs[0]?.id ?? '');
  const [carryDistanceYds, setCarryDistanceYds] = useState(DEFAULT_DISTANCE);
  const [direction, setDirection] = useState<ShotDirection>('STRAIGHT');
  const [voiceText, setVoiceText] = useState('');
  const [unparsedNote, setUnparsedNote] = useState('');

  // Free-text field meant to be filled via the iPhone keyboard's built-in
  // dictation (mic button) — this app never talks to a speech-recognition
  // API itself. Only distance and direction are parsed out of it; the club
  // stays a tap-selection above because club-name phrasing is too varied
  // for a rule-based parser to extract reliably.
  function handleVoiceTextBlur() {
    if (!voiceText.trim()) return;
    const parsed = parseShotText(voiceText);
    if (parsed.distanceYds != null) {
      const clamped = Math.min(DISTANCE_MAX, Math.max(DISTANCE_MIN, parsed.distanceYds));
      setCarryDistanceYds(String(clamped));
    }
    if (parsed.direction != null) {
      setDirection(parsed.direction);
    }
    if (parsed.distanceYds == null && parsed.direction == null) {
      // Parse failed entirely — keep the raw text visible as a note instead
      // of silently discarding what the user said.
      setUnparsedNote(parsed.rawText);
    } else {
      setUnparsedNote('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) return;
    onSubmit({
      clubId,
      carryDistanceYds: parseFloat(carryDistanceYds),
      direction,
      shotShapeNotes: unparsedNote || undefined,
    });
    // Reset distance/direction/text but keep the same club selected, since
    // the common workflow is logging many balls in a row with one club.
    setCarryDistanceYds(DEFAULT_DISTANCE);
    setDirection('STRAIGHT');
    setVoiceText('');
    setUnparsedNote('');
  }

  return (
    <form onSubmit={handleSubmit} className="shot-entry-form">
      <label>
        クラブ
        <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
          {activeClubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        音声/テキスト入力(マイクで話す、例:「145ヤード、ちょっと右」)
        <input
          type="text"
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
          onBlur={handleVoiceTextBlur}
          placeholder="ここをタップしてキーボードのマイクで話す"
        />
      </label>
      {unparsedNote && (
        <p className="parse-warning">
          距離・方向を認識できませんでした。下のフィールドを手動入力してください。(入力内容: 「{unparsedNote}」)
        </p>
      )}

      <label>
        飛距離(ヤード)
        <span className="distance-readout">{carryDistanceYds}y</span>
        <input
          type="range"
          min={DISTANCE_MIN}
          max={DISTANCE_MAX}
          step={1}
          value={carryDistanceYds}
          onChange={(e) => setCarryDistanceYds(e.target.value)}
        />
      </label>

      <label>
        方向
        <select value={direction} onChange={(e) => setDirection(e.target.value as ShotDirection)}>
          {DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={!clubId}>
        記録する
      </button>
    </form>
  );
}
