import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import CustomerRoute from './CustomerRoute';
import StaffAwayFromStorefront from './StaffAwayFromStorefront';
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
import PaymentPending from '../pages/PaymentPending';
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
            <Route
              index
              element={
                <StaffAwayFromStorefront>
                  <Home />
                </StaffAwayFromStorefront>
              }
            />
            <Route
              path="restaurants"
              element={
                <StaffAwayFromStorefront>
                  <Restaurants />
                </StaffAwayFromStorefront>
              }
            />
            <Route
              path="restaurants/:id"
              element={
                <StaffAwayFromStorefront>
                  <RestaurantDetails />
                </StaffAwayFromStorefront>
              }
            />
            <Route
              path="cart"
              element={
                <CustomerRoute>
                  <Cart />
                </CustomerRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <CustomerRoute>
                  <Checkout />
                </CustomerRoute>
              }
            />
            <Route
              path="payment/success"
              element={
                <CustomerRoute>
                  <PaymentSuccess />
                </CustomerRoute>
              }
            />
            <Route
              path="payment-success"
              element={
                <CustomerRoute>
                  <PaymentSuccess />
                </CustomerRoute>
              }
            />
            <Route
              path="payment/pending"
              element={
                <CustomerRoute>
                  <PaymentPending />
                </CustomerRoute>
              }
            />
            <Route
              path="payment-pending"
              element={
                <CustomerRoute>
                  <PaymentPending />
                </CustomerRoute>
              }
            />
            <Route
              path="payment/failed"
              element={
                <CustomerRoute>
                  <PaymentFailed />
                </CustomerRoute>
              }
            />
            <Route
              path="payment-failed"
              element={
                <CustomerRoute>
                  <PaymentFailed />
                </CustomerRoute>
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
                <CustomerRoute>
                  <Orders />
                </CustomerRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <CustomerRoute>
                  <OrderDetails />
                </CustomerRoute>
              }
            />
            <Route
              path="favorites"
              element={
                <CustomerRoute>
                  <Favorites />
                </CustomerRoute>
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
                <CustomerRoute>
                  <PaymentHistory />
                </CustomerRoute>
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
