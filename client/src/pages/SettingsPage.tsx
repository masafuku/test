import { ClubsPage } from './ClubsPage';

// Wraps ClubsPage rather than putting its contents directly under the
// "settings" tab, so future settings sections (shortcut name, session
// defaults, etc.) can be added here as their own headed subsections later.
export function SettingsPage() {
  return (
    <section>
      <h2>設定</h2>
      <ClubsPage />
    </section>
  );
}
