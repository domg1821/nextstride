import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type Stripe from "npm:stripe@16.12.0";
import {
  errorResponse,
  getPlanFromPriceId,
  getStripe,
  getSubscriptionRenewalDate,
  jsonResponse,
  mapStripeSubscriptionStatus,
  upsertPremiumSubscription,
} from "../_shared/stripe.ts";

function getWebhookSecret() {
  const value = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: STRIPE_WEBHOOK_SECRET");
  }

  return value;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata?.user_id;
  const metadataEmail = subscription.metadata?.user_email;
  const priceId = subscription.items.data[0]?.price?.id;
  const resolvedPlan =
    subscription.metadata?.plan_tier &&
    subscription.metadata?.billing_cycle &&
    (subscription.metadata.plan_tier === "pro" || subscription.metadata.plan_tier === "elite") &&
    (subscription.metadata.billing_cycle === "monthly" || subscription.metadata.billing_cycle === "yearly")
      ? {
          plan: subscription.metadata.plan_tier,
          billingCycle: subscription.metadata.billing_cycle,
        }
      : priceId
        ? getPlanFromPriceId(priceId)
        : null;

  if (!metadataUserId || !metadataEmail || !resolvedPlan) {
    throw new Error("Stripe webhook subscription is missing NextStride metadata.");
  }

  await upsertPremiumSubscription({
    user_id: metadataUserId,
    email: metadataEmail,
    plan_tier: resolvedPlan.plan,
    billing_cycle: resolvedPlan.billingCycle,
    status: mapStripeSubscriptionStatus(subscription.status),
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
    stripe_subscription_id: subscription.id,
    renewal_date: getSubscriptionRenewalDate(subscription),
  });
}

serve(async (request) => {
  if (request.method !== "POST") {
    return errorResponse(new Error("Method not allowed."), 405);
  }

  try {
    const stripe = getStripe();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing Stripe webhook signature.");
    }

    const payload = await request.text();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, getWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadataUserId = session.metadata?.user_id;
        const metadataEmail = session.metadata?.user_email;
        const planTier = session.metadata?.plan_tier;
        const billingCycle = session.metadata?.billing_cycle;

        if (
          metadataUserId &&
          metadataEmail &&
          (planTier === "pro" || planTier === "elite") &&
          (billingCycle === "monthly" || billingCycle === "yearly")
        ) {
          await upsertPremiumSubscription({
            user_id: metadataUserId,
            email: metadataEmail,
            plan_tier: planTier,
            billing_cycle: billingCycle,
            status: session.payment_status === "paid" ? "premium_active" : "upgrade_pending",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
            stripe_checkout_session_id: session.id,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }

    return jsonResponse(200, { received: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
});
