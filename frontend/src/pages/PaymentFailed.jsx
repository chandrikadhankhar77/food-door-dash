import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const REASON_COPY = {
  canceled: {
    title: 'Payment canceled',
    body: 'You left Stripe before completing payment. Your order is still unpaid — try again or choose Cash on Delivery.',
  },
  stripe: {
    title: 'Card payment failed',
    body: 'Stripe could not complete this payment. Check your card details or try Cash on Delivery.',
  },
  cod: {
    title: 'Cash on Delivery failed',
    body: 'We could not confirm Cash on Delivery for this order. Please try again from checkout.',
  },
  config: {
    title: 'Online payments unavailable',
    body: 'Card payments are not configured right now. Use Cash on Delivery or try again later.',
  },
  network: {
    title: 'Connection problem',
    body: 'We lost connection while processing payment. Check your internet and try again.',
  },
  default: {
    title: 'Payment failed',
    body: 'Something went wrong with your payment. You can try again or contact support.',
  },
};

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const reasonKey = (params.get('reason') || 'default').toLowerCase();
  const detail = params.get('message') || '';
  const copy = REASON_COPY[reasonKey] || REASON_COPY.default;

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <XCircle className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{copy.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{copy.body}</p>
        {detail && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-left text-xs text-rose-800">
            {detail}
          </p>
        )}
        {orderId && (
          <p className="mt-3 text-xs text-slate-400">Order ID: {orderId}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={
              orderId
                ? `/payment/pending?orderId=${orderId}`
                : '/checkout'
            }
            className="btn-primary"
          >
            Try payment again
          </Link>
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn-secondary">
              View order
            </Link>
          )}
          <Link to="/cart" className="btn-ghost">
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
