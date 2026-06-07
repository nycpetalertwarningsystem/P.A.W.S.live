/**
 * Stripe Webhook Handler
 * Express route for handling Stripe webhook events
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  verifyWebhookSignature,
} from "./stripe-handler";
import { ENV } from "./_core/env";

const stripe = new Stripe(ENV.stripeSecretKey || "");

/**
 * Handle incoming Stripe webhook events
 * This endpoint should be registered with Stripe as the webhook URL
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;
  const body = (req as any).rawBody || "";

  if (!signature) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).json({ error: "Missing signature" });
  }

  // Verify webhook signature
  const event = verifyWebhookSignature(
    body,
    signature,
    ENV.stripeWebhookSecret || ""
  );

  if (!event) {
    console.error("[Stripe Webhook] Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle test events (for testing purposes)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected:", event.type);
    return res.json({ verified: true });
  }

  try {
    // Route event to appropriate handler
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of event
    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to capture raw body for Stripe webhook signature verification
 * This must be applied BEFORE express.json() middleware
 */
export function stripeWebhookMiddleware(req: Request, res: Response, next: Function) {
  if (req.path === "/api/stripe/webhook") {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    next();
  }
}
