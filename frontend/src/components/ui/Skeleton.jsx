export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="card flex gap-4 p-4">
      <Skeleton className="h-24 w-24 shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
