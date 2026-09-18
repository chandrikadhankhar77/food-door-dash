import { body, param } from 'express-validator';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import {
  createPaymentIntent,
  createCheckoutSession,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  constructWebhookEvent,
  getOrCreateCustomer,
  listCustomerPaymentMethods,
  detachPaymentMethod,
  isStripeConfigured,
  getStripeCurrency,
} from '../services/stripeService.js';
import { createNotification } from '../services/notificationService.js';
import { emitOrderStatus, getIO } from '../sockets/orderSocket.js';

export const createIntentValidators = [
  body('orderId').isMongoId().withMessage('Valid order id is required'),
];

export const createCheckoutValidators = [
  body('orderId').isMongoId().withMessage('Valid order id is required'),
];

export const codValidators = [
  body('orderId').isMongoId().withMessage('Valid order id is required'),
];

const markOrderPaid = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;

  let payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (!payment) {
    payment = await Payment.create({
      user: order.user,
      order: order._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'paid',
      receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || '',
    });
  } else {
    payment.status = 'paid';
    payment.receiptUrl =
      paymentIntent.charges?.data?.[0]?.receipt_url || payment.receiptUrl;
    await payment.save();
  }

  order.paymentStatus = 'paid';
  order.payment = payment._id;
  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      at: new Date(),
      note: 'Payment confirmed',
    });
  }
  await order.save();

  const io = getIO();
  emitOrderStatus(io, order);
  await createNotification({
    userId: order.user,
    title: 'Payment successful',
    message: `Payment for order ${order._id} was successful`,
    type: 'payment',
    relatedOrder: order._id,
    io,
  });

  return { order, payment };
};

export const getConfig = asyncHandler(async (req, res) => {
  const configured = isStripeConfigured();
  res.json({
    success: true,
    message: 'Payment config',
    data: {
      publishableKey: configured
        ? process.env.STRIPE_PUBLISHABLE_KEY || ''
        : '',
      stripeEnabled: configured,
      methods: configured ? ['cod', 'card'] : ['cod'],
      currency: getStripeCurrency(),
    },
  });
});

export const payWithCod = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized for this order');
  }
  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Order is already paid');
  }
  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Cannot pay for a cancelled order');
  }

  const codId = `cod_${order._id}_${Date.now()}`;
  let payment = await Payment.findOne({ order: order._id, method: 'cod' });
  if (payment) {
    payment.stripePaymentIntentId = codId;
    payment.amount = order.total;
    payment.currency = getStripeCurrency();
    payment.status = 'pending';
    await payment.save();
  } else {
    payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      stripePaymentIntentId: codId,
      method: 'cod',
      amount: order.total,
      currency: getStripeCurrency(),
      status: 'pending',
    });
  }

  order.payment = payment._id;
  order.paymentStatus = 'pending';
  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      at: new Date(),
      note: 'Order confirmed · Cash on Delivery',
    });
  }
  await order.save();

  const io = getIO();
  emitOrderStatus(io, order);
  await createNotification({
    userId: order.user,
    title: 'Order confirmed',
    message: `Your order will be paid on delivery (${order.total})`,
    type: 'order',
    relatedOrder: order._id,
    io,
  });

  res.json({
    success: true,
    message: 'Cash on Delivery selected',
    data: { order, payment },
  });
});

export const createIntent = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId).populate('user', 'email');
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized for this order');
  }

  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Order is already paid');
  }

  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Cannot pay for a cancelled order');
  }

  if (!isStripeConfigured()) {
    throw new ApiError(
      503,
      'Card payments are unavailable. Please choose Cash on Delivery.'
    );
  }

  const user = await User.findById(req.user._id);
  let customerId;
  try {
    customerId = await getOrCreateCustomer({ user });
  } catch (err) {
    throw new ApiError(
      503,
      'Card payments are unavailable. Please choose Cash on Delivery.'
    );
  }

  const paymentIntent = await createPaymentIntent({
    amount: order.total,
    currency: getStripeCurrency(),
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
    receiptEmail: order.user.email,
    customerId,
  });

  let payment = await Payment.findOne({ order: order._id, status: 'pending' });
  if (payment) {
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.amount = order.total;
    payment.method = 'card';
    payment.currency = getStripeCurrency();
    await payment.save();
  } else {
    payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      stripePaymentIntentId: paymentIntent.id,
      method: 'card',
      amount: order.total,
      currency: getStripeCurrency(),
      status: 'pending',
    });
  }

  order.payment = payment._id;
  await order.save();

  res.status(201).json({
    success: true,
    message: 'Payment intent created',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment._id,
      amount: order.total,
    },
  });
});

/** Create Stripe Hosted Checkout Session and return portal URL */
export const createCheckout = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId)
    .populate('user', 'email name')
    .populate('restaurant', 'name');
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized for this order');
  }

  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Order is already paid');
  }

  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Cannot pay for a cancelled order');
  }

  if (!isStripeConfigured()) {
    throw new ApiError(
      503,
      'Card payments are unavailable. Please choose Cash on Delivery.'
    );
  }

  const user = await User.findById(req.user._id);
  let customerId;
  try {
    customerId = await getOrCreateCustomer({ user });
  } catch {
    customerId = undefined;
  }

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  const metadata = {
    orderId: order._id.toString(),
    userId: req.user._id.toString(),
  };

  const session = await createCheckoutSession({
    amount: order.total,
    currency: getStripeCurrency(),
    metadata,
    customerId,
    customerEmail: order.user.email,
    lineItemName: `FoodDash · ${order.restaurant?.name || 'Order'}`,
    successUrl: `${clientUrl}/payment/success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${clientUrl}/checkout?canceled=1&orderId=${order._id}`,
  });

  let payment = await Payment.findOne({ order: order._id, status: 'pending' });
  if (payment) {
    payment.stripePaymentIntentId = session.id;
    payment.amount = order.total;
    payment.method = 'card';
    payment.currency = getStripeCurrency();
    await payment.save();
  } else {
    payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      stripePaymentIntentId: session.id,
      method: 'card',
      amount: order.total,
      currency: getStripeCurrency(),
      status: 'pending',
    });
  }

  order.payment = payment._id;
  await order.save();

  res.status(201).json({
    success: true,
    message: 'Stripe Checkout session created',
    data: {
      url: session.url,
      sessionId: session.id,
      paymentId: payment._id,
      amount: order.total,
    },
  });
});

export const confirmCheckout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) throw new ApiError(400, 'sessionId is required');

  const session = await retrieveCheckoutSession(sessionId);

  if (session.metadata?.userId !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized for this payment');
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw new ApiError(400, `Checkout not completed: ${session.payment_status}`);
  }

  const paymentIntent =
    typeof session.payment_intent === 'object' && session.payment_intent
      ? session.payment_intent
      : session.payment_intent
        ? await retrievePaymentIntent(session.payment_intent)
        : null;

  if (!paymentIntent) {
    // Fallback: mark using session metadata + id
    const orderId = session.metadata?.orderId;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    let payment = await Payment.findOne({
      $or: [
        { stripePaymentIntentId: session.id },
        { order: order._id, method: 'card' },
      ],
    });

    if (!payment) {
      payment = await Payment.create({
        user: order.user,
        order: order._id,
        stripePaymentIntentId: session.id,
        method: 'card',
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || getStripeCurrency(),
        status: 'paid',
      });
    } else {
      payment.status = 'paid';
      payment.stripePaymentIntentId = session.id;
      await payment.save();
    }

    order.paymentStatus = 'paid';
    order.payment = payment._id;
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        at: new Date(),
        note: 'Payment confirmed via Stripe Checkout',
      });
    }
    await order.save();

    const io = getIO();
    emitOrderStatus(io, order);
    await createNotification({
      userId: order.user,
      title: 'Payment successful',
      message: `Payment for order ${order._id} was successful`,
      type: 'payment',
      relatedOrder: order._id,
      io,
    });

    return res.json({
      success: true,
      message: 'Payment confirmed',
      data: { order, payment },
    });
  }

  // Ensure metadata has orderId for markOrderPaid
  if (!paymentIntent.metadata?.orderId && session.metadata?.orderId) {
    paymentIntent.metadata = {
      ...(paymentIntent.metadata || {}),
      orderId: session.metadata.orderId,
      userId: session.metadata.userId,
    };
  }

  // Keep Payment row findable (was stored with session id)
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: session.id },
    { stripePaymentIntentId: paymentIntent.id }
  );

  const result = await markOrderPaid(paymentIntent);
  res.json({
    success: true,
    message: 'Payment confirmed',
    data: result,
  });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) throw new ApiError(400, 'paymentIntentId is required');

  const paymentIntent = await retrievePaymentIntent(paymentIntentId);

  if (paymentIntent.metadata?.userId !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized for this payment');
  }

  if (paymentIntent.status === 'succeeded') {
    const result = await markOrderPaid(paymentIntent);
    return res.json({
      success: true,
      message: 'Payment confirmed',
      data: result,
    });
  }

  if (['canceled', 'requires_payment_method'].includes(paymentIntent.status)) {
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: 'failed' }
    );
    throw new ApiError(400, `Payment not successful: ${paymentIntent.status}`);
  }

  res.json({
    success: true,
    message: 'Payment still processing',
    data: { status: paymentIntent.status },
  });
});

export const paymentHistory = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'order',
        select: 'status total restaurant estimatedDeliveryAt',
        populate: { path: 'restaurant', select: 'name image' },
      }),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Payment history',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const listPaymentMethods = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user?.stripeCustomerId) {
    return res.json({
      success: true,
      message: 'No saved payment methods',
      data: [],
    });
  }

  try {
    const methods = await listCustomerPaymentMethods(user.stripeCustomerId);
    res.json({
      success: true,
      message: 'Saved payment methods',
      data: methods,
    });
  } catch (err) {
    throw new ApiError(400, err.message || 'Could not load payment methods');
  }
});

export const removePaymentMethod = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user?.stripeCustomerId) {
    throw new ApiError(400, 'No Stripe customer on this account');
  }

  const methods = await listCustomerPaymentMethods(user.stripeCustomerId);
  const owns = methods.some((m) => m.id === req.params.id);
  if (!owns) {
    throw new ApiError(403, 'Payment method not found on your account');
  }

  await detachPaymentMethod(req.params.id);
  res.json({
    success: true,
    message: 'Payment method removed',
    data: { id: req.params.id },
  });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) throw new ApiError(400, 'Missing stripe-signature header');

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    throw new ApiError(400, `Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      await markOrderPaid(event.data.object);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: 'failed' }
      );
      if (pi.metadata?.orderId) {
        await Order.findByIdAndUpdate(pi.metadata.orderId, {
          paymentStatus: 'failed',
        });
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

export const idParam = [param('id').isMongoId()];
