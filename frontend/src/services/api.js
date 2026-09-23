import axios from 'axios';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthAttempt =
      url.includes('/auth/login') || url.includes('/auth/register');

    // Only treat auth-route 401 as session expiry — never Stripe/payment noise
    const isPaymentCall = url.includes('/payments/');
    if (status === 401 && !isAuthAttempt && !isPaymentCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        const redirect = encodeURIComponent(path + window.location.search);
        window.location.href = `/login?redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
