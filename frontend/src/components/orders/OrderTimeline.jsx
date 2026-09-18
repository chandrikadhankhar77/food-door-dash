import { Check } from 'lucide-react';
import { ORDER_STATUSES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatPrice';

export default function OrderTimeline({ status, statusHistory = [] }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
        This order was cancelled.
        {statusHistory?.length > 0 && (
          <p className="mt-1 text-xs text-rose-500">
            {formatDateTime(statusHistory[statusHistory.length - 1]?.at)}
          </p>
        )}
      </div>
    );
  }

  const currentIndex = ORDER_STATUSES.findIndex((s) => s.key === status);

  const historyMap = Object.fromEntries(
    (statusHistory || []).map((h) => [h.status, h])
  );

  return (
    <ol className="space-y-0">
      {ORDER_STATUSES.map((step, index) => {
        const done = currentIndex >= index;
        const current = currentIndex === index;
        const hist = historyMap[step.key];
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  done
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-400'
                } ${current ? 'ring-4 ring-brand-100' : ''}`}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < ORDER_STATUSES.length - 1 && (
                <span
                  className={`my-1 w-0.5 flex-1 min-h-6 ${
                    currentIndex > index ? 'bg-brand-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm font-semibold ${
                  done ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {step.label}
              </p>
              {hist?.at && (
                <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(hist.at)}</p>
              )}
              {hist?.note && (
                <p className="mt-1 text-xs text-slate-400">{hist.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
