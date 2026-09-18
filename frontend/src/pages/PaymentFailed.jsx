import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <XCircle className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Payment failed</h1>
        <p className="mt-2 text-sm text-slate-500">
          Something went wrong with your payment. You can try again or contact support.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/checkout" className="btn-primary">
            Try again
          </Link>
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn-secondary">
              View order
            </Link>
          )}
          <Link to="/" className="btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
