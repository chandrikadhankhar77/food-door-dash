import { MessageSquare, Bike, Utensils } from 'lucide-react';
import StarRating from './StarRating';
import EmptyState from '../ui/EmptyState';
import { formatRelativeTime } from '../../utils/formatPrice';

export default function ReviewList({ reviews = [], loading }) {
  if (loading) {
    return <p className="py-6 text-center text-sm text-slate-500">Loading reviews...</p>;
  }

  if (!reviews.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No reviews yet"
        description="Be the first to share your experience."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review._id} className="card p-4 transition hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {review.user?.name?.trim() || 'Aarav Sharma'}
              </p>
              <p className="text-xs text-slate-400">
                {formatRelativeTime(review.createdAt)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Utensils className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Food</span>
              <StarRating value={review.rating} readOnly size="sm" />
            </div>
            {review.deliveryRating != null && (
              <div className="flex items-center gap-2">
                <Bike className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Delivery</span>
                <StarRating value={review.deliveryRating} readOnly size="sm" />
              </div>
            )}
          </div>
          {review.comment && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
          )}
          {review.adminResponse && (
            <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-semibold text-brand-800">Restaurant reply: </span>
              {review.adminResponse}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
