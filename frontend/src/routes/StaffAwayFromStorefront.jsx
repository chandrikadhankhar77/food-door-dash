import { Navigate, useLocation, useParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { isStaffRole } from '../utils/constants';

function restaurantIdOf(user) {
  const r = user?.restaurant;
  if (!r) return '';
  if (typeof r === 'string' || typeof r === 'number') return String(r);
  const id = r._id || r.id;
  return id ? String(id) : '';
}

/**
 * Public storefront pages (home, browse restaurants). Guests and customers OK.
 * Staff stay in the dashboard window, except they may preview their own
 * restaurant page at /restaurants/:theirRestaurantId.
 */
export default function StaffAwayFromStorefront({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading..." />
      </div>
    );
  }

  if (isAuthenticated && isStaffRole(user?.role)) {
    const path = location.pathname;
    const ownId = restaurantIdOf(user);
    const routeId = String(params.id || path.split('/')[2] || '');
    const viewingOwnStore =
      Boolean(ownId) &&
      path.startsWith('/restaurants/') &&
      routeId === ownId;

    // No restaurant linked yet → send partners to setup, not customer home
    if (!ownId && (path === '/' || path.startsWith('/restaurants'))) {
      return <Navigate to="/dashboard/restaurant" replace />;
    }

    if (path === '/' || path === '/restaurants' || path.startsWith('/restaurants/')) {
      if (!viewingOwnStore) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}
