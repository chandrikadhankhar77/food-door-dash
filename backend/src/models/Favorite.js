import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    restaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    foodItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem',
      },
    ],
  },
  { timestamps: true }
);

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
