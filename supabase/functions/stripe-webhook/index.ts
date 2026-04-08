import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type Stripe from "npm:stripe@16.12.0";
import {
  errorResponse,
  findPremiumSubscriptionRecord,
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
    throw new Error("Missing required Edge Function secret: STRIPE_WEBHOOK_SECRET");
  }

  return value;
}

type ResolvedUserContext = {
  userId: string;
  email: string;
  checkoutSessionId?: string | null;
  existingSubscriptionId?: string | null;
  existingCustomerId?: string | null;
};

function logWebhook(message: string, extra?: Record<string, unknown>) {
  console.log("[stripe-webhook]", message, extra ?? {});
}

async function getSubscriptionFromCheckoutSession(stripe: ReturnType<typeof getStripe>, session: Stripe.Checkout.Session) {
  if (typeof session.subscription === "object" && session.subscription) {
    return session.subscription as Stripe.Subscription;
  }

  if (typeof session.subscription === "string") {
    return await stripe.subscriptions.retrieve(session.subscription);
  }

  return null;
}

function resolvePlanDetails(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  return subscription.metadata?.plan_tier &&
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
}

async function getCustomerEmail(stripe: ReturnType<typeof getStripe>, customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!customer) {
    return "";
  }

  if (typeof customer === "object" && "email" in customer && typeof customer.email === "string") {
    return customer.email.trim().toLowerCase();
  }

  if (typeof customer === "string") {
    const customerRecord = await stripe.customers.retrieve(customer);

    if ("deleted" in customerRecord && customerRecord.deleted) {
      return "";
    }

    return customerRecord.email?.trim().toLowerCase() || "";
  }

  return "";
}

async function resolveUserContextFromSubscription(
  stripe: ReturnType<typeof getStripe>,
  subscription: Stripe.Subscription,
  options?: { checkoutSessionId?: string | null }
): Promise<ResolvedUserContext> {
  const metadataUserId = subscription.metadata?.user_id?.trim();
  const metadataEmail = subscription.metadata?.user_email?.trim().toLowerCase();
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : null;

  if (metadataUserId && metadataEmail) {
    logWebhook("resolved user from subscription metadata", {
      userId: metadataUserId,
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
    });
    return {
      userId: metadataUserId,
      email: metadataEmail,
      checkoutSessionId: options?.checkoutSessionId ?? null,
      existingSubscriptionId: subscription.id,
      existingCustomerId: stripeCustomerId,
    };
  }

  const fallbackEmail = metadataEmail || (await getCustomerEmail(stripe, subscription.customer));
  const existing = await findPremiumSubscriptionRecord({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId,
    stripeCheckoutSessionId: options?.checkoutSessionId ?? null,
    email: fallbackEmail || null,
  });

  if (existing?.user_id && existing.email) {
    logWebhook("resolved user from premium_subscriptions lookup", {
      userId: existing.user_id,
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
      checkoutSessionId: options?.checkoutSessionId ?? null,
    });
    return {
      userId: existing.user_id,
      email: existing.email,
      checkoutSessionId: options?.checkoutSessionId ?? existing.stripe_checkout_session_id,
      existingSubscriptionId: existing.stripe_subscription_id,
      existingCustomerId: existing.stripe_customer_id,
    };
  }

  throw new Error("Unable to map Stripe subscription to a NextStride user.");
}

async function resolveUserContextFromCheckoutSession(
  stripe: ReturnType<typeof getStripe>,
  session: Stripe.Checkout.Session
): Promise<ResolvedUserContext> {
  const sessionUserId =
    session.client_reference_id?.trim() ||
    session.metadata?.user_id?.trim() ||
    session.subscription_details?.metadata?.user_id?.trim() ||
    "";
  const sessionEmail =
    session.metadata?.user_email?.trim().toLowerCase() ||
    session.customer_details?.email?.trim().toLowerCase() ||
    "";

  if (sessionUserId && sessionEmail) {
    logWebhook("resolved user from checkout session metadata", {
      userId: sessionUserId,
      checkoutSessionId: session.id,
      customerId: typeof session.customer === "string" ? session.customer : null,
    });
    return {
      userId: sessionUserId,
      email: sessionEmail,
      checkoutSessionId: session.id,
      existingSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      existingCustomerId: typeof session.customer === "string" ? session.customer : null,
    };
  }

  const existing = await findPremiumSubscriptionRecord({
    stripeCheckoutSessionId: session.id,
    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    email: sessionEmail || null,
  });

  if (existing?.user_id && existing.email) {
    logWebhook("resolved user from checkout session fallback lookup", {
      userId: existing.user_id,
      checkoutSessionId: session.id,
    });
    return {
      userId: existing.user_id,
      email: existing.email,
      checkoutSessionId: session.id,
      existingSubscriptionId: existing.stripe_subscription_id,
      existingCustomerId: existing.stripe_customer_id,
    };
  }

  const subscription = await getSubscriptionFromCheckoutSession(stripe, session);

  if (subscription) {
    return resolveUserContextFromSubscription(stripe, subscription, { checkoutSessionId: session.id });
  }

  throw new Error("Unable to map Stripe checkout session to a NextStride user.");
}

async function syncSubscription(
  stripe: ReturnType<typeof getStripe>,
  subscription: Stripe.Subscription,
  options?: { checkoutSessionId?: string | null; forcedStatus?: ReturnType<typeof mapStripeSubscriptionStatus> }
) {
  logWebhook("syncing subscription", {
    subscriptionId: subscription.id,
    customerId: typeof subscription.customer === "string" ? subscription.customer : null,
    checkoutSessionId: options?.checkoutSessionId ?? null,
    stripeStatus: subscription.status,
  });

  const resolvedPlan = resolvePlanDetails(subscription);

  if (!resolvedPlan) {
    throw new Error("Unable to map the Stripe subscription to a NextStride plan.");
  }

  const userContext = await resolveUserContextFromSubscription(stripe, subscription, {
    checkoutSessionId: options?.checkoutSessionId ?? null,
  });
  const mappedStatus = options?.forcedStatus ?? mapStripeSubscriptionStatus(subscription.status);
  const renewalDate = getSubscriptionRenewalDate(subscription);

  await upsertPremiumSubscription({
    user_id: userContext.userId,
    email: userContext.email,
    plan_tier: resolvedPlan.plan,
    billing_cycle: resolvedPlan.billingCycle,
    status: mappedStatus,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : userContext.existingCustomerId ?? null,
    stripe_subscription_id: subscription.id,
    stripe_checkout_session_id: options?.checkoutSessionId ?? userContext.checkoutSessionId ?? null,
    renewal_date: renewalDate,
  });

  logWebhook("premium_subscriptions upsert succeeded", {
    userId: userContext.userId,
    plan: resolvedPlan.plan,
    billingCycle: resolvedPlan.billingCycle,
    status: mappedStatus,
    subscriptionId: subscription.id,
    checkoutSessionId: options?.checkoutSessionId ?? userContext.checkoutSessionId ?? null,
  });
}

async function syncCheckoutSession(stripe: ReturnType<typeof getStripe>, session: Stripe.Checkout.Session) {
  logWebhook("syncing checkout session", {
    checkoutSessionId: session.id,
    paymentStatus: session.payment_status,
    customerId: typeof session.customer === "string" ? session.customer : null,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
  });

  const subscription = await getSubscriptionFromCheckoutSession(stripe, session);

  if (subscription) {
    await syncSubscription(stripe, subscription, {
      checkoutSessionId: session.id,
      forcedStatus: session.payment_status === "paid" ? "premium_active" : undefined,
    });
    return;
  }

  const userContext = await resolveUserContextFromCheckoutSession(stripe, session);
  const planTier = session.metadata?.plan_tier;
  const billingCycle = session.metadata?.billing_cycle;

  if (
    (planTier === "pro" || planTier === "elite") &&
    (billingCycle === "monthly" || billingCycle === "yearly")
  ) {
    const nextStatus = session.payment_status === "paid" ? "premium_active" : "upgrade_pending";

    await upsertPremiumSubscription({
      user_id: userContext.userId,
      email: userContext.email,
      plan_tier: planTier,
      billing_cycle: billingCycle,
      status: nextStatus,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : userContext.existingCustomerId ?? null,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : userContext.existingSubscriptionId ?? null,
      stripe_checkout_session_id: session.id,
    });

    logWebhook("checkout session upsert succeeded without subscription object", {
      userId: userContext.userId,
      plan: planTier,
      billingCycle,
      status: nextStatus,
      checkoutSessionId: session.id,
    });
    return;
  }

  throw new Error("Stripe checkout session is missing NextStride plan metadata.");
}

async function syncSubscriptionFromInvoice(stripe: ReturnType<typeof getStripe>, invoice: Stripe.Invoice, options?: { forcedStatus?: ReturnType<typeof mapStripeSubscriptionStatus> }) {
  if (typeof invoice.subscription !== "string") {
    logWebhook("invoice event skipped because subscription id was missing", {
      invoiceId: invoice.id,
      eventCustomerId: typeof invoice.customer === "string" ? invoice.customer : null,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  await syncSubscription(stripe, subscription, { forcedStatus: options?.forcedStatus });
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

    logWebhook("received event", {
      eventType: event.type,
      eventId: event.id,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await syncCheckoutSession(stripe, session);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await syncCheckoutSession(stripe, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(stripe, event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await syncSubscription(stripe, event.data.object as Stripe.Subscription, {
          forcedStatus: "canceled",
        });
        break;
      }
      case "invoice.paid": {
        await syncSubscriptionFromInvoice(stripe, event.data.object as Stripe.Invoice, {
          forcedStatus: "premium_active",
        });
        break;
      }
      case "invoice.payment_failed": {
        await syncSubscriptionFromInvoice(stripe, event.data.object as Stripe.Invoice, {
          forcedStatus: "past_due",
        });
        break;
      }
      default: {
        logWebhook("ignored event type", { eventType: event.type });
        break;
      }
    }

    return jsonResponse(200, { received: true });
  } catch (error) {
    logWebhook("webhook processing failed", {
      error: error instanceof Error ? error.message : "Unknown webhook error",
    });
    return errorResponse(error, 400);
  }
});

