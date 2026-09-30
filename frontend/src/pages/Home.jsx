import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Tag,
  Utensils,
} from 'lucide-react';
import RestaurantCard from '../components/restaurants/RestaurantCard';
import { RestaurantCardSkeleton } from '../components/ui/Skeleton';
import StarRating from '../components/reviews/StarRating';
import { restaurantService } from '../services/restaurantService';
import { reviewService } from '../services/reviewService';
import { promoService } from '../services/promoService';
import {
  CUISINE_DISHES,
  CUISINE_IMAGES,
  DISH_IMAGES,
  getDishImage,
  PLACEHOLDER_FOOD,
} from '../utils/constants';
import { formatPrice } from '../utils/formatPrice';

const FALLBACK_DISHES = Object.entries(DISH_IMAGES)
  .slice(0, 8)
  .map(([name, image], i) => ({
    _id: `fb${i}`,
    name,
    price: 10 + i,
    image,
  }));

const uniquePopularDishes = (items = []) => {
  const seenImages = new Set();
  const seenNames = new Set();
  const out = [];
  for (const item of items) {
    const name = item.name || '';
    const image = getDishImage(name, item.image);
    if (seenNames.has(name.toLowerCase()) || seenImages.has(image)) continue;
    seenNames.add(name.toLowerCase());
    seenImages.add(image);
    out.push({ ...item, image });
    if (out.length >= 8) break;
  }
  return out;
};

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [feat, foods, promoRes, allRest] = await Promise.allSettled([
          restaurantService.featured(),
          restaurantService.popularFoods({ limit: 8 }),
          promoService.list(),
          restaurantService.list({ limit: 8, sort: 'rating' }),
        ]);
        if (!alive) return;
        const featData = feat.status === 'fulfilled' ? feat.value : null;
        const foodData = foods.status === 'fulfilled' ? foods.value : null;
        const promoData = promoRes.status === 'fulfilled' ? promoRes.value : null;
        const listData = allRest.status === 'fulfilled' ? allRest.value : null;

        let featuredList = Array.isArray(featData)
          ? featData
          : featData?.restaurants || featData?.items || [];
        const extraList = Array.isArray(listData)
          ? listData
          : listData?.restaurants || listData?.items || [];

        // Ensure at least 6 cards — fill from top restaurants if featured is short
        if (featuredList.length < 6 && extraList.length) {
          const seen = new Set(featuredList.map((r) => String(r._id)));
          for (const r of extraList) {
            if (featuredList.length >= 6) break;
            if (!seen.has(String(r._id))) {
              featuredList = [...featuredList, r];
              seen.add(String(r._id));
            }
          }
        }

        setFeatured(featuredList);
        const rawFoods = Array.isArray(foodData)
          ? foodData
          : foodData?.items || foodData?.foodItems || [];
        setPopularFoods(uniquePopularDishes(rawFoods));
        setPromos(
          Array.isArray(promoData) ? promoData : promoData?.items || promoData?.promos || []
        );

        const reviewTargets = featuredList.slice(0, 4).map((r) => r._id).filter(Boolean);
        if (reviewTargets.length) {
          try {
            const batches = await Promise.allSettled(
              reviewTargets.map((id) => reviewService.byRestaurant(id, { limit: 4 }))
            );
            if (!alive) return;
            const merged = [];
            for (const batch of batches) {
              if (batch.status !== 'fulfilled') continue;
              const reviewData = batch.value;
              const list = Array.isArray(reviewData)
                ? reviewData
                : reviewData?.items || reviewData?.reviews || [];
              merged.push(...list);
            }
            setReviews(merged.slice(0, 3));
          } catch {
            if (alive) setReviews([]);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(
      query.trim()
        ? `/restaurants?search=${encodeURIComponent(query.trim())}`
        : '/restaurants'
    );
  };

  return (
    <div>
      <section className="relative overflow-hidden text-white">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="container-app relative z-10 max-w-3xl py-20 sm:py-28">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Clock3 className="h-3.5 w-3.5" /> Avg delivery under 35 mins
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Hungry? FoodDash has you covered.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
            Browse top-rated restaurants, customize every dish, and track your order from kitchen to
            doorstep.
          </p>
          <form onSubmit={onSearch} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pizza, sushi, burgers..."
                className="w-full rounded-2xl border border-white/40 bg-white py-3.5 pl-12 pr-4 text-slate-800 shadow-lg outline-none ring-0 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/35 transition hover:bg-brand-700"
            >
              Find food
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-200">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Local favorites
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Secure Stripe checkout
            </span>
          </div>
        </div>
      </section>

      <section className="container-app py-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Popular cuisines</h2>
            <p className="text-sm text-slate-500">Tap a vibe and start browsing</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllCuisines((v) => !v)}
            className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            {showAllCuisines ? 'Show less' : 'See all'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(showAllCuisines
            ? ['Indian', 'Italian', 'Pizza', 'Japanese', 'Healthy', 'American', 'BBQ', 'Mexican', 'Tacos', 'Vegetarian']
            : ['Indian', 'Pizza', 'Japanese', 'Mexican', 'Healthy']
          ).map((cuisine) => (
            <Link
              key={cuisine}
              to={`/restaurants?cuisine=${encodeURIComponent(cuisine)}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <div className="relative h-28 overflow-hidden">
                <img
                  src={CUISINE_IMAGES[cuisine] || PLACEHOLDER_FOOD}
                  alt={CUISINE_DISHES[cuisine] || cuisine}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER_FOOD;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                <p className="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white">
                  {CUISINE_DISHES[cuisine] || cuisine}
                </p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {cuisine}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-app">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">
                Near you
              </p>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Featured restaurants</h2>
              <p className="text-sm text-slate-500">Hand-picked spots near you</p>
            </div>
            <Link
              to="/restaurants"
              className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Browse all
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : featured.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((r) => (
                <RestaurantCard key={r._id} restaurant={r} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-slate-500">
              Featured restaurants will appear once the API is connected. Meanwhile,{' '}
              <Link to="/restaurants" className="font-semibold text-brand-600">
                explore restaurants
              </Link>
              .
            </div>
          )}
        </div>
      </section>

      <section id="popular-dishes" className="container-app scroll-mt-24 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Popular dishes</h2>
            <p className="text-sm text-slate-500">Crowd favorites this week</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(popularFoods.length ? popularFoods : FALLBACK_DISHES).map((item) => {
            const restaurantId = item.restaurant?._id || item.restaurant;
            const imageSrc = getDishImage(item.name, item.image);
            const CardInner = (
              <>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={imageSrc}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_FOOD;
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-3">
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-xs text-slate-400">
                      {item.category?.name || 'Chef special'}
                    </p>
                    <p className="mt-0.5 text-base font-bold text-brand-700">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                    Popular
                  </span>
                </div>
              </>
            );

            if (restaurantId) {
              return (
                <Link
                  key={item._id}
                  to={`/restaurants/${restaurantId}`}
                  className="group card card-hover overflow-hidden"
                >
                  {CardInner}
                </Link>
              );
            }

            return (
              <Link
                key={item._id}
                to={`/restaurants?search=${encodeURIComponent(item.name)}`}
                className="group card card-hover overflow-hidden"
              >
                {CardInner}
              </Link>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
        <div className="container-app relative">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-2 text-slate-500">Three simple steps to your next meal</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Utensils,
                step: '01',
                title: 'Choose a restaurant',
                text: 'Filter by cuisine, rating, and price to find the perfect spot.',
                tone: 'from-brand-500 to-orange-500',
              },
              {
                icon: Search,
                step: '02',
                title: 'Customize your order',
                text: 'Add toppings, leave special instructions, and checkout securely.',
                tone: 'from-orange-500 to-amber-500',
              },
              {
                icon: Bike,
                step: '03',
                title: 'Track delivery live',
                text: 'Watch status updates from confirmed to delivered in real time.',
                tone: 'from-brand-600 to-rose-500',
              },
            ].map(({ icon: Icon, step, title, text, tone }) => (
              <div
                key={step}
                className="group relative overflow-hidden rounded-3xl border border-orange-100/80 bg-white p-6 shadow-md shadow-orange-100/50 transition duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-200/40"
              >
                <span className="absolute -right-2 -top-3 text-6xl font-black text-orange-50 transition group-hover:text-brand-100">
                  {step}
                </span>
                <div
                  className={`relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-md transition duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative text-lg font-bold text-slate-900 transition group-hover:text-brand-700">
                  {title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
                <div className="relative mt-4 h-1 w-12 rounded-full bg-brand-200 transition-all duration-300 group-hover:w-20 group-hover:bg-brand-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-14">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Active promotions</h2>
            <p className="text-sm text-slate-500">Apply these codes at checkout</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(promos.length
            ? promos
            : [
                {
                  _id: 'p1',
                  title: 'Welcome 15% off',
                  description: 'Save 15% on your first orders over the minimum amount.',
                  code: 'WELCOME15',
                  discountPercent: 15,
                },
              ]
          ).map((promo) => (
            <div
              key={promo._id || promo.code}
              className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-6 shadow-sm"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-200/40 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{promo.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {promo.description || `${promo.discountPercent}% off qualifying orders`}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-400 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-brand-700">
                    {promo.code}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-r from-brand-600 to-rose-500 p-8 text-white sm:p-10">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold">Hungry nights, happier checkouts.</h2>
            <p className="mt-3 text-orange-50">
              Create an account, save addresses, and track every order from kitchen to doorstep.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow hover:bg-orange-50"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-orange-50/40 py-14">
        <div className="container-app">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Loved by hungry customers
            </h2>
            <p className="mt-1 text-sm text-slate-500">Real reviews from FoodDash diners</p>
          </div>
          {reviews.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reviews
                .filter((review) => review.user?.name)
                .slice(0, 3)
                .map((review) => (
                  <blockquote
                    key={review._id}
                    className="card flex h-full flex-col p-6 shadow-sm ring-1 ring-orange-100/80 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <StarRating value={review.rating} readOnly size="sm" />
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                      “{review.comment}”
                    </p>
                    <footer className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {review.user.name.charAt(0)}
                        </span>
                        {review.user.name}
                      </span>
                      {review.deliveryRating != null && (
                        <span className="text-xs font-medium text-slate-400">
                          Delivery {review.deliveryRating}/5
                        </span>
                      )}
                    </footer>
                  </blockquote>
                ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">
              Customer reviews will appear here once diners share feedback.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
