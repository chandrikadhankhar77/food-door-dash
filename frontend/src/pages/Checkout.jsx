import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { promoService } from '../services/promoService';
import { authService } from '../services/authService';
import { DEFAULT_DELIVERY_FEE, TAX_RATE } from '../utils/constants';
import { formatPrice, getErrorMessage } from '../utils/formatPrice';

export default function Checkout() {
  const { user, refreshUser } = useAuth();
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retryOrderId = searchParams.get('orderId') || '';
  const isRetry =
    searchParams.get('retry') === '1' || Boolean(searchParams.get('orderId'));

  const [deliveryType, setDeliveryType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('30');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: true,
  });
  const [order, setOrder] = useState(null);
  const [retryLoading, setRetryLoading] = useState(Boolean(retryOrderId));
  const [retryError, setRetryError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [payMethod, setPayMethod] = useState('card');
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      const oid = searchParams.get('orderId');
      navigate(
        `/payment/failed?reason=canceled${oid ? `&orderId=${oid}` : ''}`,
        { replace: true }
      );
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    paymentService
      .getConfig()
      .then((cfg) => {
        const enabled = Boolean(cfg?.stripeEnabled && cfg?.publishableKey);
        setStripeEnabled(enabled);
        setPayMethod(enabled ? 'card' : 'cod');
      })
      .catch(() => {
        setStripeEnabled(false);
        setPayMethod('cod');
      });
  }, []);

  useEffect(() => {
    if (!retryOrderId) {
      setRetryLoading(false);
      return undefined;
    }

    let cancelled = false;
    setRetryLoading(true);
    setRetryError('');

    (async () => {
      try {
        const data = await orderService.getById(retryOrderId);
        const loaded = data?.order || data;
        if (cancelled) return;

        if (loaded?.paymentStatus === 'paid') {
          navigate(`/payment/success?orderId=${loaded._id}`, { replace: true });
          return;
        }
        if (loaded?.status === 'cancelled') {
          setRetryError('This order was cancelled and cannot be paid.');
          setOrder(null);
          return;
        }

        setOrder(loaded);
        toast.success('Resume payment for your unpaid order');
      } catch (error) {
        if (!cancelled) {
          setRetryError(getErrorMessage(error, 'Could not load order for retry'));
          setOrder(null);
        }
      } finally {
        if (!cancelled) setRetryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryOrderId, navigate]);

  const addresses = user?.addresses || [];

  useEffect(() => {
    if (isRetry && order) return;
    if (!addresses.length) {
      setShowNewAddress(true);
      return;
    }
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    setSelectedAddressId(def?._id || '');
  }, [addresses, isRetry, order]);

  const totals = useMemo(() => {
    if (order) {
      return {
        subtotal: Number(order.subtotal) || 0,
        deliveryFee: Number(order.deliveryFee) || 0,
        discountAmount: Number(order.discountAmount) || 0,
        tax: Number(order.tax) || 0,
        total: Number(order.total) || 0,
        etaMinutes: null,
      };
    }
    const subtotal = cart.subtotal || 0;
    const deliveryFee = cart.restaurant?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
    const discountAmount = Number(appliedPromo?.discountAmount || 0);
    const taxable = Math.max(subtotal - discountAmount, 0);
    const tax = Math.round(taxable * TAX_RATE * 100) / 100;
    const total = Math.round((taxable + Number(deliveryFee) + tax) * 100) / 100;
    const etaMinutes = deliveryType === 'scheduled' ? null : 35;
    return { subtotal, deliveryFee, discountAmount, tax, total, etaMinutes };
  }, [cart, appliedPromo, deliveryType, order]);

  const summaryItems = order?.items || cart.items || [];

  const applyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Enter a promo code');
      return;
    }
    setPromoLoading(true);
    try {
      const data = await promoService.validate({
        code: promoCode.trim(),
        subtotal: cart.subtotal || 0,
      });
      setAppliedPromo(data);
      toast.success(`${data.code} applied (−${formatPrice(data.discountAmount)})`);
    } catch (error) {
      setAppliedPromo(null);
      toast.error(getErrorMessage(error, 'Invalid promo code'));
    } finally {
      setPromoLoading(false);
    }
  };

  const payForOrder = async (orderData) => {
    if (payMethod === 'cod' || !stripeEnabled) {
      try {
        await paymentService.payCod({ orderId: orderData._id });
        toast.success('Order confirmed · pay on delivery');
        navigate(`/payment/success?orderId=${orderData._id}&method=cod`, {
          replace: true,
        });
      } catch (codError) {
        const message = getErrorMessage(codError, 'Cash on Delivery failed');
        toast.error(message);
        navigate(
          `/payment/failed?reason=cod&orderId=${orderData._id}&message=${encodeURIComponent(message)}`
        );
      }
      return;
    }

    // Replace checkout in history with "order placed" so browser Back from Stripe
    // returns here instead of the empty checkout form.
    navigate(`/payment/pending?orderId=${orderData._id}&auto=stripe`, {
      replace: true,
    });
  };

  const resolveAddress = () => {
    if (showNewAddress || !selectedAddressId) {
      return newAddress;
    }
    return addresses.find((a) => a._id === selectedAddressId);
  };

  const placeOrder = async () => {
    if (isRetry && order?._id) {
      setPlacing(true);
      try {
        await payForOrder(order);
      } finally {
        setPlacing(false);
      }
      return;
    }

    const address = resolveAddress();
    if (!address?.street || !address?.city || !address?.state || !address?.zip) {
      toast.error('Please provide a complete delivery address');
      return;
    }
    if (deliveryType === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast.error('Select a date and time for scheduled delivery');
      return;
    }

    setPlacing(true);
    try {
      if (showNewAddress || !selectedAddressId) {
        await authService.addAddress(address);
        await refreshUser();
      }

      const created = await orderService.create({
        deliveryAddress: {
          label: address.label,
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
        },
        deliveryType,
        scheduledDate: deliveryType === 'scheduled' ? scheduledDate : undefined,
        scheduledTime: deliveryType === 'scheduled' ? scheduledTime : undefined,
        deliveryWindow:
          deliveryType === 'scheduled' ? `${deliveryWindow} min window` : undefined,
        specialInstructions,
        promoCode: appliedPromo?.code || promoCode || undefined,
      });

      const orderData = created?.order || created;
      setOrder(orderData);
      await fetchCart();
      await payForOrder(orderData);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not place order');
      toast.error(message);
      navigate(
        `/payment/failed?reason=default&message=${encodeURIComponent(message)}`
      );
    } finally {
      setPlacing(false);
    }
  };

  if (retryLoading) {
    return (
      <div className="container-app flex min-h-[50vh] items-center justify-center py-16">
        <Spinner label="Loading your order…" />
      </div>
    );
  }

  if (isRetry && retryError) {
    return (
      <div className="container-app py-10">
        <EmptyState
          title="Cannot retry this payment"
          description={retryError}
          actionLabel="View orders"
          onAction={() => navigate('/orders')}
        />
      </div>
    );
  }

  if (!isRetry && !cart.items?.length) {
    return (
      <div className="container-app py-10">
        <EmptyState
          title="Nothing to checkout"
          description="Add items to your cart first."
          actionLabel="Browse restaurants"
          onAction={() => navigate('/restaurants')}
        />
      </div>
    );
  }

  if (isRetry && !order) {
    return (
      <div className="container-app py-10">
        <EmptyState
          title="Order not found"
          description="We could not find this order to retry payment."
          actionLabel="View orders"
          onAction={() => navigate('/orders')}
        />
      </div>
    );
  }

  const deliveryAddress = order?.deliveryAddress;

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isRetry ? 'Retry payment' : 'Checkout'}
          </h1>
          {isRetry && order?._id && (
            <p className="mt-1 text-sm text-slate-500">
              Unpaid order {String(order._id).slice(-8)} · choose a payment method below
            </p>
          )}
        </div>
        <PageCloseButton
          fallbackTo={isRetry ? '/orders' : '/cart'}
          label="Close checkout"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {isRetry ? (
            <>
              <section className="card space-y-3 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Delivery details</h2>
                {deliveryAddress ? (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {deliveryAddress.label || 'Address'}
                    </span>
                    <br />
                    {[deliveryAddress.street, deliveryAddress.city, deliveryAddress.state, deliveryAddress.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Address saved on this order.</p>
                )}
                {order?.restaurant?.name && (
                  <p className="text-sm text-slate-600">
                    Restaurant:{' '}
                    <span className="font-semibold text-slate-800">
                      {order.restaurant.name}
                    </span>
                  </p>
                )}
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Your cart was already converted into this order. Complete payment here —
                  you do not need to add items again.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="card space-y-4 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <label
                        key={addr._id}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                          selectedAddressId === addr._id && !showNewAddress
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr._id && !showNewAddress}
                          onChange={() => {
                            setSelectedAddressId(addr._id);
                            setShowNewAddress(false);
                          }}
                        />
                        <span className="text-sm">
                          <span className="font-semibold">{addr.label}</span>
                          <br />
                          {addr.street}, {addr.city}, {addr.state} {addr.zip}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-600"
                  onClick={() => setShowNewAddress(true)}
                >
                  + Add new address
                </button>
                {showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Label"
                      value={newAddress.label}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, label: e.target.value }))
                      }
                    />
                    <Input
                      label="Street"
                      required
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, street: e.target.value }))
                      }
                    />
                    <Input
                      label="City"
                      required
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, city: e.target.value }))
                      }
                    />
                    <Input
                      label="State"
                      required
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, state: e.target.value }))
                      }
                    />
                    <Input
                      label="ZIP"
                      required
                      value={newAddress.zip}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, zip: e.target.value }))
                      }
                    />
                  </div>
                )}
              </section>

              <section className="card space-y-4 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Delivery time</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: 'now', label: 'Deliver now' },
                    { value: 'scheduled', label: 'Schedule' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDeliveryType(opt.value)}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                        deliveryType === opt.value
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {deliveryType === 'scheduled' && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      label="Date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                    <Input
                      label="Time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Window
                      </label>
                      <select
                        className="input-field"
                        value={deliveryWindow}
                        onChange={(e) => setDeliveryWindow(e.target.value)}
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Order notes
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Gate code, leave at door..."
                  />
                </div>
              </section>

              <section className="card space-y-3 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Promo code</h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="e.g. WELCOME15"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setAppliedPromo(null);
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    loading={promoLoading}
                    onClick={applyPromo}
                  >
                    Apply
                  </Button>
                </div>
                {appliedPromo && (
                  <p className="text-sm font-medium text-emerald-700">
                    {appliedPromo.title || appliedPromo.code}: −
                    {formatPrice(appliedPromo.discountAmount)}
                  </p>
                )}
              </section>
            </>
          )}

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayMethod('cod')}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                  payMethod === 'cod'
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Cash on Delivery
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Pay when your order arrives · no Stripe page
                </span>
              </button>
              <button
                type="button"
                onClick={() => stripeEnabled && setPayMethod('card')}
                disabled={!stripeEnabled}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                  payMethod === 'card'
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Pay by Card (Stripe)
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  {stripeEnabled
                    ? 'Opens Stripe secure payment portal'
                    : 'Add Stripe test keys in backend + frontend .env to enable'}
                </span>
              </button>
            </div>
            {stripeEnabled && payMethod === 'card' && (
              <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                After you continue, you will be redirected to Stripe&apos;s payment page
                to enter your card details. You will return here when payment finishes.
              </p>
            )}
            {!stripeEnabled && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Stripe is not configured yet. Use Cash on Delivery for now.
              </p>
            )}
          </section>

          <Button loading={placing} onClick={placeOrder} className="w-full sm:w-auto">
            {payMethod === 'cod'
              ? isRetry
                ? 'Confirm Cash on Delivery'
                : 'Place order (Cash on Delivery)'
              : isRetry
                ? 'Retry Stripe payment'
                : 'Continue to Stripe payment'}
          </Button>
        </div>

        <aside className="card h-fit space-y-3 p-5">
          <h2 className="font-semibold text-slate-900">Summary</h2>
          {summaryItems.map((item) => (
            <div key={item._id || item.name} className="flex justify-between text-sm">
              <span className="text-slate-600">
                {item.quantity}× {item.name}
              </span>
              <span>
                {formatPrice(
                  (Number(item.price) +
                    (item.addOns || []).reduce((s, a) => s + Number(a.price || 0), 0)) *
                    Number(item.quantity)
                )}
              </span>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatPrice(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>−{formatPrice(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span>{formatPrice(totals.deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span>{formatPrice(totals.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-brand-700">{formatPrice(totals.total)}</span>
            </div>
            {totals.etaMinutes && (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
                Estimated delivery ~{totals.etaMinutes} minutes after payment
              </p>
            )}
          </div>
          {!isRetry && (
            <Link to="/cart" className="btn-ghost w-full justify-center text-sm">
              Edit cart
            </Link>
          )}
          {isRetry && (
            <Link to="/orders" className="btn-ghost w-full justify-center text-sm">
              Back to orders
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
