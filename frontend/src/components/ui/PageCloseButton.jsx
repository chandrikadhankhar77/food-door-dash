import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

/**
 * Close / back control — takes user out of the current page.
 * Prefer browser history; fall back to `fallbackTo` (default "/").
 */
export default function PageCloseButton({
  fallbackTo = '/',
  label = 'Close',
  className = '',
}) {
  const navigate = useNavigate();

  const onClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 ${className}`}
    >
      <X className="h-5 w-5" />
    </button>
  );
}
