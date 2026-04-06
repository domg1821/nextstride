import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  errorResponse,
  getAbsoluteCancelUrl,
  getAbsoluteSuccessUrl,
  getAuthenticatedUser,
  getPriceId,
  getStripe,
  isBillingCycle,
  isPaidPlan,
  jsonResponse,
  upsertPremiumSubscription,
} from "../_shared/stripe.ts";

serve(async (request) => {
  if (request.method !== "POST") {
    return errorResponse(new Error("Method not allowed."), 405);
  }

  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const plan = body?.plan;
    const billingCycle = body?.billingCycle;
    const successUrl = typeof body?.successUrl === "string" ? body.successUrl.trim() : "";
    const cancelUrl = typeof body?.cancelUrl === "string" ? body.cancelUrl.trim() : "";

    if (!isPaidPlan(plan)) {
      throw new Error("Invalid premium plan.");
    }

    if (!isBillingCycle(billingCycle)) {
      throw new Error("Invalid billing cycle.");
    }

    if (!successUrl || !cancelUrl) {
      throw new Error("Missing success or cancel URL for Stripe checkout.");
    }

    const stripe = getStripe();
    const priceId = getPriceId(plan, billingCycle);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: false,
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: getAbsoluteSuccessUrl(successUrl),
      cancel_url: getAbsoluteCancelUrl(cancelUrl),
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_tier: plan,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_tier: plan,
          billing_cycle: billingCycle,
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    await upsertPremiumSubscription({
      user_id: user.id,
      email: user.email,
      plan_tier: plan,
      billing_cycle: billingCycle,
      status: "upgrade_pending",
      stripe_checkout_session_id: session.id,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
    });

    return jsonResponse(200, {
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
