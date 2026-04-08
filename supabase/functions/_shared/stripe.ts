import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

export type PaidPlan = "pro" | "elite";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "not_premium" | "upgrade_pending" | "premium_active" | "canceled" | "past_due";

type StripeLookupKey = `${PaidPlan}_${BillingCycle}`;

type SubscriptionUpsert = {
  user_id: string;
  email: string;
  plan_tier: PaidPlan | "free";
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_checkout_session_id?: string | null;
  renewal_date?: string | null;
};

export type PremiumSubscriptionRecord = {
  user_id: string;
  email: string | null;
  plan_tier: PaidPlan | "free";
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  renewal_date: string | null;
};

const PRICE_ENV_KEYS: Record<StripeLookupKey, string> = {
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_yearly: "STRIPE_PRICE_PRO_YEARLY",
  elite_monthly: "STRIPE_PRICE_ELITE_MONTHLY",
  elite_yearly: "STRIPE_PRICE_ELITE_YEARLY",
};

export const PREMIUM_SUBSCRIPTIONS_TABLE = "premium_subscriptions";
export const STRIPE_CHECKOUT_SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";

function getRequiredRuntimeEnv(name: "SUPABASE_URL" | "SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing required Supabase Edge Function runtime variable: ${name}`);
  }

  return value;
}

function getRequiredEdgeFunctionSecret(name: string) {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing ${name} - check Supabase Edge Function secrets`);
  }

  return value;
}

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === "pro" || value === "elite";
}

export function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function getStripe() {
  return new Stripe(getRequiredEdgeFunctionSecret("STRIPE_SECRET_KEY"), {
    apiVersion: "2024-06-20",
  });
}

function getValidatedStripePriceSecrets() {
  const entries = Object.entries(PRICE_ENV_KEYS) as [StripeLookupKey, string][];
  const resolvedEntries = entries.map(([lookupKey, envKey]) => [lookupKey, getRequiredEdgeFunctionSecret(envKey)] as const);
  const seenPriceIds = new Map<string, string>();

  for (const [lookupKey, priceId] of resolvedEntries) {
    const existingLookupKey = seenPriceIds.get(priceId);

    if (existingLookupKey) {
      const currentEnvKey = PRICE_ENV_KEYS[lookupKey];
      const existingEnvKey = PRICE_ENV_KEYS[existingLookupKey as StripeLookupKey];
      throw new Error(
        `Duplicate Stripe price ID detected for ${existingEnvKey} and ${currentEnvKey}. Each STRIPE_PRICE_* secret must use a unique Stripe price ID.`
      );
    }

    seenPriceIds.set(priceId, lookupKey);
  }

  return Object.fromEntries(resolvedEntries) as Record<StripeLookupKey, string>;
}

export function getUserSupabaseClient(authHeader: string | null) {
  return createClient(getRequiredRuntimeEnv("SUPABASE_URL"), getRequiredRuntimeEnv("SUPABASE_ANON_KEY"), {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export function getServiceSupabaseClient() {
  return createClient(
    getRequiredRuntimeEnv("SUPABASE_URL"),
    getRequiredRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    throw new Error("Missing authorization header.");
  }

  const userClient = getUserSupabaseClient(authHeader);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user?.id || !user.email) {
    throw new Error("You must be signed in to manage billing.");
  }

  return user;
}

export function getPriceId(plan: PaidPlan, billingCycle: BillingCycle) {
  return getValidatedStripePriceSecrets()[`${plan}_${billingCycle}`];
}

export function getPlanFromPriceId(priceId: string): { plan: PaidPlan; billingCycle: BillingCycle } | null {
  const entries = Object.entries(getValidatedStripePriceSecrets()) as [StripeLookupKey, string][];

  for (const [lookupKey, configuredPriceId] of entries) {
    if (configuredPriceId === priceId) {
      const [plan, billingCycle] = lookupKey.split("_") as [PaidPlan, BillingCycle];
      return { plan, billingCycle };
    }
  }

  return null;
}

export function getAbsoluteSuccessUrl(successUrl: string) {
  const cleaned = successUrl
    .replace(/[?&]session_id=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
  const separator = cleaned.includes("?") ? "&" : "?";

  return `${cleaned}${separator}session_id=${STRIPE_CHECKOUT_SESSION_PLACEHOLDER}`;
}

export function getAbsoluteCancelUrl(cancelUrl: string) {
  return new URL(cancelUrl).toString();
}

export async function upsertPremiumSubscription(input: SubscriptionUpsert) {
  const serviceClient = getServiceSupabaseClient();
  const { error } = await serviceClient.from(PREMIUM_SUBSCRIPTIONS_TABLE).upsert(
    {
      user_id: input.user_id,
      email: input.email,
      plan_tier: input.plan_tier,
      billing_cycle: input.billing_cycle,
      status: input.status,
      stripe_customer_id: input.stripe_customer_id ?? null,
      stripe_subscription_id: input.stripe_subscription_id ?? null,
      stripe_checkout_session_id: input.stripe_checkout_session_id ?? null,
      renewal_date: input.renewal_date ?? null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function findPremiumSubscriptionRecord(input: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  email?: string | null;
}) {
  const serviceClient = getServiceSupabaseClient();
  const lookups: Array<{ column: keyof PremiumSubscriptionRecord; value: string | null | undefined }> = [
    { column: "stripe_subscription_id", value: input.stripeSubscriptionId },
    { column: "stripe_checkout_session_id", value: input.stripeCheckoutSessionId },
    { column: "stripe_customer_id", value: input.stripeCustomerId },
    { column: "email", value: input.email?.trim().toLowerCase() },
  ];

  for (const lookup of lookups) {
    const value = lookup.value?.trim();

    if (!value) {
      continue;
    }

    const { data, error } = await serviceClient
      .from(PREMIUM_SUBSCRIPTIONS_TABLE)
      .select("user_id, email, plan_tier, billing_cycle, status, stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, renewal_date")
      .eq(lookup.column, value)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data as PremiumSubscriptionRecord;
    }
  }

  return null;
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active" || status === "trialing") {
    return "premium_active";
  }

  if (status === "past_due" || status === "unpaid") {
    return "past_due";
  }

  return "canceled";
}

export function getSubscriptionRenewalDate(subscription: Stripe.Subscription | null | undefined) {
  if (!subscription?.current_period_end) {
    return null;
  }

  return new Date(subscription.current_period_end * 1000).toISOString();
}

export function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unknown Stripe function error.";
  return jsonResponse(status, { error: message });
}
