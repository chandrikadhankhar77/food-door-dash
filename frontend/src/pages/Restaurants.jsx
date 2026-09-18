import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import RestaurantFilters from '../components/restaurants/RestaurantFilters';
import RestaurantGrid from '../components/restaurants/RestaurantGrid';
import Button from '../components/ui/Button';
import PageCloseButton from '../components/ui/PageCloseButton';
import useDebounce from '../hooks/useDebounce';
import { restaurantService } from '../services/restaurantService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/formatPrice';

const defaultFilters = {
  search: '',
  cuisine: '',
  location: '',
  rating: '',
  priceRange: '',
  sort: 'rating',
  page: 1,
  limit: 12,
};

export default function Restaurants() {
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    ...defaultFilters,
    search: params.get('search') || '',
    cuisine: params.get('cuisine') || '',
    location: params.get('location') || '',
    rating: params.get('rating') || '',
    priceRange: params.get('priceRange') || '',
    sort: params.get('sort') || 'rating',
    page: Number(params.get('page') || 1),
  });
  const [restaurants, setRestaurants] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const debouncedSearch = useDebounce(filters.search, 400);

  // Keep filters in sync when navigating via navbar/home links (?cuisine= / ?search=)
  useEffect(() => {
    setFilters((prev) => {
      const next = {
        ...prev,
        search: params.get('search') || '',
        cuisine: params.get('cuisine') || '',
        location: params.get('location') || '',
        rating: params.get('rating') || '',
        priceRange: params.get('priceRange') || '',
        sort: params.get('sort') || 'rating',
        page: Number(params.get('page') || 1),
      };
      const same =
        prev.search === next.search &&
        prev.cuisine === next.cuisine &&
        prev.location === next.location &&
        prev.rating === next.rating &&
        prev.priceRange === next.priceRange &&
        prev.sort === next.sort &&
        prev.page === next.page;
      return same ? prev : next;
    });
  }, [params]);

  useEffect(() => {
    const next = new URLSearchParams();
    Object.entries({ ...filters, search: debouncedSearch }).forEach(([k, v]) => {
      if (v !== '' && v != null && k !== 'limit') next.set(k, String(v));
    });
    setParams(next, { replace: true });
  }, [filters, debouncedSearch, setParams]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        let data = await restaurantService.list({
          ...filters,
          search: debouncedSearch || undefined,
          cuisine: filters.cuisine || undefined,
          location: filters.location || undefined,
          rating: filters.rating || undefined,
          priceRange: filters.priceRange || undefined,
        });
        if (!alive) return;
        let list = Array.isArray(data)
          ? data
          : data?.restaurants || data?.items || data?.docs || [];

        // If cuisine filter is empty, fall back to keyword search so users always see matches
        if (
          !list.length &&
          filters.cuisine &&
          !debouncedSearch
        ) {
          data = await restaurantService.list({
            ...filters,
            cuisine: undefined,
            search: filters.cuisine,
          });
          list = Array.isArray(data)
            ? data
            : data?.restaurants || data?.items || data?.docs || [];
        }

        setRestaurants(list);
        setTotalPages(
          data?.pagination?.pages || data?.totalPages || data?.pages || 1
        );
        setTotal(data?.pagination?.total || data?.total || list.length);
      } catch (error) {
        if (alive) {
          setRestaurants([]);
          toast.error(getErrorMessage(error, 'Failed to load restaurants'));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debouncedSearch, filters.cuisine, filters.location, filters.rating, filters.priceRange, filters.sort, filters.page, filters.limit]);

  useEffect(() => {
    if (!isAuthenticated) return;
    favoriteService
      .get()
      .then((data) => {
        const restaurantsFav = data?.restaurants || [];
        setFavoriteIds(restaurantsFav.map((r) => String(r._id || r)));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const onToggleFavorite = async (restaurant) => {
    if (!isAuthenticated) {
      toast.error('Log in to save favorites');
      return;
    }
    try {
      const rid = String(restaurant._id);
      await favoriteService.toggleRestaurant(rid);
      setFavoriteIds((prev) =>
        prev.includes(rid) ? prev.filter((id) => id !== rid) : [...prev, rid]
      );
      toast.success(
        favoriteIds.includes(rid) ? 'Removed from favorites' : 'Saved to favorites'
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Restaurants</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Searching...' : `${total} place${total === 1 ? '' : 's'} found`}
          </p>
        </div>
        <PageCloseButton fallbackTo="/" label="Close restaurants" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          <RestaurantFilters
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(defaultFilters)}
          />
        </aside>
        <div className="space-y-6">
          <RestaurantGrid
            restaurants={restaurants}
            loading={loading}
            favorites={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {filters.page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
