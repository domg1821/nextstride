import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import {
  PaymentSummaryCard,
  PlanBenefits,
  UpgradeFeaturePreview,
  UpgradeValueSection,
  UpgradeBillingSelector,
  UpgradeHeader,
  UpgradePlanSelector,
  UpgradeRecommendation,
} from "@/components/upgrade-flow";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import type { BillingCycle } from "@/lib/premium-products";
import { getSubscriptionCopy, getSubscriptionOffering } from "@/lib/subscription-config";
import { buildUpgradePath, normalizeBillingCycle, normalizeUpgradePlan, type UpgradePlan } from "@/lib/upgrade-route";

export default function UpgradeScreen() {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ plan?: string; billing?: string; recommendation?: string }>();
  const { beginUpgrade, statusTitle, statusDetail } = usePremium();
  const isWide = width >= 980;
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan>(normalizeUpgradePlan(params.plan));
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(params.billing ? normalizeBillingCycle(params.billing) : "yearly");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    setSelectedPlan(normalizeUpgradePlan(params.plan));
  }, [params.plan]);

  useEffect(() => {
    setBillingCycle(params.billing ? normalizeBillingCycle(params.billing) : "yearly");
  }, [params.billing]);

  const pageSubtitle = useMemo(
    () =>
      selectedPlan === "elite"
        ? "Elite gives you the full coaching-style layer: adaptive training, post-run feedback, race guidance, and deeper personalized insight."
        : "Pro sharpens the training experience with better execution tools, clearer guidance, and stronger performance visibility.",
    [selectedPlan]
  );
  const offering = useMemo(() => getSubscriptionOffering(selectedPlan), [selectedPlan]);
  const planCopy = useMemo(() => getSubscriptionCopy(selectedPlan), [selectedPlan]);
  const recommendationMessage = useMemo(() => {
    if (typeof params.recommendation === "string" && params.recommendation.trim()) {
      return params.recommendation.trim();
    }

    return null;
  }, [params.recommendation]);

  const updateRoute = (plan: UpgradePlan, cycle: BillingCycle) => {
    router.replace(buildUpgradePath({ plan, billing: cycle }));
  };

  const handlePlanSelect = (plan: UpgradePlan) => {
    setSelectedPlan(plan);
    updateRoute(plan, billingCycle);
  };

  const handleBillingSelect = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    updateRoute(selectedPlan, cycle);
  };

  const handleContinue = async () => {
    setSubmitting(true);
    setCheckoutError("");

    try {
      const result = await beginUpgrade(selectedPlan, billingCycle);

      if (result.status === "inactive") {
        setCheckoutError(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: isWide ? 32 : 20, paddingTop: 24, paddingBottom: 54, gap: 28, width: "100%", maxWidth: 1180, alignSelf: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/premium"))} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <UpgradeHeader />

      <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 23, fontWeight: "800" }}>Selected upgrade flow</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>{pageSubtitle}</Text>
        <View style={{ backgroundColor: colors.cardAlt, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
          <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>CURRENT STATUS</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>{statusTitle}</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{statusDetail}</Text>
        </View>
        <View style={{ backgroundColor: "rgba(103, 232, 249, 0.06)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 14, gap: 6 }}>
          <Text style={{ color: selectedPlan === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{offering.label.toUpperCase()}</Text>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{planCopy.outcomeCopy}</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{planCopy.bestFor}</Text>
        </View>
      </View>

      <UpgradeRecommendation message={recommendationMessage} />

      <UpgradeValueSection />

      <UpgradeFeaturePreview />

      <UpgradePlanSelector selectedPlan={selectedPlan} onSelect={handlePlanSelect} billingCycle={billingCycle} />

      <UpgradeBillingSelector selected={billingCycle} onSelect={handleBillingSelect} plan={selectedPlan} />

      {checkoutError ? (
        <View style={{ backgroundColor: "rgba(248, 113, 113, 0.08)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(248, 113, 113, 0.24)", padding: 16, gap: 8 }}>
          <Text style={{ color: "#fca5a5", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>CHECKOUT ERROR</Text>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>We could not start Stripe checkout.</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{checkoutError}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: isWide ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
        <View style={{ flex: 1, width: "100%" }}>
          <PlanBenefits plan={selectedPlan} />
        </View>
        <View style={{ flex: isWide ? 0.85 : 1, width: "100%" }}>
          <PaymentSummaryCard plan={selectedPlan} billingCycle={billingCycle} onContinue={handleContinue} loading={submitting} />
        </View>
      </View>
    </ScrollView>
  );
}
