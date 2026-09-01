import { useState } from 'react';
import { ClubsPage } from './pages/ClubsPage';
import { ShotEntryPage } from './pages/ShotEntryPage';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

type Tab = 'shots' | 'dashboard' | 'clubs';

function App() {
  const [tab, setTab] = useState<Tab>('shots');

  return (
    <div className="app">
      <header className="app-header">
        <h1>My Golf Log</h1>
        <nav>
          <button className={tab === 'shots' ? 'active' : ''} onClick={() => setTab('shots')}>
            ショット入力
          </button>
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
            ダッシュボード
          </button>
          <button className={tab === 'clubs' ? 'active' : ''} onClick={() => setTab('clubs')}>
            クラブ管理
          </button>
        </nav>
      </header>
      <main>
        {tab === 'shots' && <ShotEntryPage />}
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'clubs' && <ClubsPage />}
      </main>
    </div>
  );
}

export default App;
