import { useState } from 'react';
import { AuthGate } from './components/auth/AuthGate';
import { ClubsPage } from './pages/ClubsPage';
import { ShotEntryPage } from './pages/ShotEntryPage';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

type Tab = 'dashboard' | 'shots' | 'clubs';

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <AuthGate>
      <div className="app">
        <header className="app-header">
          <h1>My Golf Log</h1>
          <nav>
            <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
              ダッシュボード
            </button>
            <button className={tab === 'shots' ? 'active' : ''} onClick={() => setTab('shots')}>
              ショット入力
            </button>
            <button className={tab === 'clubs' ? 'active' : ''} onClick={() => setTab('clubs')}>
              クラブ管理
            </button>
          </nav>
        </header>
        <main>
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'shots' && <ShotEntryPage />}
          {tab === 'clubs' && <ClubsPage />}
        </main>
      </div>
    </AuthGate>
  );
}

export default App;
