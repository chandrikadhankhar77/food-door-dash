import { Heart, Leaf, Plus } from 'lucide-react';
import { getDishImage, PLACEHOLDER_FOOD } from '../../utils/constants';
import { formatPrice } from '../../utils/formatPrice';
import Badge from '../ui/Badge';

export default function MenuItemCard({
  item,
  onCustomize,
  favorited = false,
  onToggleFavorite,
}) {
  const imageSrc = getDishImage(item.name, item.image);

  return (
    <article className="card card-hover flex gap-4 p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
          {item.isVegetarian && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <Leaf className="h-3.5 w-3.5" /> Veg
            </span>
          )}
          {item.isPopular && <Badge tone="warning">Popular</Badge>}
          {!item.isAvailable && <Badge tone="danger">Unavailable</Badge>}
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{item.description}</p>
        )}
        {item.nutritionalInfo &&
          (item.nutritionalInfo.calories ||
            item.nutritionalInfo.protein ||
            item.nutritionalInfo.carbs ||
            item.nutritionalInfo.fat) && (
            <p className="text-xs text-slate-400">
              {[
                item.nutritionalInfo.calories != null &&
                  `${item.nutritionalInfo.calories} cal`,
                item.nutritionalInfo.protein != null &&
                  `P ${item.nutritionalInfo.protein}g`,
                item.nutritionalInfo.carbs != null &&
                  `C ${item.nutritionalInfo.carbs}g`,
                item.nutritionalInfo.fat != null &&
                  `F ${item.nutritionalInfo.fat}g`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        <p className="text-base font-semibold text-brand-700">{formatPrice(item.price)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!item.isAvailable}
            onClick={() => onCustomize?.(item)}
            className="btn-primary mt-1"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(item)}
              className={`mt-1 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                favorited
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              aria-label={favorited ? 'Remove from favorites' : 'Save dish'}
            >
              <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
              {favorited ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
        <img
          src={imageSrc}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_FOOD;
          }}
        />
      </div>
    </article>
  );
}
