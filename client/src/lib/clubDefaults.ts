import type { ClubCategory } from '../types/models';

export interface ClubDefault {
  name: string;
  category: ClubCategory;
}

/**
 * A one-tap "load standard bag" starting point on the Clubs page, tailored to
 * the actual bag in use (Ping irons/wedges: U, 6-9, W, 52°, 56°) so the user
 * isn't stuck typing every club by hand.
 */
export const STANDARD_BAG: ClubDefault[] = [
  { name: 'Driver', category: 'DRIVER' },
  { name: '3 Wood', category: 'WOOD' },
  { name: '5 Wood', category: 'WOOD' },
  { name: '4 Hybrid', category: 'HYBRID' },
  { name: 'U', category: 'IRON' },
  { name: '6 Iron', category: 'IRON' },
  { name: '7 Iron', category: 'IRON' },
  { name: '8 Iron', category: 'IRON' },
  { name: '9 Iron', category: 'IRON' },
  { name: 'W', category: 'WEDGE' },
  { name: '52°', category: 'WEDGE' },
  { name: '56°', category: 'WEDGE' },
  { name: 'Putter', category: 'PUTTER' },
];
