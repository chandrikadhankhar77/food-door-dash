import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import { ORDER_STATUS_COLORS } from '../../utils/constants';
import { formatDateTime, formatPrice } from '../../utils/formatPrice';

export default function OrderCard({ order }) {
  const restaurantName = order.restaurant?.name || 'Restaurant';
  const statusClass = ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700';

  return (
    <Link
      to={`/orders/${order._id}`}
      className="card card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{restaurantName}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
            {String(order.status || '').replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'} ·{' '}
          {formatDateTime(order.createdAt)}
        </p>
        {order.estimatedDeliveryAt && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <p className="text-xs font-medium text-indigo-600">
            ETA {formatDateTime(order.estimatedDeliveryAt)}
          </p>
        )}
        <p className="text-sm font-semibold text-brand-700">{formatPrice(order.total)}</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
        {order.paymentStatus === 'paid' ? (
          <Badge tone="success">Paid</Badge>
        ) : (
          <Badge tone="warning">{order.paymentStatus || 'pending'}</Badge>
        )}
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
