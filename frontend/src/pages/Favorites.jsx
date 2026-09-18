import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import RestaurantCard from '../components/restaurants/RestaurantCard';
import EmptyState from '../components/ui/EmptyState';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { favoriteService } from '../services/favoriteService';
import { getDishImage, PLACEHOLDER_FOOD } from '../utils/constants';
import { formatPrice, getErrorMessage } from '../utils/formatPrice';

export default function Favorites() {
  const [tab, setTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await favoriteService.get();
      setRestaurants(data?.restaurants || []);
      setFoodItems(data?.foodItems || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load favorites'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeRestaurant = async (restaurant) => {
    try {
      await favoriteService.removeRestaurant(restaurant._id);
      setRestaurants((prev) => prev.filter((r) => r._id !== restaurant._id));
      toast.success('Removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeFood = async (item) => {
    try {
      await favoriteService.removeFoodItem(item._id);
      setFoodItems((prev) => prev.filter((f) => f._id !== item._id));
      toast.success('Removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Favorites</h1>
          <p className="text-sm text-slate-500">Restaurants and dishes you love</p>
        </div>
        <PageCloseButton fallbackTo="/" label="Close favorites" />
      </div>

      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1 w-fit">
        {[
          { key: 'restaurants', label: 'Restaurants' },
          { key: 'items', label: 'Dishes' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : tab === 'restaurants' ? (
        restaurants.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((r) => (
              <RestaurantCard
                key={r._id}
                restaurant={r}
                favorited
                onToggleFavorite={removeRestaurant}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No favorite restaurants"
            description="Tap the heart on a restaurant to save it here."
            actionLabel="Browse restaurants"
            onAction={() => {
              window.location.href = '/restaurants';
            }}
          />
        )
      ) : foodItems.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foodItems.map((item) => (
            <div key={item._id} className="card overflow-hidden">
              <img
                src={getDishImage(item.name, item.image)}
                alt={item.name}
                className="h-40 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PLACEHOLDER_FOOD;
                }}
              />
              <div className="space-y-2 p-4">
                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-brand-700">{formatPrice(item.price)}</p>
                <div className="flex gap-2">
                  <Link
                    to={`/restaurants/${item.restaurant?._id || item.restaurant}`}
                    className="btn-primary flex-1"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFood(item)}
                    className="btn-secondary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No favorite dishes"
          description="Save dishes while browsing menus."
        />
      )}
    </div>
  );
}
