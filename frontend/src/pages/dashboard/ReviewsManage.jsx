import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StarRating from '../../components/reviews/StarRating';
import { dashboardService } from '../../services/dashboardService';
import { formatRelativeTime, getErrorMessage } from '../../utils/formatPrice';

export default function ReviewsManage() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.listReviews({
        moderationStatus: filter || undefined,
      });
      setReviews(
        Array.isArray(data) ? data : data?.items || data?.reviews || []
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const respond = async (id) => {
    const adminResponse = responses[id]?.trim();
    if (!adminResponse) {
      toast.error('Write a response first');
      return;
    }
    setBusyId(id);
    try {
      await dashboardService.respondToReview(id, { adminResponse });
      toast.success('Response saved');
      setResponses((r) => ({ ...r, [id]: '' }));
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const moderate = async (id, status) => {
    setBusyId(id);
    try {
      await dashboardService.moderateReview(id, { status });
      toast.success(`Review ${status}`);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
          <p className="text-sm text-slate-500">
            Moderate feedback and reply to customers for your restaurant
          </p>
        </div>
        <select
          className="input-field w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : !reviews.length ? (
        <EmptyState title="No reviews" description="Customer reviews will show up here." />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review._id} className="card space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {review.user?.name?.trim() || 'Aarav Sharma'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatRelativeTime(review.createdAt)} · {review.moderationStatus}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-500">Food</span>
                    <StarRating value={review.rating} readOnly size="sm" />
                  </div>
                  {review.deliveryRating != null && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-slate-500">Delivery</span>
                      <StarRating value={review.deliveryRating} readOnly size="sm" />
                    </div>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600">{review.comment}</p>
              )}
              {review.adminResponse && (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <strong>Your reply:</strong> {review.adminResponse}
                </p>
              )}

              {review.moderationStatus === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    loading={busyId === review._id}
                    onClick={() => moderate(review._id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    loading={busyId === review._id}
                    onClick={() => moderate(review._id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="Write a public reply..."
                  value={responses[review._id] || ''}
                  onChange={(e) =>
                    setResponses((r) => ({ ...r, [review._id]: e.target.value }))
                  }
                />
                <Button
                  variant="secondary"
                  loading={busyId === review._id}
                  onClick={() => respond(review._id)}
                >
                  Reply
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
