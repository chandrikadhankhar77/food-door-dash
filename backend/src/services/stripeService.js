import Stripe from 'stripe';
import ApiError from '../utils/ApiError.js';

let stripeInstance = null;

export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key || key.includes('your_stripe') || key === 'sk_test_dummy') {
    throw new ApiError(
      503,
      'Card payments are not configured. Please choose Cash on Delivery.'
    );
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
};

export const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return Boolean(key && !key.includes('your_stripe') && key !== 'sk_test_dummy');
};

/** Stripe account currency — USD matches this demo's $ prices */
export const getStripeCurrency = () =>
  (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

export const createPaymentIntent = async ({
  amount,
  currency = getStripeCurrency(),
  metadata = {},
  receiptEmail,
  customerId,
}) => {
  try {
    const stripe = getStripe();
    // Most currencies use a 1/100 subunit (cents / paise)
    const amountInSmallest = Math.round(Number(amount) * 100);

    if (amountInSmallest < 50) {
      throw new ApiError(400, 'Amount must be at least 0.50 in your currency');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallest,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
      ...(customerId ? { customer: customerId } : {}),
      setup_future_usage: 'off_session',
      ...(receiptEmail ? { receipt_email: receiptEmail } : {}),
    });

    return paymentIntent;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Never forward Stripe's 401 to client (frontend treats 401 as logout)
    const status = err?.statusCode === 401 || err?.statusCode === 403 ? 503 : 502;
    throw new ApiError(
      status,
      err?.message || 'Card payment failed. Try Cash on Delivery.'
    );
  }
};

/** Hosted Stripe Checkout page (checkout.stripe.com portal) */
export const createCheckoutSession = async ({
  amount,
  currency = getStripeCurrency(),
  metadata = {},
  customerId,
  customerEmail,
  lineItemName,
  successUrl,
  cancelUrl,
}) => {
  try {
    const stripe = getStripe();
    const amountInSmallest = Math.round(Number(amount) * 100);

    if (amountInSmallest < 50) {
      throw new ApiError(400, 'Amount must be at least 0.50 in your currency');
    }

    return await stripe.checkout.sessions.create({
      mode: 'payment',
      ...(customerId ? { customer: customerId } : {}),
      ...(customerEmail && !customerId ? { customer_email: customerEmail } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountInSmallest,
            product_data: {
              name: lineItemName || 'FoodDash order',
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      payment_intent_data: {
        metadata,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const status = err?.statusCode === 401 || err?.statusCode === 403 ? 503 : 502;
    throw new ApiError(
      status,
      err?.message || 'Could not start Stripe Checkout. Try Cash on Delivery.'
    );
  }
};

export const retrieveCheckoutSession = async (sessionId) => {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
};

export const retrievePaymentIntent = async (paymentIntentId) => {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['payment_method'],
  });
};

export const getOrCreateCustomer = async ({ user }) => {
  const stripe = getStripe();
  if (user.stripeCustomerId) {
    try {
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch {
      // recreate below
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: String(user._id) },
  });

  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
};

export const listCustomerPaymentMethods = async (customerId) => {
  const stripe = getStripe();
  const result = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return result.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand || 'card',
    last4: pm.card?.last4 || '****',
    expMonth: pm.card?.exp_month,
    expYear: pm.card?.exp_year,
  }));
};

export const detachPaymentMethod = async (paymentMethodId) => {
  const stripe = getStripe();
  return stripe.paymentMethods.detach(paymentMethodId);
};

export const constructWebhookEvent = (rawBody, signature) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new ApiError(500, 'Stripe webhook secret is not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
};
