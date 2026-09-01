import { useState } from 'react';
import type { ClubCategory } from '../../types/models';

const CATEGORIES: ClubCategory[] = ['DRIVER', 'WOOD', 'HYBRID', 'IRON', 'WEDGE', 'PUTTER', 'OTHER'];

export function ClubForm({ onAdd }: { onAdd: (name: string, category: ClubCategory) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClubCategory>('IRON');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), category);
    setName('');
  }

  return (
    <form onSubmit={handleSubmit} className="club-form">
      <input
        type="text"
        placeholder="クラブ名(例: 7 Iron)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value as ClubCategory)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button type="submit">追加</button>
    </form>
  );
}
