import type { BillingCycle, PremiumTier } from "@/lib/premium-products";

export type PaidPlan = Exclude<PremiumTier, "free">;
export type StripeCheckoutSelection = {
  plan: PaidPlan;
  billingCycle: BillingCycle;
};

export type StripeLookupKey =
  | "pro_monthly"
  | "pro_yearly"
  | "elite_monthly"
  | "elite_yearly";

export const STRIPE_PRICE_ENV_KEYS: Record<StripeLookupKey, string> = {
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_yearly: "STRIPE_PRICE_PRO_YEARLY",
  elite_monthly: "STRIPE_PRICE_ELITE_MONTHLY",
  elite_yearly: "STRIPE_PRICE_ELITE_YEARLY",
};

export const PREMIUM_SUBSCRIPTIONS_TABLE = "premium_subscriptions";

export function isPaidPlan(value: string | null | undefined): value is PaidPlan {
  return value === "pro" || value === "elite";
}

export function isBillingCycle(value: string | null | undefined): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function normalizeStripeCheckoutSelection(input: {
  plan?: string | null;
  billingCycle?: string | null;
}): StripeCheckoutSelection | null {
  if (!isPaidPlan(input.plan) || !isBillingCycle(input.billingCycle)) {
    return null;
  }

  return {
    plan: input.plan,
    billingCycle: input.billingCycle,
  };
}

export function getStripeLookupKey(plan: PaidPlan, billingCycle: BillingCycle): StripeLookupKey {
  return `${plan}_${billingCycle}` as StripeLookupKey;
}

export function getStripePriceEnvKey(plan: PaidPlan, billingCycle: BillingCycle) {
  return STRIPE_PRICE_ENV_KEYS[getStripeLookupKey(plan, billingCycle)];
}

export function getStripeSuccessPath() {
  return "/billing/success";
}

export function getStripeCancelPath() {
  return "/billing/cancel";
}
