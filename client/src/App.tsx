import { useState } from 'react';
import { ShotEntryPage } from './pages/ShotEntryPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import './App.css';

type Tab = 'shots' | 'dashboard' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'shots', label: 'ショット', icon: '⛳' },
  { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
  { id: 'settings', label: '設定', icon: '⚙️' },
];

function App() {
  const [tab, setTab] = useState<Tab>('shots');

  return (
    <div className="app">
      <header className="app-header">
        <h1>My Golf Log</h1>
      </header>
      <main className="app-main">
        {tab === 'shots' && <ShotEntryPage />}
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-bar-item${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-bar-icon">{t.icon}</span>
            <span className="tab-bar-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
