import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CartDrawer from '../components/cart/CartDrawer';
import { useAuth } from '../context/AuthContext';
import { isCustomerRole } from '../utils/constants';

export default function MainLayout() {
  const { user, isAuthenticated } = useAuth();
  const showCustomerCart = isAuthenticated && isCustomerRole(user?.role);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showCustomerCart && <CartDrawer />}
    </div>
  );
}
