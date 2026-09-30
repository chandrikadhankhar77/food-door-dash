import { useEffect, useState } from 'react';
import {
  ClipboardList,
  DollarSign,
  ExternalLink,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { formatPrice } from '../../utils/formatPrice';

export default function DashboardHome() {
  const { user } = useAuth();
  const outlet = useOutletContext() || {};
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const restaurantId =
    outlet.restaurantId ||
    user?.restaurant?._id ||
    user?.restaurant?.id ||
    (typeof user?.restaurant === 'string' ? user.restaurant : '') ||
    '';

  useEffect(() => {
    dashboardService
      .stats()
      .then((data) => setStats(data?.stats || data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    {
      label: 'Orders today',
      value: stats?.ordersToday ?? stats?.totalOrders ?? 0,
      icon: ClipboardList,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Revenue',
      value: formatPrice(stats?.revenue ?? stats?.totalRevenue ?? 0),
      icon: DollarSign,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Menu items',
      value: stats?.menuItems ?? stats?.totalMenuItems ?? 0,
      icon: UtensilsCrossed,
      tone: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Avg rating',
      value: Number(stats?.rating ?? stats?.avgRating ?? 0).toFixed(1),
      icon: Star,
      tone: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-500">Snapshot of your restaurant performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { to: '/dashboard/orders', title: 'Manage orders', desc: 'Update status in real time' },
          { to: '/dashboard/menu', title: 'Edit menu', desc: 'Categories, prices, availability' },
          { to: '/dashboard/reviews', title: 'Respond to reviews', desc: 'Moderate and reply' },
        ].map((item) => (
          <Link key={item.to + item.title} to={item.to} className="card card-hover p-5">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
          </Link>
        ))}
        <button
          type="button"
          onClick={(e) => outlet.openStorefront?.(e)}
          className="card card-hover p-5 text-left"
        >
          <h3 className="inline-flex items-center gap-2 font-semibold text-slate-900">
            View storefront
            <ExternalLink className="h-4 w-4 text-brand-600" />
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {restaurantId
              ? 'See your restaurant page as customers do'
              : 'Create your restaurant first, then preview it here'}
          </p>
        </button>
      </div>

      {(stats?.recentOrders || []).length > 0 && (
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Recent orders</h3>
          <ul className="divide-y divide-slate-100">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <li key={order._id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-slate-800">
                  #{String(order._id).slice(-6)} · {order.user?.name?.trim() || 'Guest diner'}
                </span>
                <span className="text-slate-500">
                  {order.status?.replace(/_/g, ' ')} · {formatPrice(order.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
