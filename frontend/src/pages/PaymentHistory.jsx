import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, ExternalLink, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { paymentService } from '../services/paymentService';
import { formatDateTime, formatPrice, getErrorMessage } from '../utils/formatPrice';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [history, saved] = await Promise.all([
        paymentService.history({ limit: 20 }),
        paymentService.methods().catch(() => []),
      ]);
      const items = Array.isArray(history)
        ? history
        : history?.items || history?.payments || [];
      setPayments(items);
      setMethods(Array.isArray(saved) ? saved : saved?.methods || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load payments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeMethod = async (id) => {
    if (!window.confirm('Remove this saved card?')) return;
    setRemoving(id);
    try {
      await paymentService.removeMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success('Card removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="container-app py-16">
        <Spinner label="Loading payments..." />
      </div>
    );
  }

  return (
    <div className="container-app space-y-8 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Receipts, payment history, and saved payment methods
          </p>
        </div>
        <PageCloseButton fallbackTo="/profile" label="Close payments" />
      </div>

      <section className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">Saved payment methods</h2>
        </div>
        {methods.length === 0 ? (
          <p className="text-sm text-slate-500">
            No cards saved yet. After a successful Stripe checkout, your card can appear here for
            faster future payments.
          </p>
        ) : (
          <ul className="space-y-3">
            {methods.map((method) => (
              <li
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div>
                  <p className="font-medium capitalize text-slate-900">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-xs text-slate-500">
                    Expires {method.expMonth}/{method.expYear}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  loading={removing === method.id}
                  onClick={() => removeMethod(method.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
        </div>

        {!payments.length ? (
          <EmptyState
            title="No payments yet"
            description="Completed checkouts will show up here with receipts."
            actionLabel="Browse restaurants"
            onAction={() => navigate('/restaurants')}
          />
        ) : (
          <ul className="space-y-3">
            {payments.map((payment) => (
              <li key={payment._id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {payment.order?.restaurant?.name || 'Order payment'}
                    </p>
                    <Badge
                      tone={
                        payment.status === 'paid'
                          ? 'success'
                          : payment.status === 'failed'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(payment.createdAt)} · {String(payment.currency || 'usd').toUpperCase()}
                  </p>
                  <p className="text-base font-bold text-brand-700">
                    {formatPrice(payment.amount)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {payment.order?._id && (
                    <Link to={`/orders/${payment.order._id}`} className="btn-secondary text-sm">
                      View order
                    </Link>
                  )}
                  {payment.receiptUrl && (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost inline-flex items-center gap-1 text-sm"
                    >
                      Receipt <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

      </section>
    </div>
  );
}
