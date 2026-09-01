import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { Club, ClubCategory } from '../types/models';

const client = generateClient<Schema>();

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = client.models.Club.observeQuery().subscribe({
      next: ({ items }) => {
        setClubs(items);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  async function addClub(name: string, category: ClubCategory) {
    await client.models.Club.create({ name, category, isActive: true });
  }

  async function updateClub(id: string, changes: Partial<Pick<Club, 'name' | 'category' | 'loftDegrees' | 'isActive'>>) {
    await client.models.Club.update({ id, ...changes });
  }

  async function loadStandardBag(defaults: { name: string; category: ClubCategory }[]) {
    await Promise.all(
      defaults.map((c) => client.models.Club.create({ name: c.name, category: c.category, isActive: true })),
    );
  }

  return { clubs, loading, addClub, updateClub, loadStandardBag };
}
