import { Navigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function RoleRoute({
  children,
  roles = [ROLES.RESTAURANT_ADMIN, ROLES.ADMIN],
}) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Checking permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard" replace />;
  }

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
