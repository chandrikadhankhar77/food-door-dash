import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { isCustomerRole, isStaffRole } from '../utils/constants';

/**
 * Customer shopping flows only (cart, checkout, favorites, buyer orders).
 * Staff are sent to the partner dashboard instead of the customer window.
 */
export default function CustomerRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Checking permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (isStaffRole(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isCustomerRole(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
