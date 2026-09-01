// Fixed categorical palette for the multi-club scatter chart. Assigned by a
// club's position in the (stable, category-sorted) active-clubs list, never
// by anything that could reorder at runtime — color must follow the club,
// not its rank, so toggling other clubs on/off never repaints a survivor.
const CLUB_COLORS = [
  '#4C78A8', '#F58518', '#54A24B', '#E45756', '#72B7B2',
  '#EECA3B', '#B279A2', '#FF9DA6', '#9D755D', '#17BECF',
  '#7B4173', '#B85536', '#6A6A6A', '#1B9E77',
];

export function colorForIndex(index: number): string {
  return CLUB_COLORS[index % CLUB_COLORS.length];
}
