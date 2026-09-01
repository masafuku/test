import type { Club } from '../types/models';
import { STANDARD_BAG } from './clubDefaults';

const CATEGORY_ORDER = ['DRIVER', 'WOOD', 'HYBRID', 'IRON', 'WEDGE', 'PUTTER', 'OTHER'];

// STANDARD_BAG's own array order is the canonical bag order (e.g. it places
// "U" between "W" and "52°" even though U/W are different categories) — a
// plain category-grouped sort can never reproduce that, since it always
// clusters every IRON before every WEDGE. Clubs whose name doesn't match a
// STANDARD_BAG entry (custom-named clubs) fall back to category, then to
// their original (creation) order.
const BAG_INDEX = new Map(STANDARD_BAG.map((c, i) => [c.name, i]));

/** Sorts clubs into the standard bag order, falling back to category + creation order for unrecognized names. */
export function sortByBagOrder(clubs: Club[]): Club[] {
  return clubs
    .map((club, originalIndex) => ({ club, originalIndex }))
    .sort((a, b) => {
      const bagA = BAG_INDEX.get(a.club.name);
      const bagB = BAG_INDEX.get(b.club.name);
      if (bagA != null && bagB != null) return bagA - bagB;
      if (bagA != null) return -1;
      if (bagB != null) return 1;

      const catDiff = CATEGORY_ORDER.indexOf(a.club.category) - CATEGORY_ORDER.indexOf(b.club.category);
      if (catDiff !== 0) return catDiff;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ club }) => club);
}
