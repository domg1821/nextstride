import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type Stripe from "npm:stripe@16.12.0";
import {
  errorResponse,
  getAuthenticatedUser,
  getPlanFromPriceId,
  getStripe,
  getSubscriptionRenewalDate,
  jsonResponse,
  mapStripeSubscriptionStatus,
  upsertPremiumSubscription,
} from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId) {
      throw new Error("Missing Stripe checkout session id.");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionUserId =
      session.client_reference_id || session.metadata?.user_id || session.subscription_details?.metadata?.user_id;

    if (!sessionUserId || sessionUserId !== user.id) {
      throw new Error("This checkout session does not belong to the current user.");
    }

    const subscription =
      typeof session.subscription === "object" && session.subscription
        ? (session.subscription as Stripe.Subscription)
        : typeof session.subscription === "string"
          ? await stripe.subscriptions.retrieve(session.subscription)
          : null;

    if (!subscription) {
      throw new Error("Stripe checkout completed without a subscription record.");
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const resolvedPlan =
      (subscription.metadata?.plan_tier &&
      subscription.metadata?.billing_cycle &&
      (subscription.metadata.plan_tier === "pro" || subscription.metadata.plan_tier === "elite") &&
      (subscription.metadata.billing_cycle === "monthly" || subscription.metadata.billing_cycle === "yearly")
        ? {
            plan: subscription.metadata.plan_tier,
            billingCycle: subscription.metadata.billing_cycle,
          }
        : priceId
          ? getPlanFromPriceId(priceId)
          : null);

    if (!resolvedPlan) {
      throw new Error("Unable to map the Stripe subscription to a NextStride plan.");
    }

    const mappedStatus = mapStripeSubscriptionStatus(subscription.status);
    const renewalDate = getSubscriptionRenewalDate(subscription);

    await upsertPremiumSubscription({
      user_id: user.id,
      email: user.email,
      plan_tier: resolvedPlan.plan,
      billing_cycle: resolvedPlan.billingCycle,
      status: mappedStatus,
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
      stripe_subscription_id: subscription.id,
      stripe_checkout_session_id: session.id,
      renewal_date: renewalDate,
    });

    return new Response(
      JSON.stringify({
        subscription: {
          plan_tier: resolvedPlan.plan,
          billing_cycle: resolvedPlan.billingCycle,
          status: mappedStatus,
          renewal_date: renewalDate,
          stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
          stripe_subscription_id: subscription.id,
        },
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("stripe-confirm-session error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
