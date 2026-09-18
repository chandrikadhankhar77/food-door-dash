import { Link, NavLink } from 'react-router-dom';
import {
  CreditCard,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Store,
  User,
  X,
} from 'lucide-react';
import { APP_NAME, ROLES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function MobileMenu({ open, onClose }) {
  const { user, isAuthenticated, logout } = useAuth();

  if (!open) return null;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <Link to="/" onClick={onClose} className="text-lg font-bold text-brand-600">
            {APP_NAME}
          </Link>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <Home className="h-4 w-4" /> Home
          </NavLink>
          <NavLink to="/restaurants" className={linkClass} onClick={onClose}>
            <Store className="h-4 w-4" /> Restaurants
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/orders" className={linkClass} onClick={onClose}>
                <Package className="h-4 w-4" /> Orders
              </NavLink>
              <NavLink to="/favorites" className={linkClass} onClick={onClose}>
                <Heart className="h-4 w-4" /> Favorites
              </NavLink>
              <NavLink to="/payments" className={linkClass} onClick={onClose}>
                <CreditCard className="h-4 w-4" /> Payments
              </NavLink>
              <NavLink to="/profile" className={linkClass} onClick={onClose}>
                <User className="h-4 w-4" /> Profile
              </NavLink>
              {(user?.role === ROLES.RESTAURANT_ADMIN || user?.role === ROLES.ADMIN) && (
                <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </NavLink>
              )}
            </>
          )}
        </nav>
        <div className="border-t border-slate-100 p-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          ) : (
            <div className="grid gap-2">
              <Link to="/login" onClick={onClose} className="btn-secondary w-full text-center">
                Log in
              </Link>
              <Link to="/register" onClick={onClose} className="btn-primary w-full text-center">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
