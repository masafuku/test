import type { ClubCategory } from '../types/models';

export interface ClubDefault {
  name: string;
  category: ClubCategory;
}

/**
 * A standard 14-club bag, offered as a one-tap "load standard bag" starting
 * point on the Clubs page so the user isn't stuck typing every club by hand.
 */
export const STANDARD_BAG: ClubDefault[] = [
  { name: 'Driver', category: 'DRIVER' },
  { name: '3 Wood', category: 'WOOD' },
  { name: '5 Wood', category: 'WOOD' },
  { name: '4 Hybrid', category: 'HYBRID' },
  { name: '5 Iron', category: 'IRON' },
  { name: '6 Iron', category: 'IRON' },
  { name: '7 Iron', category: 'IRON' },
  { name: '8 Iron', category: 'IRON' },
  { name: '9 Iron', category: 'IRON' },
  { name: 'Pitching Wedge', category: 'WEDGE' },
  { name: 'Gap Wedge', category: 'WEDGE' },
  { name: 'Sand Wedge', category: 'WEDGE' },
  { name: 'Lob Wedge', category: 'WEDGE' },
  { name: 'Putter', category: 'PUTTER' },
];
