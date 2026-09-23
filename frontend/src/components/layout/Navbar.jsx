import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  User,
} from 'lucide-react';
import {
  APP_NAME,
  CUISINES,
  CUISINE_DISHES,
  QUICK_DISHES,
  isCustomerRole,
  isStaffRole,
} from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { restaurantService } from '../../services/restaurantService';
import useDebounce from '../../hooks/useDebounce';
import NotificationDropdown from '../notifications/NotificationDropdown';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setDrawerOpen } = useCart();
  const isCustomer = isAuthenticated && isCustomerRole(user?.role);
  const isStaff = isAuthenticated && isStaffRole(user?.role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [suggestedRestaurants, setSuggestedRestaurants] = useState([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await restaurantService.featured();
        if (!alive) return;
        const items = Array.isArray(data) ? data : data?.items || data?.restaurants || [];
        setSuggestedRestaurants(items.slice(0, 5));
      } catch {
        if (alive) setSuggestedRestaurants([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const q = debounced.trim();
      if (!q) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const data = await restaurantService.list({ search: q, limit: 5 });
        if (!alive) return;
        const items = Array.isArray(data) ? data : data?.items || data?.restaurants || [];
        setResults(items);
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debounced]);

  const availableCuisines = useMemo(() => {
    const fromData = suggestedRestaurants.flatMap((r) =>
      Array.isArray(r.cuisine) ? r.cuisine : []
    );
    const unique = [...new Set(fromData.filter(Boolean))];
    // Prefer cuisines that exist on real restaurants; keep common list as backup
    const merged = [
      ...unique,
      ...CUISINES.filter((c) => !unique.some((u) => u.toLowerCase() === c.toLowerCase())),
    ];
    return unique.length ? unique : merged;
  }, [suggestedRestaurants]);

  const cuisineMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = availableCuisines.length ? availableCuisines : CUISINES;
    if (!q) return pool.slice(0, 6);
    const filtered = pool.filter((c) => c.toLowerCase().includes(q));
    return (filtered.length ? filtered : pool).slice(0, 6);
  }, [query, availableCuisines]);

  const dishMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_DISHES.slice(0, 6);
    const filtered = QUICK_DISHES.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        d.cuisine.toLowerCase().includes(q) ||
        (d.search && d.search.toLowerCase().includes(q))
    );
    return (filtered.length ? filtered : QUICK_DISHES).slice(0, 6);
  }, [query]);

  const restaurantOptions = useMemo(() => {
    if (query.trim() && results.length) return results;
    if (query.trim() && !searching && results.length === 0) {
      return suggestedRestaurants.length ? suggestedRestaurants : [];
    }
    return suggestedRestaurants;
  }, [query, results, searching, suggestedRestaurants]);

  const go = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    go(q ? `/restaurants?search=${encodeURIComponent(q)}` : '/restaurants');
  };

  const navLink = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700'
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="container-app flex h-[4.25rem] items-center gap-3 sm:gap-4">
          <Link
            to={isStaff ? '/dashboard' : '/'}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition group-hover:scale-105">
              FD
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:inline">
              {APP_NAME}
            </span>
          </Link>

          {!isStaff && (
          <form
            onSubmit={onSearch}
            className="relative mx-auto hidden max-w-md flex-1 md:block"
            ref={wrapRef}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search dishes, cuisines, restaurants..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                autoComplete="off"
              />
            </div>

            {open && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
                <div className="max-h-80 overflow-y-auto p-2">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Popular dishes
                  </p>
                  {dishMatches.map((dish) => (
                    <button
                      key={dish.label}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50"
                      onClick={() =>
                        go(
                          `/restaurants?search=${encodeURIComponent(
                            dish.search || dish.label
                          )}&cuisine=${encodeURIComponent(dish.cuisine)}`
                        )
                      }
                    >
                      <UtensilsCrossed className="h-4 w-4 text-brand-500" />
                      <span>
                        <span className="font-medium">{dish.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          Show places with {dish.label}
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
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50"
                      onClick={() =>
                        go(`/restaurants?cuisine=${encodeURIComponent(cuisine)}`)
                      }
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                        {cuisine.slice(0, 1)}
                      </span>
                      <span>
                        <span className="font-medium">{cuisine}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          Try {CUISINE_DISHES[cuisine] || cuisine}
                        </span>
                      </span>
                    </button>
                  ))}

                  <p className="mt-1 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Restaurants
                  </p>
                  {searching && (
                    <p className="px-3 py-2 text-sm text-slate-500">Looking up places...</p>
                  )}
                  {!searching &&
                    restaurantOptions.map((r) => (
                      <button
                        key={r._id}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50"
                        onClick={() => go(`/restaurants/${r._id}`)}
                      >
                        <Store className="h-4 w-4 text-slate-400" />
                        <span>
                          <span className="font-medium">{r.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {Array.isArray(r.cuisine)
                              ? r.cuisine.slice(0, 2).join(' · ')
                              : r.location || 'Open menu'}
                          </span>
                        </span>
                      </button>
                    ))}
                  {!searching && restaurantOptions.length === 0 && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50"
                      onClick={() => go('/restaurants')}
                    >
                      <Store className="h-4 w-4 text-brand-500" />
                      <span>
                        <span className="font-medium">Browse all restaurants</span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          See every spot on FoodDash
                        </span>
                      </span>
                    </button>
                  )}
                  {query.trim() && (
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-brand-700 hover:bg-brand-50"
                      onClick={() =>
                        go(`/restaurants?search=${encodeURIComponent(query.trim())}`)
                      }
                    >
                      <Search className="h-4 w-4" />
                      <span className="font-medium">View matches for “{query.trim()}”</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
          )}

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {isStaff ? (
              <>
                <NavLink to="/dashboard" className={navLink}>
                  Dashboard
                </NavLink>
                <NavLink to="/dashboard/orders" className={navLink}>
                  Incoming orders
                </NavLink>
                <NavLink to="/dashboard/menu" className={navLink}>
                  Menu
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/restaurants" className={navLink}>
                  Restaurants
                </NavLink>
                {isCustomer && (
                  <>
                    <NavLink to="/orders" className={navLink}>
                      Orders
                    </NavLink>
                    <NavLink to="/favorites" className={navLink}>
                      Favorites
                    </NavLink>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-2">
            {isAuthenticated && <NotificationDropdown />}

            {isCustomer && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative rounded-xl border border-transparent p-2.5 text-slate-600 transition hover:border-slate-200 hover:bg-slate-50"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="relative hidden sm:block group">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <span className="max-w-[7rem] truncate">{user?.name?.split(' ')[0]}</span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl shadow-slate-200/80 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-400" /> Profile
                  </Link>
                  {isCustomer && (
                    <>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Package className="h-4 w-4 text-slate-400" /> Orders
                      </Link>
                      <Link
                        to="/payments"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <CreditCard className="h-4 w-4 text-slate-400" /> Payments
                      </Link>
                      <Link
                        to="/favorites"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Heart className="h-4 w-4 text-slate-400" /> Favorites
                      </Link>
                    </>
                  )}
                  {isStaff && (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-400" /> Dashboard
                    </Link>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:from-brand-700 hover:to-orange-600"
                >
                  Sign up
                </Link>
              </div>
            )}

            <button
              type="button"
              className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
