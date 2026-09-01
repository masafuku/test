import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Club, ClubCategory } from '../types/models';

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const items = await api.listClubs();
    setClubs(items);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function addClub(name: string, category: ClubCategory) {
    await api.createClub(name, category);
    await refresh();
  }

  async function updateClub(id: string, changes: Partial<Pick<Club, 'name' | 'category' | 'loftDegrees' | 'isActive'>>) {
    await api.updateClub(id, changes);
    await refresh();
  }

  async function loadStandardBag(defaults: { name: string; category: ClubCategory }[]) {
    await Promise.all(defaults.map((c) => api.createClub(c.name, c.category)));
    await refresh();
  }

  return { clubs, loading, addClub, updateClub, loadStandardBag };
}
