import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import { PREMIUM_PLANS } from "@/lib/premium-products";
import { normalizeBillingCycle, normalizeUpgradePlan } from "@/lib/upgrade-route";

export default function BillingSuccessScreen() {
  const { colors } = useThemeColors();
  const { refreshSubscription } = usePremium();
  const params = useLocalSearchParams<{ session_id?: string; plan?: string; billing?: string }>();
  const selectedPlan = useMemo(() => normalizeUpgradePlan(params.plan), [params.plan]);
  const billingCycle = useMemo(
    () => (typeof params.billing === "string" ? normalizeBillingCycle(params.billing) : "yearly"),
    [params.billing]
  );
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your Stripe checkout and unlocking premium features...");

  useEffect(() => {
    let cancelled = false;

    const confirmCheckout = async () => {
      const sessionId = typeof params.session_id === "string" ? params.session_id.trim() : "";

      if (!sessionId) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Stripe returned without a checkout session id, so we could not verify the payment.");
        }
        return;
      }

      try {
        const { confirmStripeCheckoutSession } = await import("@/lib/billing/stripe-client");
        const confirmed = await confirmStripeCheckoutSession(sessionId);
        const refreshed = await refreshSubscription();

        if (cancelled) {
          return;
        }

        setStatus("success");
        setMessage(refreshed.message || confirmed.lastMessage);
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Unable to confirm your Stripe checkout.");
        }
      }
    };

    void confirmCheckout();

    return () => {
      cancelled = true;
    };
  }, [params.session_id, refreshSubscription]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40, gap: 22, width: "100%", maxWidth: 880, alignSelf: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ backgroundColor: "#142339", borderRadius: 32, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.2)", padding: 24, gap: 12 }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>PAYMENT SUCCESS</Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40 }}>Your upgrade is on the way.</Text>
        <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 24 }}>
          {status === "success"
            ? `Your ${PREMIUM_PLANS[selectedPlan].name} ${billingCycle} subscription is confirmed. Premium features should now unlock across the app.`
            : "We are syncing your Stripe purchase and verifying the subscription state against your NextStride account."}
        </Text>
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
          {status === "loading" ? "Confirming purchase..." : status === "success" ? "Premium unlocked" : "Confirmation needed"}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>{message}</Text>

        <View style={{ backgroundColor: colors.cardAlt, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
          <SummaryRow label="Plan" value={PREMIUM_PLANS[selectedPlan].name} />
          <SummaryRow label="Billing" value={billingCycle === "yearly" ? "Yearly" : "Monthly"} />
          <SummaryRow label="Unlocked" value={selectedPlan === "elite" ? "Full coaching-style layer" : "Sharper training tools"} />
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
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
