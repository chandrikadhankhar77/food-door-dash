import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderCard from '../components/orders/OrderCard';
import EmptyState from '../components/ui/EmptyState';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../utils/formatPrice';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await orderService.list();
        if (!alive) return;
        setOrders(Array.isArray(data) ? data : data?.orders || data?.items || []);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load orders'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your orders</h1>
          <p className="text-sm text-slate-500">Track past and current deliveries</p>
        </div>
        <PageCloseButton fallbackTo="/" label="Close orders" />
      </div>

      {loading ? (
        <Spinner />
      ) : !orders.length ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will show up here."
          actionLabel="Find restaurants"
          onAction={() => {
            window.location.href = '/restaurants';
          }}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
