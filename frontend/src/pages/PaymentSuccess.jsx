import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { getErrorMessage } from '../utils/formatPrice';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const sessionId = params.get('session_id');
  const method = params.get('method');
  const [status, setStatus] = useState(sessionId ? 'confirming' : 'ready');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        await paymentService.confirmCheckout({ sessionId });
        if (!cancelled) setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(getErrorMessage(err, 'Could not confirm Stripe payment'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === 'confirming') {
    return (
      <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
        <div className="card max-w-lg w-full p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-brand-600" />
          <h1 className="text-xl font-bold text-slate-900">Confirming Stripe payment…</h1>
          <p className="mt-2 text-sm text-slate-500">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
        <div className="card max-w-lg w-full p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Payment confirmation issue</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {orderId && (
              <Link to={`/orders/${orderId}`} className="btn-primary">
                View order
              </Link>
            )}
            <Link to="/checkout" className="btn-secondary">
              Back to checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCod = method === 'cod';

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isCod ? 'Order confirmed' : 'Payment successful'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isCod
            ? 'Pay when your order arrives. We’ll notify you as it progresses.'
            : 'Your Stripe payment is confirmed. We’ll notify you as the order progresses.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn-primary">
              Track order
            </Link>
          )}
          <Link to="/orders" className="btn-secondary">
            View orders
          </Link>
          <Link to="/restaurants" className="btn-ghost">
            Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
