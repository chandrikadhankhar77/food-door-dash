import mongoose from 'mongoose';

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const foodItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 1000 },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    image: { type: String, default: '' },
    nutritionalInfo: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
    },
    isVegetarian: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    addOns: [addOnSchema],
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

foodItemSchema.index({ restaurant: 1, category: 1 });
foodItemSchema.index({ name: 'text', description: 'text' });
foodItemSchema.index({ isPopular: 1, isAvailable: 1 });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
export default FoodItem;
