import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LiveTrackingMap from '../components/orders/LiveTrackingMap';
import OrderTimeline from '../components/orders/OrderTimeline';
import ReviewForm from '../components/reviews/ReviewForm';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { useSocket } from '../context/SocketContext';
import { orderService } from '../services/orderService';
import { ORDER_STATUS_COLORS } from '../utils/constants';
import { formatDateTime, formatPrice, getErrorMessage } from '../utils/formatPrice';
import { progressForStatus } from '../utils/tracking';

export default function OrderDetails() {
  const { id } = useParams();
  const { joinOrder, leaveOrder, on } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await orderService.getById(id);
      setOrder(data?.order || data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Order not found'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    joinOrder(id);
    const off = on('order:status', (payload) => {
      if (String(payload.orderId) === String(id)) {
        setOrder((prev) => {
          if (!prev) return prev;
          const nextTracking = payload.tracking
            ? payload.tracking
            : prev.tracking
              ? {
                  ...prev.tracking,
                  progress: progressForStatus(payload.status),
                }
              : prev.tracking;
          return {
            ...prev,
            status: payload.status,
            paymentStatus: payload.paymentStatus || prev.paymentStatus,
            statusHistory: payload.statusHistory || prev.statusHistory,
            tracking: nextTracking,
          };
        });
        toast.success(`Order update: ${String(payload.status).replace(/_/g, ' ')}`);
      }
    });
    return () => {
      leaveOrder(id);
      off?.();
    };
  }, [id, joinOrder, leaveOrder, on]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const data = await orderService.cancel(id);
      setOrder(data?.order || data);
      toast.success('Order cancelled');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="container-app py-16">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-app py-10 text-center">
        <p className="text-slate-500">Order not found.</p>
        <Link to="/orders" className="btn-primary mt-4 inline-flex">
          Back to orders
        </Link>
      </div>
    );
  }

  const statusClass = ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700';
  const canReview = order.status === 'delivered';
  const canCancel = !['delivered', 'cancelled', 'out_for_delivery'].includes(order.status);

  return (
    <div className="container-app space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Order #{String(order._id).slice(-8)}</p>
          <h1 className="text-3xl font-bold text-slate-900">
            {order.restaurant?.name || 'Restaurant'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {String(order.status).replace(/_/g, ' ')}
          </span>
          <Badge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
            {order.paymentStatus || 'pending'}
          </Badge>
          <PageCloseButton fallbackTo="/orders" label="Close order details" />
        </div>
      </div>

      {order.status !== 'cancelled' && <LiveTrackingMap order={order} />}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
            <ul className="space-y-3">
              {(order.items || []).map((item) => (
                <li key={item._id || item.name} className="flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.quantity}× {item.name}
                    </p>
                    {(item.addOns || []).length > 0 && (
                      <p className="text-xs text-slate-500">
                        {item.addOns.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">
                    {formatPrice(
                      (Number(item.price) +
                        (item.addOns || []).reduce((s, a) => s + Number(a.price || 0), 0)) *
                        Number(item.quantity)
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-brand-700">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="card space-y-2 p-5 text-sm">
            <h2 className="text-lg font-semibold text-slate-900">Delivery</h2>
            <p>
              {order.deliveryAddress?.street}, {order.deliveryAddress?.city},{' '}
              {order.deliveryAddress?.state} {order.deliveryAddress?.zip}
            </p>
            <p className="text-slate-500">
              {order.deliveryType === 'scheduled'
                ? `Scheduled ${order.scheduledDate} ${order.scheduledTime} (${order.deliveryWindow || 'window'})`
                : 'Deliver now'}
            </p>
            {order.estimatedDeliveryAt && (
              <p className="font-medium text-indigo-700">
                Estimated delivery: {formatDateTime(order.estimatedDeliveryAt)}
              </p>
            )}
            {order.promoCode && (
              <p className="text-emerald-700">
                Promo {order.promoCode}
                {order.discountAmount
                  ? ` (−${formatPrice(order.discountAmount)})`
                  : ''}
              </p>
            )}
            {order.specialInstructions && (
              <p className="italic text-slate-500">“{order.specialInstructions}”</p>
            )}
            {canCancel && (
              <Button variant="danger" className="mt-3" onClick={cancel}>
                Cancel order
              </Button>
            )}
          </section>

          {canReview && (
            <ReviewForm
              restaurantId={order.restaurant?._id || order.restaurant}
              orderId={order._id}
            />
          )}
        </div>

        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Status timeline</h2>
          <OrderTimeline status={order.status} statusHistory={order.statusHistory} />
        </section>
      </div>
    </div>
  );
}
