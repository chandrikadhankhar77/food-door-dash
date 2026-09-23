import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Heart, LayoutDashboard, MapPin, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryTabs from '../components/menu/CategoryTabs';
import MenuItemCard from '../components/menu/MenuItemCard';
import CustomizeModal from '../components/menu/CustomizeModal';
import ReviewList from '../components/reviews/ReviewList';
import { MenuItemSkeleton } from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { restaurantService } from '../services/restaurantService';
import { favoriteService } from '../services/favoriteService';
import { reviewService } from '../services/reviewService';
import { isStaffRole, PLACEHOLDER_RESTAURANT } from '../utils/constants';
import { formatPrice, getErrorMessage } from '../utils/formatPrice';

export default function RestaurantDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const isStaff = isAuthenticated && isStaffRole(user?.role);
  const ownRestaurantId = String(user?.restaurant?._id || user?.restaurant || '');
  const isOwnerPreview =
    isStaff && Boolean(ownRestaurantId) && String(id) === ownRestaurantId;
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState([]);
  const [customizeItem, setCustomizeItem] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [detail, menu, revs] = await Promise.all([
          restaurantService.getById(id),
          restaurantService.getMenu(id),
          reviewService.byRestaurant(id).catch(() => []),
        ]);
        if (!alive) return;
        const rest = detail?.restaurant || detail;
        setRestaurant(rest);
        const cats = menu?.categories || detail?.categories || [];
        const menuItems = menu?.items || menu?.foodItems || detail?.menu || [];
        setCategories(cats);
        setItems(menuItems);
        const revList = Array.isArray(revs)
          ? revs
          : revs?.items || revs?.reviews || [];
        setReviews(revList);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Restaurant not found'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !id || isStaff) return;
    favoriteService
      .get()
      .then((data) => {
        const ids = (data?.restaurants || []).map((r) => String(r._id || r));
        setFavorited(ids.includes(String(id)));
        setFavoriteFoodIds(
          (data?.foodItems || []).map((f) => String(f._id || f))
        );
      })
      .catch(() => {});
  }, [isAuthenticated, id, isStaff]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((item) => {
      const catId = item.category?._id || item.category;
      return String(catId) === String(activeCategory);
    });
  }, [items, activeCategory]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save favorites');
      return;
    }
    try {
      await favoriteService.toggleRestaurant(id);
      setFavorited((v) => !v);
      toast.success(favorited ? 'Removed from favorites' : 'Saved to favorites');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleFoodFavorite = async (item) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save dishes');
      return;
    }
    const foodId = String(item._id);
    try {
      await favoriteService.toggleFoodItem(foodId);
      setFavoriteFoodIds((prev) =>
        prev.includes(foodId) ? prev.filter((x) => x !== foodId) : [...prev, foodId]
      );
      toast.success(
        favoriteFoodIds.includes(foodId) ? 'Dish removed from favorites' : 'Dish saved'
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="container-app py-16">
        <Spinner />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container-app py-10">
        <EmptyState
          title="Restaurant not found"
          description="It may have been removed or is temporarily unavailable."
          actionLabel="Browse restaurants"
          onAction={() => {}}
        />
        <div className="mt-4 text-center">
          <Link to="/restaurants" className="btn-primary">
            Browse restaurants
          </Link>
        </div>
      </div>
    );
  }

  const cuisines = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.join(' · ')
    : restaurant.cuisine;

  return (
    <div>
      {isOwnerPreview && (
        <div className="border-b border-indigo-100 bg-indigo-50">
          <div className="container-app flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-indigo-900">
            <p>
              <span className="font-semibold">Storefront preview</span>
              {' — '}
              this is how customers see your restaurant. Ordering is disabled for partner accounts.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-indigo-800 shadow-sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
      <div className="relative h-56 sm:h-72 lg:h-80">
        <img
          src={restaurant.image || PLACEHOLDER_RESTAURANT}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="container-app absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">{restaurant.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                {restaurant.description || cuisines}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-200">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(restaurant.rating || 0).toFixed(1)}
                </span>
                {restaurant.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {restaurant.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {restaurant.openingHours || '09:00'} – {restaurant.closingHours || '22:00'}
                </span>
                <span>Delivery {formatPrice(restaurant.deliveryFee ?? 2.99)}</span>
              </div>
            </div>
            {!isStaff && (
              <button
                type="button"
                onClick={toggleFavorite}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  favorited ? 'bg-rose-500 text-white' : 'bg-white text-slate-800'
                }`}
              >
                <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
                {favorited ? 'Saved' : 'Favorite'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-app grid gap-8 py-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <CategoryTabs
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <MenuItemSkeleton key={i} />)
            ) : filteredItems.length ? (
              filteredItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  previewMode={isStaff}
                  onCustomize={isStaff ? undefined : (it) => setCustomizeItem(it)}
                  favorited={favoriteFoodIds.includes(String(item._id))}
                  onToggleFavorite={isStaff ? undefined : toggleFoodFavorite}
                />
              ))
            ) : (
              <EmptyState title="No menu items" description="Check back soon for new dishes." />
            )}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Customer reviews</h2>
            <ReviewList reviews={reviews} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card sticky top-24 space-y-3 p-5">
            <h3 className="font-semibold text-slate-900">Restaurant info</h3>
            <p className="text-sm text-slate-500">{cuisines || 'Various cuisines'}</p>
            <p className="text-sm text-slate-600">
              {restaurant.address?.street}
              {restaurant.address?.city ? `, ${restaurant.address.city}` : ''}
            </p>
            <p className="text-sm text-slate-600">
              Price range: <strong>{restaurant.priceRange || '$$'}</strong>
            </p>
            {restaurant.contact?.phone && (
              <p className="text-sm text-slate-600">{restaurant.contact.phone}</p>
            )}
          </div>
        </aside>
      </div>

      <CustomizeModal
        open={Boolean(customizeItem)}
        item={customizeItem}
        restaurant={restaurant}
        onClose={() => setCustomizeItem(null)}
        onConfirm={addItem}
      />
    </div>
  );
}
