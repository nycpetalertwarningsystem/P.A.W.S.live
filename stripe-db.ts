/**
 * Stripe Database Helpers
 * Functions for managing Stripe customer and subscription records
 */

import { getDb } from "./db";
import {
  stripeCustomers,
  stripeSubscriptions,
  stripePaymentIntents,
  InsertStripeCustomer,
  InsertStripeSubscription,
  InsertStripePaymentIntent,
} from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Get or create a Stripe customer record
 */
export async function getOrCreateStripeCustomer(
  userId: number,
  stripeCustomerId: string,
  email: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const newCustomer: InsertStripeCustomer = {
    userId,
    stripeCustomerId,
    email,
  };

  await db.insert(stripeCustomers).values(newCustomer);
  const result = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);
  return result[0];
}

/**
 * Get Stripe customer by user ID
 */
export async function getStripeCustomerByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a Stripe subscription record
 */
export async function createStripeSubscription(
  data: InsertStripeSubscription
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(stripeSubscriptions).values(data);
  const result = await db
    .select()
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.stripeSubscriptionId, data.stripeSubscriptionId))
    .limit(1);
  return result[0];
}

/**
 * Get active subscription for user
 */
export async function getActiveSubscriptionForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.userId, userId),
        inArray(stripeSubscriptions.status, ["active", "past_due"])
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(stripeSubscriptions)
    .set({
      status,
      currentPeriodStart,
      currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(
      eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId)
    );

  const result = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId)
    )
    .limit(1);

  return result[0];
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(stripeSubscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId)
    );

  const result = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId)
    )
    .limit(1);

  return result[0];
}

/**
 * Create payment intent record
 */
export async function createPaymentIntent(
  data: InsertStripePaymentIntent
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(stripePaymentIntents).values(data);
  const result = await db
    .select()
    .from(stripePaymentIntents)
    .where(
      eq(stripePaymentIntents.stripePaymentIntentId, data.stripePaymentIntentId)
    )
    .limit(1);
  return result[0];
}

/**
 * Update payment intent status
 */
export async function updatePaymentIntentStatus(
  stripePaymentIntentId: string,
  status: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(stripePaymentIntents)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      eq(stripePaymentIntents.stripePaymentIntentId, stripePaymentIntentId)
    );

  const result = await db
    .select()
    .from(stripePaymentIntents)
    .where(
      eq(stripePaymentIntents.stripePaymentIntentId, stripePaymentIntentId)
    )
    .limit(1);

  return result[0];
}

/**
 * Get payment history for user
 */
export async function getPaymentHistoryForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(stripePaymentIntents)
    .where(eq(stripePaymentIntents.userId, userId));

  return result;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId)
    )
    .limit(1);

  return result[0] || null;
}
