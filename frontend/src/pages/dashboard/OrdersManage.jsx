import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useSocket } from '../../context/SocketContext';
import { dashboardService } from '../../services/dashboardService';
import { ORDER_STATUSES, ORDER_STATUS_COLORS } from '../../utils/constants';
import { formatDateTime, formatPrice, getErrorMessage } from '../../utils/formatPrice';

const nextStatuses = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function OrdersManage() {
  const { on } = useSocket();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.listOrders({
        status: statusFilter || undefined,
      });
      setOrders(
        Array.isArray(data) ? data : data?.items || data?.orders || []
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
    return on('order:status', (payload) => {
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id) === String(payload.orderId)
            ? {
                ...o,
                status: payload.status,
                statusHistory: payload.statusHistory || o.statusHistory,
              }
            : o
        )
      );
    });
  }, [on]);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const data = await dashboardService.updateOrderStatus(orderId, { status });
      const updated = data?.order || data;
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, ...updated } : o))
      );
      toast.success(`Marked as ${status.replace(/_/g, ' ')}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500">Update status as kitchen progresses</p>
        </div>
        <select
          className="input-field w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : !orders.length ? (
        <EmptyState title="No orders" description="Incoming orders will appear here." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const actions = nextStatuses[order.status] || [];
            const statusClass =
              ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700';
            return (
              <article key={order._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      #{String(order._id).slice(-8)} · {formatDateTime(order.createdAt)}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {order.user?.name?.trim() || 'Guest diner'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {order.items?.length || 0} items · {formatPrice(order.total)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                    {String(order.status).replace(/_/g, ' ')}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {(order.items || []).map((item) => (
                    <li key={item._id || item.name}>
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>
                {actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === 'cancelled' ? 'danger' : 'primary'}
                        loading={updatingId === order._id}
                        onClick={() => updateStatus(order._id, status)}
                      >
                        Mark {status.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
