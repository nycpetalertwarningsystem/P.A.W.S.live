/**
 * Stripe Payment Handler
 * Manages checkout sessions, webhooks, and payment processing
 */

import Stripe from "stripe";
import {
  getOrCreateStripeCustomer,
  getStripeCustomerByUserId,
  createStripeSubscription,
  updateSubscriptionStatus,
  createPaymentIntent,
  updatePaymentIntentStatus,
  getSubscriptionByStripeId,
  cancelSubscription,
} from "./stripe-db";
import { STRIPE_PRODUCTS } from "./stripe-products";
import { ENV } from "./_core/env";

const stripe = new Stripe(ENV.stripeSecretKey || "");

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  userName: string,
  planType: "pet_profile" | "medical_records" | "behavioral_challenges",
  origin: string
) {
  if (!userEmail) {
    throw new Error("User email is required for checkout");
  }

  if (!origin) {
    throw new Error("Origin URL is required for checkout");
  }

  // Get existing Stripe customer or create new one
  let stripeCustomerId: string;
  const existingCustomer = await getStripeCustomerByUserId(userId);

  if (existingCustomer && existingCustomer.stripeCustomerId) {
    stripeCustomerId = existingCustomer.stripeCustomerId;
  } else {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        userId: userId.toString(),
      },
    });
    stripeCustomerId = customer.id;
    // Store the customer ID
    await getOrCreateStripeCustomer(userId, stripeCustomerId, userEmail);
  }

  // Determine product pricing
  let product = STRIPE_PRODUCTS.PET_PROFILE;
  if (planType === "medical_records") {
    product = STRIPE_PRODUCTS.MEDICAL_RECORDS;
  } else if (planType === "behavioral_challenges") {
    product = STRIPE_PRODUCTS.BEHAVIORAL_CHALLENGES;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: product.interval,
            interval_count: 1,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
    client_reference_id: userId.toString(),
    metadata: {
      userId: userId.toString(),
      planType,
      customerEmail: userEmail,
      customerName: userName,
    },
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Handle checkout.session.completed webhook
 */
export async function handleCheckoutSessionCompleted(
  event: Stripe.Event
) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (!session.subscription) {
    console.log("[Stripe] No subscription in checkout session");
    return;
  }

  const userId = parseInt(session.client_reference_id || "0");
  const planType = (session.metadata?.planType as string) || "pet_profile";

  if (!userId) {
    console.error("[Stripe] Invalid user ID in checkout session");
    return;
  }

  // Retrieve subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Store subscription in database
  await createStripeSubscription({
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    planType,
    status: subscription.status as string,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
  });

  console.log(`[Stripe] Subscription created: ${subscription.id} for user ${userId}`);
}

/**
 * Handle customer.subscription.updated webhook
 */
export async function handleSubscriptionUpdated(
  event: Stripe.Event
) {
  const subscription = event.data.object as Stripe.Subscription;

  await updateSubscriptionStatus(
    subscription.id,
    subscription.status as string,
    new Date((subscription as any).current_period_start * 1000),
    new Date((subscription as any).current_period_end * 1000)
  );

  console.log(`[Stripe] Subscription updated: ${subscription.id} -> ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted webhook
 */
export async function handleSubscriptionDeleted(
  event: Stripe.Event
) {
  const subscription = event.data.object as Stripe.Subscription;

  await cancelSubscription(subscription.id);

  console.log(`[Stripe] Subscription cancelled: ${subscription.id}`);
}

/**
 * Handle payment_intent.succeeded webhook
 */
export async function handlePaymentIntentSucceeded(
  event: Stripe.Event
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = parseInt(paymentIntent.metadata?.userId || "0");

  if (!userId) {
    console.log("[Stripe] No user ID in payment intent metadata");
    return;
  }

  await createPaymentIntent({
    userId,
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: (paymentIntent.currency as string) || "usd",
    status: "succeeded",
    planType: paymentIntent.metadata?.planType,
  });

  console.log(`[Stripe] Payment succeeded: ${paymentIntent.id} for user ${userId}`);
}

/**
 * Handle payment_intent.payment_failed webhook
 */
export async function handlePaymentIntentFailed(
  event: Stripe.Event
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = parseInt(paymentIntent.metadata?.userId || "0");

  if (!userId) {
    console.log("[Stripe] No user ID in payment intent metadata");
    return;
  }

  await createPaymentIntent({
    userId,
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: (paymentIntent.currency as string) || "usd",
    status: "failed",
    planType: paymentIntent.metadata?.planType,
  });

  console.log(`[Stripe] Payment failed: ${paymentIntent.id} for user ${userId}`);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("[Stripe] Webhook signature verification failed:", error);
    return null;
  }
}

/**
 * Get customer subscription status
 */
export async function getCustomerSubscriptionStatus(stripeCustomerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return null;
  }

  return subscriptions.data[0];
}

/**
 * Cancel subscription via Stripe
 */
export async function cancelStripeSubscription(stripeSubscriptionId: string) {
  const subscription = await (stripe.subscriptions as any).del(stripeSubscriptionId);
  return subscription;
}

/**
 * Get Stripe customer by ID
 */
export async function getStripeCustomer(stripeCustomerId: string) {
  return await stripe.customers.retrieve(stripeCustomerId);
}
