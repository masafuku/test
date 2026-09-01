import { useClubs } from '../hooks/useClubs';
import { ClubList } from '../components/clubs/ClubList';
import { ClubForm } from '../components/clubs/ClubForm';
import { STANDARD_BAG } from '../lib/clubDefaults';

export function ClubsPage() {
  const { clubs, loading, addClub, updateClub, loadStandardBag } = useClubs();

  if (loading) return <p>読み込み中...</p>;

  return (
    <section>
      <h2>クラブ管理</h2>
      {clubs.length === 0 && (
        <button onClick={() => loadStandardBag(STANDARD_BAG)}>標準セットを読み込む(14本)</button>
      )}
      <ClubList clubs={clubs} onToggleActive={(id, isActive) => updateClub(id, { isActive })} />
      <ClubForm onAdd={addClub} />
    </section>
  );
}
