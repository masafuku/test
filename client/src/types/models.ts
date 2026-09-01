export type ClubCategory = 'DRIVER' | 'WOOD' | 'HYBRID' | 'IRON' | 'WEDGE' | 'PUTTER' | 'OTHER';

export type ShotDirection = 'STRAIGHT' | 'FADE' | 'DRAW' | 'PULL' | 'PUSH' | 'SLICE' | 'HOOK';

export type ShotSource = 'MANUAL' | 'CSV_IMPORT' | 'LAUNCH_MONITOR_API';

export interface Club {
  id: string;
  name: string;
  category: ClubCategory;
  loftDegrees?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShotRecord {
  id: string;
  clubId: string;
  carryDistanceYds?: number | null;
  totalDistanceYds?: number | null;
  direction?: ShotDirection | null;
  lateralDeviationYds?: number | null;
  shotShapeNotes?: string | null;
  source: ShotSource;
  externalId?: string | null;
  recordedAt: string;
  sessionLabel?: string | null;
  createdAt: string;
  updatedAt: string;
}
