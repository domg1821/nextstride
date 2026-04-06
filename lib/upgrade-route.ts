import type { BillingCycle, PremiumTier } from "@/lib/premium-products";

export type UpgradePlan = Exclude<PremiumTier, "free">;

export function buildUpgradePath(options?: {
  plan?: UpgradePlan | null;
  billing?: BillingCycle | null;
  recommendation?: string | null;
}) {
  const params: Record<string, string> = {};

  if (options?.plan) {
    params.plan = options.plan;
  }

  if (options?.billing) {
    params.billing = options.billing;
  }

  if (options?.recommendation) {
    params.recommendation = options.recommendation;
  }

  return Object.keys(params).length > 0 ? { pathname: "/upgrade" as const, params } : { pathname: "/upgrade" as const };
}

export function normalizeUpgradePlan(value: unknown): UpgradePlan {
  return value === "pro" ? "pro" : "elite";
}

export function normalizeBillingCycle(value: unknown): BillingCycle {
  return value === "yearly" ? "yearly" : "monthly";
}
