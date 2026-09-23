import { Link, Outlet } from 'react-router-dom';
import { APP_NAME } from '../utils/constants';

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <div className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between p-10 text-white">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              FD
            </span>
            {APP_NAME}
          </Link>
          <div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Delicious food, delivered with care.
            </h1>
            <p className="mt-4 max-w-sm text-slate-200">
              Join thousands of food lovers discovering local restaurants and tracking orders in
              real time.
            </p>
          </div>
          <p className="text-sm text-slate-400">Fresh food · Fast delivery · Secure checkout</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-slate-50 px-4 py-6 lg:overflow-hidden lg:py-4">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-5 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              FD
            </span>
            <span className="text-lg font-bold text-slate-900">{APP_NAME}</span>
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
