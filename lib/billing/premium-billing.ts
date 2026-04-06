import type { BillingCycle, PremiumTier } from "@/lib/premium-products";
import {
  fetchRemoteSubscriptionState,
  getStripeClientErrorMessage,
  startStripeCheckout,
} from "@/lib/billing/stripe-client";

export type PremiumStatus = "not_premium" | "upgrade_pending" | "premium_active";
export type PurchaseEnvironment = "stripe_checkout";

export type PurchaseResult =
  | {
      status: "pending";
      environment: PurchaseEnvironment;
      message: string;
      tier: PremiumTier;
      billingCycle: BillingCycle;
    }
  | {
      status: "active";
      environment: PurchaseEnvironment;
      message: string;
      tier: PremiumTier;
      billingCycle: BillingCycle;
      renewalDate?: string;
    }
  | {
      status: "inactive";
      environment: PurchaseEnvironment;
      message: string;
      tier?: PremiumTier;
      billingCycle?: BillingCycle;
    };

export type PurchaseAdapter = {
  startSubscriptionPurchase: (tier: PremiumTier, billingCycle: BillingCycle) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
};

export function getPurchaseEnvironment(): PurchaseEnvironment {
  return "stripe_checkout";
}

export function getPurchaseEnvironmentLabel(environment: PurchaseEnvironment) {
  if (environment === "stripe_checkout") {
    return "Stripe Checkout";
  }

  return "Stripe Checkout";
}

export const stripePurchaseAdapter: PurchaseAdapter = {
  async startSubscriptionPurchase(tier, billingCycle) {
    const environment = getPurchaseEnvironment();

    if (tier === "free") {
      return {
        status: "inactive",
        environment,
        tier,
        billingCycle,
        message: "The Free plan does not require checkout.",
      };
    }

    try {
      await startStripeCheckout({
        plan: tier,
        billingCycle,
      });

      return {
        status: "pending",
        environment,
        tier,
        billingCycle,
        message: `Redirecting to secure Stripe checkout for ${tier === "elite" ? "Elite" : "Pro"} ${billingCycle}.`,
      };
    } catch (error) {
      return {
        status: "inactive",
        environment,
        tier,
        billingCycle,
        message: getStripeClientErrorMessage(error),
      };
    }
  },

  async restorePurchases() {
    const environment = getPurchaseEnvironment();

    try {
      const subscription = await fetchRemoteSubscriptionState();

      if (subscription.status === "premium_active") {
        return {
          status: "active",
          environment,
          tier: subscription.tier,
          billingCycle: subscription.billingCycle,
          renewalDate: subscription.renewalDate ?? undefined,
          message: subscription.lastMessage,
        };
      }

      if (subscription.status === "upgrade_pending") {
        return {
          status: "pending",
          environment,
          tier: subscription.pendingTier ?? "pro",
          billingCycle: subscription.billingCycle,
          message: subscription.lastMessage,
        };
      }

      return {
        status: "inactive",
        environment,
        message: subscription.lastMessage,
      };
    } catch (error) {
      return {
        status: "inactive",
        environment,
        message: getStripeClientErrorMessage(error),
      };
    }
  },
};
