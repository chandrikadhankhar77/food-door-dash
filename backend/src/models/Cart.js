import mongoose from 'mongoose';

const cartAddOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addOns: [cartAddOnSchema],
    specialInstructions: { type: String, trim: true, maxlength: 300 },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.virtual('subtotal').get(function calcSubtotal() {
  return this.items.reduce((sum, item) => {
    const addOnTotal = (item.addOns || []).reduce((a, x) => a + x.price, 0);
    return sum + (item.price + addOnTotal) * item.quantity;
  }, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
