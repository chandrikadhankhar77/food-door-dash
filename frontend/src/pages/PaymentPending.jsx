import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, CreditCard, Banknote, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { formatPrice, getErrorMessage } from '../utils/formatPrice';

export default function PaymentPending() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get('orderId');
  const autoPay = params.get('auto') === 'stripe';
  const reason = params.get('reason');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const autoStarted = useRef(false);

  useEffect(() => {
    paymentService
      .getConfig()
      .then((cfg) => setStripeEnabled(Boolean(cfg?.stripeEnabled && cfg?.publishableKey)))
      .catch(() => setStripeEnabled(false));
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Missing order id');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await orderService.getById(orderId);
        const loaded = data?.order || data;
        if (cancelled) return;

        if (loaded?.paymentStatus === 'paid') {
          navigate(`/payment/success?orderId=${loaded._id}`, { replace: true });
          return;
        }
        if (loaded?.status === 'cancelled') {
          setError('This order was cancelled.');
          setOrder(null);
          return;
        }

        setOrder(loaded);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Could not load your order'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  const startStripe = async () => {
    if (!order?._id) return;
    setPaying(true);
    try {
      const session = await paymentService.createCheckoutSession({
        orderId: order._id,
        returnOrigin: window.location.origin,
      });
      const checkoutUrl = session?.url;
      if (!checkoutUrl) {
        throw new Error('Could not open Stripe payment page.');
      }
      toast.success('Opening Stripe secure payment…');
      // assign keeps this pending page in history so browser Back returns here
      window.location.assign(checkoutUrl);
    } catch (err) {
      const message = getErrorMessage(err, 'Could not start Stripe payment');
      toast.error(message);
      setError(message);
      setPaying(false);
    }
  };

  const payCod = async () => {
    if (!order?._id) return;
    setPaying(true);
    try {
      await paymentService.payCod({ orderId: order._id });
      toast.success('Order confirmed · pay on delivery');
      navigate(`/payment/success?orderId=${order._id}&method=cod`, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Cash on Delivery failed');
      toast.error(message);
      navigate(
        `/payment/failed?reason=cod&orderId=${order._id}&message=${encodeURIComponent(message)}`
      );
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (!autoPay || !stripeEnabled || !order?._id || autoStarted.current || paying) {
      return undefined;
    }
    const autoKey = `fooddash_stripe_auto_${order._id}`;
    if (sessionStorage.getItem(autoKey) === '1') {
      // Already sent to Stripe once this tab session — stay on "order placed"
      const next = new URL(window.location.href);
      next.searchParams.delete('auto');
      window.history.replaceState(null, '', `${next.pathname}${next.search}`);
      return undefined;
    }
    autoStarted.current = true;
    sessionStorage.setItem(autoKey, '1');
    // Drop auto=stripe from the history entry BEFORE leaving for Stripe.
    // Otherwise browser Back returns here and immediately redirects again.
    const next = new URL(window.location.href);
    next.searchParams.delete('auto');
    window.history.replaceState(null, '', `${next.pathname}${next.search}`);
    startStripe();
    return undefined;
    // intentionally run once when order + stripe are ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPay, stripeEnabled, order?._id]);

  if (loading) {
    return (
      <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
        <Spinner label="Loading your order…" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
        <div className="card max-w-lg w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Order unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/orders" className="btn-primary">
              View orders
            </Link>
            <Link to="/restaurants" className="btn-secondary">
              Browse restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = order?.items || [];

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg w-full p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">
          Your order is placed
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Payment is still pending. Complete it below to confirm with the restaurant.
        </p>

        {reason === 'canceled' && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
            You left Stripe before finishing. Your order is saved — you can pay again anytime.
          </p>
        )}

        {paying && autoPay && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Taking you to Stripe…
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between font-semibold text-slate-800">
            <span>{order?.restaurant?.name || 'Order'}</span>
            <span className="text-brand-700">{formatPrice(order?.total)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Order {String(order?._id || '').slice(-8)} · {order?.paymentStatus || 'pending'} payment
          </p>
          <ul className="mt-3 space-y-1 text-slate-600">
            {items.slice(0, 4).map((item) => (
              <li key={item._id || item.name}>
                {item.quantity}× {item.name}
              </li>
            ))}
            {items.length > 4 && (
              <li className="text-xs text-slate-400">+{items.length - 4} more items</li>
            )}
          </ul>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>
        )}

        <div className="mt-6 space-y-3">
          <Button
            className="w-full"
            loading={paying}
            disabled={!stripeEnabled}
            onClick={startStripe}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {stripeEnabled ? 'Pay with Stripe' : 'Stripe unavailable'}
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            loading={paying}
            onClick={payCod}
          >
            <Banknote className="mr-2 h-4 w-4" />
            Pay Cash on Delivery instead
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={`/orders/${order?._id}`} className="btn-ghost w-full justify-center text-sm">
              View order
            </Link>
            <Link to="/orders" className="btn-ghost w-full justify-center text-sm">
              All orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
