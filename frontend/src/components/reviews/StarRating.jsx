import { Star } from 'lucide-react';

export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  readOnly = false,
}) {
  const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  const iconSize = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-1" role={readOnly ? 'img' : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Number(value);
        if (readOnly) {
          return (
            <Star
              key={star}
              className={`${iconSize} ${
                filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              }`}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="rounded p-0.5 transition hover:scale-110"
            aria-label={`${star} star`}
          >
            <Star
              className={`${iconSize} ${
                filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
