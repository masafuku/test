import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Session, SessionType } from '../types/models';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [all, current] = await Promise.all([api.listSessions(), api.getCurrentSession()]);
    setSessions(all);
    setCurrentSession(current);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function startSession(type: SessionType, label?: string) {
    await api.startSession(type, label);
    await refresh();
  }

  async function endSession(id: string) {
    await api.endSession(id);
    await refresh();
  }

  return { sessions, currentSession, loading, startSession, endSession };
}
