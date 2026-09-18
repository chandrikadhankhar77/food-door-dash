import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Store,
  UtensilsCrossed,
  ArrowLeft,
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/restaurant', label: 'Restaurant', icon: Store },
  { to: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { to: '/dashboard/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              FD
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{APP_NAME}</p>
              <p className="text-[11px] text-slate-500">Restaurant admin</p>
            </div>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:pb-6">
          {links.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-slate-100 p-4 lg:block">
          <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to storefront
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        </header>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
