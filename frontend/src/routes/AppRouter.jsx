import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { SocketProvider } from '../context/SocketContext';
import { NotificationProvider } from '../context/NotificationContext';

import Home from '../pages/Home';
import Restaurants from '../pages/Restaurants';
import RestaurantDetails from '../pages/RestaurantDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentFailed from '../pages/PaymentFailed';
import Profile from '../pages/Profile';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';
import Favorites from '../pages/Favorites';
import Notifications from '../pages/Notifications';
import PaymentHistory from '../pages/PaymentHistory';
import DashboardHome from '../pages/dashboard/DashboardHome';
import RestaurantManage from '../pages/dashboard/RestaurantManage';
import MenuManage from '../pages/dashboard/MenuManage';
import OrdersManage from '../pages/dashboard/OrdersManage';
import ReviewsManage from '../pages/dashboard/ReviewsManage';
import Settings from '../pages/dashboard/Settings';

function Providers({ children }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <CartProvider>{children}</CartProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="restaurants" element={<Restaurants />} />
            <Route path="restaurants/:id" element={<RestaurantDetails />} />
            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment/failed"
              element={
                <ProtectedRoute>
                  <PaymentFailed />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment-failed"
              element={
                <ProtectedRoute>
                  <PaymentFailed />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          <Route
            path="dashboard"
            element={
              <RoleRoute>
                <DashboardLayout />
              </RoleRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="restaurant" element={<RestaurantManage />} />
            <Route path="menu" element={<MenuManage />} />
            <Route path="orders" element={<OrdersManage />} />
            <Route path="reviews" element={<ReviewsManage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Providers>
    </BrowserRouter>
  );
}
