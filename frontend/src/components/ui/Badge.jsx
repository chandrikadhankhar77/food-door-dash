const tones = {
  brand: 'bg-brand-100 text-brand-800',
  slate: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-800',
  info: 'bg-sky-100 text-sky-800',
};

export default function Badge({ children, tone = 'brand', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.brand} ${className}`}
    >
      {children}
    </span>
  );
}
