import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { ShotDirection, ShotRecord, ShotSource } from '../types/models';

const client = generateClient<Schema>();

export interface NewShotInput {
  clubId: string;
  carryDistanceYds?: number;
  totalDistanceYds?: number;
  direction?: ShotDirection;
  lateralDeviationYds?: number;
  shotShapeNotes?: string;
  sessionLabel?: string;
  recordedAt?: string;
  source?: ShotSource;
}

export function useShots() {
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = client.models.ShotRecord.observeQuery().subscribe({
      next: ({ items }) => {
        setShots(items);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  async function addShot(input: NewShotInput) {
    await client.models.ShotRecord.create({
      clubId: input.clubId,
      carryDistanceYds: input.carryDistanceYds,
      totalDistanceYds: input.totalDistanceYds,
      direction: input.direction,
      lateralDeviationYds: input.lateralDeviationYds,
      shotShapeNotes: input.shotShapeNotes,
      sessionLabel: input.sessionLabel,
      recordedAt: input.recordedAt ?? new Date().toISOString(),
      source: input.source ?? 'MANUAL',
    });
  }

  async function deleteShot(id: string) {
    await client.models.ShotRecord.delete({ id });
  }

  function shotsForClub(clubId: string): ShotRecord[] {
    return shots.filter((s) => s.clubId === clubId);
  }

  return { shots, loading, addShot, deleteShot, shotsForClub };
}
