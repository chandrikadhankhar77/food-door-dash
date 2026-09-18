import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import StarRating from './StarRating';
import { reviewService } from '../../services/reviewService';
import { getErrorMessage } from '../../utils/formatPrice';

export default function ReviewForm({ restaurantId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating || !deliveryRating) {
      toast.error('Please rate food and delivery');
      return;
    }
    setLoading(true);
    try {
      await reviewService.create({
        restaurantId,
        orderId,
        rating,
        deliveryRating,
        comment,
      });
      toast.success('Review submitted for moderation');
      setComment('');
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit review'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-base font-semibold text-slate-900">Leave a review</h3>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Food & restaurant</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Delivery experience</p>
        <StarRating value={deliveryRating} onChange={setDeliveryRating} size="lg" />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="How was the food and delivery?"
        className="input-field resize-none"
      />
      <Button type="submit" loading={loading}>
        Submit review
      </Button>
    </form>
  );
}
