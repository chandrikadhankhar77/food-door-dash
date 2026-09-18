import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import {
  PRICE_RANGE_OPTIONS,
  QUICK_DISHES,
  SORT_OPTIONS,
} from '../../utils/constants';

/** Cuisines that exist on seeded/live restaurants */
const LIVE_CUISINES = [
  'Indian',
  'Italian',
  'Pizza',
  'Japanese',
  'Healthy',
  'American',
  'BBQ',
  'Mexican',
  'Tacos',
  'Vegetarian',
];

/** Cities available in restaurant listings */
const LIVE_LOCATIONS = ['Austin', 'Houston', 'Dallas'];

export default function RestaurantFilters({ filters, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const dishMatches = useMemo(() => {
    const q = String(filters.search || '').trim().toLowerCase();
    if (!q) return QUICK_DISHES;
    const filtered = QUICK_DISHES.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        d.cuisine.toLowerCase().includes(q) ||
        d.search.toLowerCase().includes(q)
    );
    return filtered.length ? filtered : QUICK_DISHES;
  }, [filters.search]);

  const cuisineMatches = useMemo(() => {
    const q = String(filters.search || '').trim().toLowerCase();
    if (!q) return LIVE_CUISINES.slice(0, 6);
    const filtered = LIVE_CUISINES.filter((c) => c.toLowerCase().includes(q));
    return (filtered.length ? filtered : LIVE_CUISINES).slice(0, 6);
  }, [filters.search]);

  const pickDish = (dish) => {
    onChange({
      ...filters,
      search: dish.search || dish.label,
      cuisine: dish.cuisine || '',
      page: 1,
    });
    setOpen(false);
  };

  const pickCuisine = (cuisine) => {
    onChange({
      ...filters,
      search: '',
      cuisine,
      page: 1,
    });
    setOpen(false);
  };

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <SlidersHorizontal className="h-4 w-4 text-brand-600" />
        Filters
      </div>

      <div className="relative" ref={wrapRef}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search || ''}
          onChange={(e) => {
            set('search', e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search restaurants or dishes..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          autoComplete="off"
        />

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Popular dishes
            </p>
            {dishMatches.map((dish) => (
              <button
                key={dish.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-orange-50"
                onClick={() => pickDish(dish)}
              >
                <UtensilsCrossed className="h-4 w-4 shrink-0 text-brand-500" />
                <span>
                  <span className="font-medium">{dish.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {dish.cuisine} · show matching places
                  </span>
                </span>
              </button>
            ))}

            <p className="mt-1 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Cuisines
            </p>
            {cuisineMatches.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-orange-50"
                onClick={() => pickCuisine(cuisine)}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                  {cuisine.slice(0, 1)}
                </span>
                <span className="font-medium">{cuisine}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Cuisine</label>
          <select
            value={filters.cuisine || ''}
            onChange={(e) => set('cuisine', e.target.value)}
            className="input-field"
          >
            <option value="">All cuisines</option>
            {LIVE_CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Location</label>
          <select
            value={filters.location || ''}
            onChange={(e) => set('location', e.target.value)}
            className="input-field"
          >
            <option value="">All locations</option>
            {LIVE_LOCATIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Min rating</label>
          <select
            value={filters.rating || ''}
            onChange={(e) => set('rating', e.target.value)}
            className="input-field"
          >
            <option value="">Any</option>
            {[4.5, 4, 3.5, 3].map((r) => (
              <option key={r} value={r}>
                {r}+ stars
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Price</label>
          <select
            value={filters.priceRange || ''}
            onChange={(e) => set('priceRange', e.target.value)}
            className="input-field"
          >
            <option value="">Any</option>
            {PRICE_RANGE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Sort by</label>
          <select
            value={filters.sort || 'rating'}
            onChange={(e) => set('sort', e.target.value)}
            className="input-field"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" onClick={onReset} className="btn-secondary w-full">
        Reset filters
      </button>
    </div>
  );
}
