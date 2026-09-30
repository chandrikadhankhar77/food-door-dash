import RestaurantCard from './RestaurantCard';
import { RestaurantCardSkeleton } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { Store } from 'lucide-react';

export default function RestaurantGrid({
  restaurants = [],
  loading,
  favorites = [],
  onToggleFavorite,
}) {
  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!restaurants.length) {
    return (
      <EmptyState
        icon={Store}
        title="No restaurants found"
        description="Try adjusting your filters or search for another cuisine."
      />
    );
  }

  const favSet = new Set(
    (favorites || []).map((f) => String(typeof f === 'string' ? f : f._id || f))
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {restaurants.map((r) => (
        <RestaurantCard
          key={r._id}
          restaurant={r}
          favorited={favSet.has(String(r._id))}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
