import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import { PREMIUM_PLANS } from "@/lib/premium-products";
import { useResponsiveLayout } from "@/lib/responsive";
import { normalizeBillingCycle, normalizeUpgradePlan } from "@/lib/upgrade-route";

const STRIPE_SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 20000;

type SuccessStatus = "loading" | "pending" | "success" | "timeout" | "error";

export default function BillingSuccessScreen() {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();
  const { refreshSubscription } = usePremium();
  const params = useLocalSearchParams<{ session_id?: string; plan?: string; billing?: string }>();
  const initialPlan = useMemo(() => normalizeUpgradePlan(params.plan), [params.plan]);
  const initialBillingCycle = useMemo(
    () => (typeof params.billing === "string" ? normalizeBillingCycle(params.billing) : "yearly"),
    [params.billing]
  );
  const [status, setStatus] = useState<SuccessStatus>("loading");
  const [resolvedPlan, setResolvedPlan] = useState(initialPlan);
  const [resolvedBillingCycle, setResolvedBillingCycle] = useState(initialBillingCycle);
  const [message, setMessage] = useState("Payment received. Activating your premium plan...");
  const [errorDetail, setErrorDetail] = useState("");
  const [attemptKey, setAttemptKey] = useState(0);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log("[billing-success] params", params);
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    const resolvePremiumActivation = async () => {
      const sessionId = typeof params.session_id === "string" ? params.session_id.trim() : "";
      const hasUsableSessionId = Boolean(sessionId && sessionId !== STRIPE_SESSION_PLACEHOLDER);

      if (!cancelled) {
        setStatus("loading");
        setMessage("Payment received. Activating your premium plan...");
        setErrorDetail("");
      }

      try {
        const { confirmStripeCheckoutSession, fetchRemoteSubscriptionState } = await import("@/lib/billing/stripe-client");
        const deadline = Date.now() + POLL_TIMEOUT_MS;

        while (!cancelled && Date.now() <= deadline) {
          let syncedState = null as Awaited<ReturnType<typeof fetchRemoteSubscriptionState>> | null;
          let confirmationError = "" as string;

          if (hasUsableSessionId) {
            try {
              syncedState = await confirmStripeCheckoutSession(sessionId);
            } catch (error) {
              confirmationError = error instanceof Error ? error.message : "Unable to confirm the checkout session.";
            }
          }

          const remoteState = await fetchRemoteSubscriptionState();
          const refreshed = await refreshSubscription();

          if (cancelled) {
            return;
          }

          const effectiveState =
            remoteState.status === "premium_active" || remoteState.status === "upgrade_pending"
              ? remoteState
              : syncedState ?? remoteState;
          const activeOrPendingPlan =
            effectiveState.status === "premium_active"
              ? effectiveState.tier
              : effectiveState.pendingTier ?? initialPlan;

          setResolvedPlan(activeOrPendingPlan === "free" ? initialPlan : activeOrPendingPlan);
          setResolvedBillingCycle(effectiveState.billingCycle ?? initialBillingCycle);

          if (effectiveState.status === "premium_active" || refreshed.status === "active") {
            setStatus("success");
            setMessage(refreshed.message || effectiveState.lastMessage || "Your premium plan is active and ready to use.");
            setErrorDetail("");
            return;
          }

          if (effectiveState.status === "upgrade_pending" || refreshed.status === "pending") {
            setStatus("pending");
            setMessage(
              refreshed.message ||
                effectiveState.lastMessage ||
                "Payment received. Activating your premium plan..."
            );
            setErrorDetail(confirmationError);
          } else {
            setStatus("pending");
            setMessage("Payment received. Activating your premium plan...");
            setErrorDetail(confirmationError);
          }

          if (Date.now() + POLL_INTERVAL_MS > deadline) {
            break;
          }

          await sleep(POLL_INTERVAL_MS);
        }

        if (!cancelled) {
          const finalRefresh = await refreshSubscription();

          if (cancelled) {
            return;
          }

          if (finalRefresh.status === "active") {
            setStatus("success");
            setMessage(finalRefresh.message || "Your premium plan is active and ready to use.");
            setErrorDetail("");
            return;
          }

          setStatus("timeout");
          setMessage("Your payment went through and premium is still syncing. Refresh in a moment.");
          setErrorDetail("");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          const detail = error instanceof Error ? error.message : "Unable to sync your premium purchase.";
          setMessage("We hit a problem while checking your premium status.");
          setErrorDetail(detail);
        }
      }
    };

    void resolvePremiumActivation();

    return () => {
      cancelled = true;
    };
  }, [attemptKey, initialBillingCycle, initialPlan, params.session_id, refreshSubscription]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: layout.pagePadding, paddingTop: 28, paddingBottom: 40, gap: 22 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ backgroundColor: "#142339", borderRadius: 32, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.2)", padding: 24, gap: 12 }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>PAYMENT SUCCESS</Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40 }}>
          {status === "success" ? "Your premium plan is active." : "Your upgrade is on the way."}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 24 }}>
          {status === "success"
            ? `Your ${PREMIUM_PLANS[resolvedPlan].name} ${resolvedBillingCycle} subscription is confirmed. Premium features should now unlock across the app.`
            : status === "timeout"
              ? `Your ${PREMIUM_PLANS[resolvedPlan].name} purchase succeeded. We are still syncing your subscription, and premium access should unlock shortly.`
              : `Your ${PREMIUM_PLANS[resolvedPlan].name} purchase was received. We are checking Stripe and your subscription state so premium can unlock automatically.`}
        </Text>
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
          {status === "loading"
            ? "Activating premium..."
            : status === "success"
              ? "Premium unlocked"
              : status === "pending"
                ? "Processing upgrade..."
                : status === "timeout"
                  ? "Still syncing..."
                  : "Sync error"}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>{message}</Text>

        {(status === "error" || (status === "pending" && !!errorDetail)) && errorDetail ? (
          <View style={{ backgroundColor: colors.cardAlt, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
            <Text style={{ color: "#fca5a5", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
              {status === "error" ? "ERROR DETAILS" : "OPTIONAL SESSION CONFIRMATION"}
            </Text>
            <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 8 }}>{errorDetail}</Text>
          </View>
        ) : null}

        <View style={{ backgroundColor: colors.cardAlt, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
          <SummaryRow label="Plan" value={PREMIUM_PLANS[resolvedPlan].name} />
          <SummaryRow label="Billing" value={resolvedBillingCycle === "yearly" ? "Yearly" : "Monthly"} />
          <SummaryRow label="Status" value={getStatusLabel(status)} />
        </View>
      </View>

      <View style={{ flexDirection: layout.isPhone ? "column" : "row", flexWrap: "wrap", gap: 12 }}>
        <Pressable
          onPress={() => router.replace("/")}
          style={{ flex: 1, minWidth: 220, minHeight: 54, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}
        >
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>Return to Dashboard</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/premium")}
          style={{ flex: 1, minWidth: 220, minHeight: 54, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>View Premium Features</Text>
        </Pressable>
        {status !== "success" ? (
          <Pressable
            onPress={() => {
              setStatus("loading");
              setMessage("Payment received. Activating your premium plan...");
              setErrorDetail("");
              setAttemptKey((current) => current + 1);
            }}
            style={{ flex: 1, minWidth: 220, minHeight: 54, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}
          >
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
              {status === "timeout" ? "Refresh Premium Status" : "Check Again"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors } = useThemeColors();

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: colors.subtext, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "right", flexShrink: 1 }}>{value}</Text>
    </View>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusLabel(status: SuccessStatus) {
  switch (status) {
    case "success":
      return "Premium active";
    case "pending":
      return "Syncing from webhook";
    case "timeout":
      return "Payment received, still syncing";
    case "error":
      return "Refresh needed";
    default:
      return "Checking premium status";
  }
}
