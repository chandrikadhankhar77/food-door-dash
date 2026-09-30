export default function Spinner({ className = 'h-8 w-8', label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10" role="status">
      <div
        className={`animate-spin rounded-full border-4 border-brand-200 border-t-brand-600 ${className}`}
      />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
