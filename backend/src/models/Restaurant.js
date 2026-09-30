import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 2000 },
    cuisine: {
      type: [String],
      default: [],
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zip: { type: String, required: true, trim: true },
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    openingHours: { type: String, default: '09:00' },
    closingHours: { type: String, default: '22:00' },
    image: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
      default: '$$',
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    deliveryFee: { type: Number, default: 2.99, min: 0 },
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 'text', description: 'text' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ location: 1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ priceRange: 1 });
restaurantSchema.index({ isFeatured: 1, isActive: 1 });
restaurantSchema.index({ owner: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
