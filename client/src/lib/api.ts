import type { Club, ClubCategory, ShotDirection, ShotRecord, ShotSource } from '../types/models';

// import.meta.env.BASE_URL already ends with "/" (Vite's `base` config), so this
// resolves correctly whether the app is served at site root or under a subpath
// (e.g. nginx proxying /golf/ to this app — see client/vite.config.ts).
const BASE = `${import.meta.env.BASE_URL}api`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

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

export const api = {
  listClubs: () => request<Club[]>('/clubs'),
  createClub: (name: string, category: ClubCategory) =>
    request<Club>('/clubs', { method: 'POST', body: JSON.stringify({ name, category, isActive: true }) }),
  updateClub: (id: string, changes: Partial<Pick<Club, 'name' | 'category' | 'loftDegrees' | 'isActive'>>) =>
    request<Club>(`/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),

  listShots: () => request<ShotRecord[]>('/shots'),
  createShot: (input: NewShotInput) =>
    request<ShotRecord>('/shots', {
      method: 'POST',
      body: JSON.stringify({ ...input, recordedAt: input.recordedAt ?? new Date().toISOString(), source: input.source ?? 'MANUAL' }),
    }),
  deleteShot: (id: string) => request<void>(`/shots/${id}`, { method: 'DELETE' }),
};
