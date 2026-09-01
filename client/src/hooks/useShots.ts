import { useCallback, useEffect, useState } from 'react';
import { api, type NewShotInput } from '../lib/api';
import type { ShotRecord } from '../types/models';

export type { NewShotInput };

export function useShots() {
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const items = await api.listShots();
    setShots(items);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function addShot(input: NewShotInput) {
    await api.createShot(input);
    await refresh();
  }

  async function deleteShot(id: string) {
    await api.deleteShot(id);
    await refresh();
  }

  function shotsForClub(clubId: string): ShotRecord[] {
    return shots.filter((s) => s.clubId === clubId);
  }

  return { shots, loading, addShot, deleteShot, shotsForClub };
}
