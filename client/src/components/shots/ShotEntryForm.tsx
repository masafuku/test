import { useState } from 'react';
import type { Club, ShotDirection, ShotLie, ShotStrength } from '../../types/models';
import { matchClubFromText, parseShotText } from '../../lib/parseShotText';
import { STRENGTH_OPTIONS, LIE_OPTIONS } from '../../lib/shotLabels';
import type { NewShotInput } from '../../hooks/useShots';

const DIRECTIONS: ShotDirection[] = ['STRAIGHT', 'DRAW', 'FADE', 'PULL', 'PUSH', 'SLICE', 'HOOK'];

const DISTANCE_MIN = 0;
const DISTANCE_MAX = 300;
const DEFAULT_DISTANCE = '150';

/**
 * Tap-friendly single-select button group — replaces a native <select> for
 * choices made repeatedly on a phone. Grouped controls belong in a
 * <fieldset>/<legend> pair, not a <label> (a <label> is only ever meant to
 * associate with exactly one control — wrapping several buttons in one is
 * invalid HTML and iOS Safari has been observed mis-forwarding taps in that
 * case).
 */
function ChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="chip-fieldset">
      <legend>{legend}</legend>
      <div className="chip-group">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`chip-button${o.value === value ? ' active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ShotEntryForm({
  clubs,
  onSubmit,
}: {
  clubs: Club[];
  onSubmit: (input: NewShotInput) => Promise<unknown>;
}) {
  const activeClubs = clubs.filter((c) => c.isActive ?? true);
  const [clubId, setClubId] = useState(activeClubs[0]?.id ?? '');
  const [lie, setLie] = useState<ShotLie | ''>('');
  const [strength, setStrength] = useState<ShotStrength>('FULL');
  const [carryDistanceYds, setCarryDistanceYds] = useState(DEFAULT_DISTANCE);
  const [direction, setDirection] = useState<ShotDirection>('STRAIGHT');
  const [lateralDeviationYds, setLateralDeviationYds] = useState<number | undefined>(undefined);
  const [voiceText, setVoiceText] = useState('');
  const [nothingRecognized, setNothingRecognized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Free-text field meant to be filled via the iPhone keyboard's built-in
  // dictation (mic button) — this app never talks to a speech-recognition
  // API itself. Distance/direction/strength/lie/lateral-deviation are parsed
  // out of it; club is matched separately against the actual registered
  // club list (see matchClubFromText — needs `clubs`, so it can't live in
  // the text-only parseShotText). Anything not recognized just leaves the
  // current tap-selection untouched, so tapping can always override.
  function handleVoiceTextBlur() {
    if (!voiceText.trim()) return;
    const parsed = parseShotText(voiceText);
    const matchedClub = matchClubFromText(voiceText, activeClubs);

    if (parsed.distanceYds != null) {
      const clamped = Math.min(DISTANCE_MAX, Math.max(DISTANCE_MIN, parsed.distanceYds));
      setCarryDistanceYds(String(clamped));
    }
    if (parsed.direction != null) setDirection(parsed.direction);
    if (parsed.lateralDeviationYds != null) setLateralDeviationYds(parsed.lateralDeviationYds);
    if (parsed.strength != null) setStrength(parsed.strength);
    if (parsed.lie != null) setLie(parsed.lie);
    if (matchedClub != null) setClubId(matchedClub.id);

    setNothingRecognized(
      parsed.distanceYds == null &&
        parsed.direction == null &&
        parsed.strength == null &&
        parsed.lie == null &&
        matchedClub == null,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        clubId,
        strength,
        lie: lie || undefined,
        carryDistanceYds: parseFloat(carryDistanceYds),
        direction,
        lateralDeviationYds,
        // Always keep the original dictated text, even when everything else
        // parsed fine — the parsing is best-effort keyword matching, not
        // real language understanding, so this is the only way to check
        // (and manually fix) a misrecognized field later.
        shotShapeNotes: voiceText || undefined,
      });
      // Reset distance/direction/strength/lie/text but keep the same club
      // selected, since the common workflow is logging many balls in a row
      // with one club.
      setLie('');
      setStrength('FULL');
      setCarryDistanceYds(DEFAULT_DISTANCE);
      setDirection('STRAIGHT');
      setLateralDeviationYds(undefined);
      setVoiceText('');
      setNothingRecognized(false);
    } catch {
      setSubmitError('保存に失敗しました。電波を確認してもう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="shot-entry-form">
      <label>
        音声/テキスト入力(マイクで話す、例:「7番アイアン、ラフからハーフで150ヤード、ちょっと右5ヤード」)
        <input
          type="text"
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
          onBlur={handleVoiceTextBlur}
          placeholder="ここをタップしてキーボードのマイクで話す"
        />
      </label>
      {nothingRecognized && (
        <p className="parse-warning">
          クラブ・距離・方向・強度・ライを認識できませんでした。下のフィールドを手動で選んでください。(入力内容: 「{voiceText}」)
        </p>
      )}

      <ChipGroup
        legend="クラブ"
        options={activeClubs.map((c) => ({ value: c.id, label: c.name }))}
        value={clubId}
        onChange={setClubId}
      />

      <ChipGroup legend="ライ" options={LIE_OPTIONS} value={lie} onChange={setLie} />

      <ChipGroup legend="強度" options={STRENGTH_OPTIONS} value={strength} onChange={setStrength} />

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

      <ChipGroup
        legend="方向"
        options={DIRECTIONS.map((d) => ({ value: d, label: d }))}
        value={direction}
        onChange={setDirection}
      />

      {submitError && <p className="parse-warning">{submitError}</p>}

      <button type="submit" disabled={!clubId || submitting}>
        {submitting ? '記録中...' : '記録する'}
      </button>
    </form>
  );
}
