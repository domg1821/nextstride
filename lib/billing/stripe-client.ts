import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import {
  PREMIUM_SUBSCRIPTIONS_TABLE,
  getStripeCancelPath,
  getStripeSuccessPath,
  type PaidPlan,
  type StripeCheckoutSelection,
} from "@/lib/billing/stripe-config";
import type { BillingCycle, PremiumTier } from "@/lib/premium-products";

type SubscriptionRow = {
  plan_tier?: PremiumTier | null;
  billing_cycle?: BillingCycle | null;
  status?: "not_premium" | "upgrade_pending" | "premium_active" | "canceled" | "past_due" | null;
  renewal_date?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export type SyncedPremiumState = {
  status: "not_premium" | "upgrade_pending" | "premium_active";
  tier: PremiumTier;
  pendingTier: PaidPlan | null;
  billingCycle: BillingCycle;
  renewalDate: string | null;
  lastMessage: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

type CheckoutSessionResponse = {
  checkoutUrl?: string;
  sessionId?: string;
};

type ConfirmSessionResponse = {
  subscription?: SubscriptionRow | null;
};

function buildReturnUrl(path: string, selection: StripeCheckoutSelection) {
  return Linking.createURL(path, {
    queryParams: {
      plan: selection.plan,
      billing: selection.billingCycle,
    },
  });
}

function mapSubscriptionRow(row?: SubscriptionRow | null): SyncedPremiumState {
  if (!row?.plan_tier || row.plan_tier === "free") {
    return {
      status: "not_premium",
      tier: "free",
      pendingTier: null,
      billingCycle: "yearly",
      renewalDate: null,
      lastMessage: "No active premium subscription found yet.",
    };
  }

  if (row.status === "upgrade_pending") {
    return {
      status: "upgrade_pending",
      tier: "free",
      pendingTier: row.plan_tier === "elite" ? "elite" : "pro",
      billingCycle: row.billing_cycle ?? "yearly",
      renewalDate: null,
      lastMessage: `Stripe checkout is in progress for ${row.plan_tier === "elite" ? "Elite" : "Pro"}.`,
      stripeCustomerId: row.stripe_customer_id ?? null,
      stripeSubscriptionId: row.stripe_subscription_id ?? null,
    };
  }

  if (row.status === "premium_active") {
    return {
      status: "premium_active",
      tier: row.plan_tier,
      pendingTier: null,
      billingCycle: row.billing_cycle ?? "yearly",
      renewalDate: row.renewal_date ?? null,
      lastMessage: `${row.plan_tier === "elite" ? "Elite" : "Pro"} is active through Stripe.`,
      stripeCustomerId: row.stripe_customer_id ?? null,
      stripeSubscriptionId: row.stripe_subscription_id ?? null,
    };
  }

  return {
    status: "not_premium",
    tier: "free",
    pendingTier: null,
    billingCycle: row.billing_cycle ?? "yearly",
    renewalDate: null,
    lastMessage:
      row.status === "past_due"
        ? "Your Stripe subscription is past due. Update billing to restore premium access."
        : "No active premium subscription found yet.",
    stripeCustomerId: row.stripe_customer_id ?? null,
    stripeSubscriptionId: row.stripe_subscription_id ?? null,
  };
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown Stripe billing error.";
}

export async function startStripeCheckout(selection: StripeCheckoutSelection) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error("Sign in before starting checkout.");
  }

  const { data, error } = await supabase.functions.invoke<CheckoutSessionResponse>("stripe-create-checkout", {
    body: {
      plan: selection.plan,
      billingCycle: selection.billingCycle,
      successUrl: buildReturnUrl(getStripeSuccessPath(), selection),
      cancelUrl: buildReturnUrl(getStripeCancelPath(), selection),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.checkoutUrl) {
    throw new Error("Stripe checkout did not return a valid checkout URL.");
  }

  if (Platform.OS === "web") {
    const webLocation = (globalThis as typeof globalThis & { location?: Location }).location;
    webLocation?.assign(data.checkoutUrl);
  } else {
    await WebBrowser.openBrowserAsync(data.checkoutUrl);
  }

  return data;
}

export async function fetchRemoteSubscriptionState() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return mapSubscriptionRow(null);
  }

  const { data, error } = await supabase
    .from(PREMIUM_SUBSCRIPTIONS_TABLE)
    .select("plan_tier, billing_cycle, status, renewal_date, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapSubscriptionRow(data as SubscriptionRow | null);
}

export async function confirmStripeCheckoutSession(sessionId: string) {
  const trimmedSessionId = sessionId.trim();

  if (!trimmedSessionId) {
    throw new Error("Missing checkout session id.");
  }

  const { data, error } = await supabase.functions.invoke<ConfirmSessionResponse>("stripe-confirm-session", {
    body: {
      sessionId: trimmedSessionId,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return mapSubscriptionRow(data?.subscription ?? null);
}

export function getStripeClientErrorMessage(error: unknown) {
  return getErrorMessage(error);
}
