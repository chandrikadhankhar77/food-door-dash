import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    deliveryRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, trim: true, maxlength: 1000 },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminResponse: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, order: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, moderationStatus: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
