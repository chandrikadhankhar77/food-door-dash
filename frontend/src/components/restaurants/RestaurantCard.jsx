import { Link } from 'react-router-dom';
import { Clock3, Heart, MapPin, Star } from 'lucide-react';
import { PLACEHOLDER_RESTAURANT } from '../../utils/constants';
import { formatPrice } from '../../utils/formatPrice';
import Badge from '../ui/Badge';

export default function RestaurantCard({ restaurant, favorited, onToggleFavorite }) {
  const image = restaurant.image || PLACEHOLDER_RESTAURANT;
  const cuisines = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine
    : restaurant.cuisine
      ? [restaurant.cuisine]
      : [];

  return (
    <article className="card card-hover group overflow-hidden ring-1 ring-transparent transition hover:ring-brand-200">
      <Link to={`/restaurants/${restaurant._id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={restaurant.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PLACEHOLDER_RESTAURANT;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
          {restaurant.isFeatured && (
            <div className="absolute left-3 top-3">
              <Badge>Featured</Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow">
            {restaurant.priceRange || '$$'}
          </div>
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow">
            <Clock3 className="h-3 w-3 text-brand-600" /> ~35 min
          </div>
        </div>
      </Link>
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/restaurants/${restaurant._id}`} className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
              {restaurant.name}
            </h3>
          </Link>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(restaurant);
              }}
              className={`rounded-full p-1.5 transition ${
                favorited ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-100'
              }`}
              aria-label="Favorite restaurant"
            >
              <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <p className="line-clamp-1 text-sm text-slate-500">
          {cuisines.slice(0, 3).join(' · ') || 'Various cuisines'}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {Number(restaurant.rating || 0).toFixed(1)}
            {restaurant.ratingCount ? (
              <span className="text-amber-700/70">({restaurant.ratingCount})</span>
            ) : null}
          </span>
          {restaurant.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {restaurant.location}
            </span>
          )}
          <span className="font-medium text-slate-700">
            Fee {formatPrice(restaurant.deliveryFee ?? 2.99)}
          </span>
        </div>
      </div>
    </article>
  );
}
