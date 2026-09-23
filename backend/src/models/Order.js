import mongoose from 'mongoose';

const orderAddOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    addOns: [orderAddOnSchema],
    specialInstructions: { type: String, trim: true },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must have at least one item'],
    },
    deliveryAddress: {
      label: String,
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    deliveryType: {
      type: String,
      enum: ['now', 'scheduled'],
      default: 'now',
    },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    deliveryWindow: { type: String },
    estimatedDeliveryAt: { type: Date, default: null },
    promoCode: { type: String, trim: true, uppercase: true, default: '' },
    discountAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    specialInstructions: { type: String, trim: true, maxlength: 500 },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: 'pending', at: new Date(), note: 'Order created' }],
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
