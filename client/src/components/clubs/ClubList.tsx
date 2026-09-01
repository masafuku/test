import type { Club } from '../../types/models';
import { sortByBagOrder } from '../../lib/clubOrder';

export function ClubList({
  clubs,
  onToggleActive,
}: {
  clubs: Club[];
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  const sorted = sortByBagOrder(clubs);

  if (sorted.length === 0) {
    return <p>クラブが登録されていません。下のフォームか「標準セットを読み込む」から追加してください。</p>;
  }

  return (
    <ul className="club-list">
      {sorted.map((club) => (
        <li key={club.id} className={club.isActive ? '' : 'inactive'}>
          <span>{club.name}</span>
          <span className="category">{club.category}</span>
          <label>
            <input
              type="checkbox"
              checked={club.isActive ?? true}
              onChange={(e) => onToggleActive(club.id, e.target.checked)}
            />
            使用中
          </label>
        </li>
      ))}
    </ul>
  );
}
