import {
  PREMIUM_SUBSCRIPTIONS_TABLE,
  getStripeCancelPath,
  getStripeSuccessPath,
  type PaidPlan,
  type StripeCheckoutSelection,
} from "@/lib/billing/stripe-config";
import type { BillingCycle, PremiumTier } from "@/lib/premium-products";
import { supabase, supabaseUrl } from "@/lib/supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

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

type PremiumSyncOptions = {
  sessionId?: string;
  timeoutMs?: number;
  intervalMs?: number;
};

type CheckoutSessionResponse = {
  checkoutUrl?: string;
  sessionId?: string;
};

type ConfirmSessionResponse = {
  subscription?: SubscriptionRow | null;
  error?: string;
};

function buildReturnUrl(path: string, selection: StripeCheckoutSelection) {
  return Linking.createURL(path, {
    queryParams: {
      plan: selection.plan,
      billing: selection.billingCycle,
    },
  })
    .replace(/[?&]session_id=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

function logStripeCheckoutDebug(input: { successUrl: string; cancelUrl: string }) {
  if (!__DEV__) {
    return;
  }

  console.log("[stripe-checkout] return URLs", input);
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
      lastMessage: `Your ${row.plan_tier === "elite" ? "Elite" : "Pro"} upgrade is processing. Premium access should unlock shortly.`,
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseFunctionResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  const payload = responseText ? tryParseJson(responseText) : null;

  if (!response.ok) {
    const backendMessage =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : responseText.trim();
    const detail = backendMessage || `Stripe confirmation failed with status ${response.status}.`;
    throw new Error(detail);
  }

  if (!responseText) {
    return {} as T;
  }

  if (payload === null) {
    throw new Error("Stripe confirmation returned an unreadable response.");
  }

  return payload as T;
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function chooseMoreCompleteState(
  current: SyncedPremiumState | null,
  next: SyncedPremiumState | null
): SyncedPremiumState | null {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  if (next.status === "premium_active") {
    return next;
  }

  if (current.status === "premium_active") {
    return current;
  }

  if (next.status === "upgrade_pending") {
    return next;
  }

  return current;
}

export async function startStripeCheckout(selection: StripeCheckoutSelection) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error("Sign in before starting checkout.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in before starting checkout.");
  }

  const successUrl = buildReturnUrl(getStripeSuccessPath(), selection);
  const cancelUrl = buildReturnUrl(getStripeCancelPath(), selection);

  logStripeCheckoutDebug({ successUrl, cancelUrl });

  const { data, error } = await supabase.functions.invoke<CheckoutSessionResponse>("stripe-create-checkout", {
    body: {
      plan: selection.plan,
      billingCycle: selection.billingCycle,
      successUrl,
      cancelUrl,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message || "Stripe checkout failed.");
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to confirm your Stripe checkout.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-confirm-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: trimmedSessionId,
    }),
  });

  const data = await parseFunctionResponse<ConfirmSessionResponse>(response);
  return mapSubscriptionRow(data?.subscription ?? null);
}

export async function pollPremiumSync(options: PremiumSyncOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const intervalMs = options.intervalMs ?? 2000;
  const deadline = Date.now() + timeoutMs;
  let latestState: SyncedPremiumState | null = null;
  let lastError: unknown = null;

  while (Date.now() <= deadline) {
    try {
      if (options.sessionId) {
        latestState = chooseMoreCompleteState(latestState, await confirmStripeCheckoutSession(options.sessionId));
      }

      latestState = chooseMoreCompleteState(latestState, await fetchRemoteSubscriptionState());

      if (latestState?.status === "premium_active") {
        return latestState;
      }

      if (Date.now() >= deadline) {
        break;
      }

      await sleep(intervalMs);
    } catch (error) {
      lastError = error;

      if (Date.now() >= deadline) {
        break;
      }

      await sleep(intervalMs);
    }
  }

  if (latestState) {
    if (latestState.status === "upgrade_pending") {
      return {
        ...latestState,
        lastMessage:
          latestState.pendingTier === "elite"
            ? "Your Elite purchase went through. We are finishing the upgrade and your premium access should unlock shortly."
            : "Your Pro purchase went through. We are finishing the upgrade and your premium access should unlock shortly.",
      };
    }

    return latestState;
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to sync your Stripe purchase yet.");
}

export function getStripeClientErrorMessage(error: unknown) {
  return getErrorMessage(error);
}
