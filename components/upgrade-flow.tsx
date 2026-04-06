import React from "react";
import { Pressable, Text, View } from "react-native";
import { BillingToggle } from "@/components/premium-pricing";
import { useThemeColors } from "@/contexts/theme-context";
import { PREMIUM_PLANS, type BillingCycle } from "@/lib/premium-products";
import {
  getSubscriptionCopy,
  getSubscriptionFeaturesForPlan,
  getSubscriptionOffering,
  getSubscriptionSavingsPercent,
  getSubscriptionSavings,
} from "@/lib/subscription-config";
import type { UpgradePlan } from "@/lib/upgrade-route";

export function UpgradeHeader() {
  const { colors } = useThemeColors();

  return (
    <View style={{ backgroundColor: "#142339", borderRadius: 34, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.18)", padding: 28, gap: 12 }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>CENTRALIZED UPGRADE</Text>
      <Text style={{ color: colors.text, fontSize: 38, fontWeight: "800", lineHeight: 44 }}>Upgrade Your Training</Text>
      <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 24, maxWidth: 760 }}>
        Unlock more advanced training tools, sharper insight, and coaching-level features with one consistent upgrade flow across NextStride.
      </Text>
    </View>
  );
}

export function UpgradeRecommendation({
  message,
}: {
  message?: string | null;
}) {
  const { colors } = useThemeColors();

  if (!message) {
    return null;
  }

  return (
    <View style={{ backgroundColor: "#132438", borderRadius: 24, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.16)", padding: 18, gap: 8 }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>RECOMMENDED</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{message}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
        This message is route-driven, so locked features or future paywall surfaces can send users here with more specific upgrade context.
      </Text>
    </View>
  );
}

export function UpgradeValueSection() {
  const { colors } = useThemeColors();
  const valuePoints = getSubscriptionCopy("elite").valuePoints;

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>What you unlock</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12 }}>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>
          Upgrade moves NextStride from a clean training tracker into a stronger guidance system built around better decisions, clearer feedback, and deeper goal-focused insight.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {valuePoints.map((point) => (
            <View key={point} style={{ flex: 1, minWidth: 220, backgroundColor: colors.cardAlt, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
              <Text style={{ color: "#dcecff", fontSize: 14, fontWeight: "700", lineHeight: 20 }}>{point}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function UpgradeFeaturePreview() {
  const { colors } = useThemeColors();
  const previewFeatures = getSubscriptionFeaturesForPlan("elite").slice(0, 3);

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Premium feature preview</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {previewFeatures.map((feature) => (
          <View
            key={feature.key}
            style={{
              flex: 1,
              minWidth: 240,
              backgroundColor: "#132438",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: feature.minimumTier === "elite" ? "rgba(103, 232, 249, 0.16)" : colors.border,
              padding: 18,
              gap: 10,
              opacity: 0.88,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800", flex: 1 }}>{feature.title}</Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: feature.minimumTier === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 11, fontWeight: "800" }}>
                  {feature.minimumTier === "elite" ? "ELITE" : "PRO"}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{feature.preview}</Text>
            <Text style={{ color: "#9db2ca", fontSize: 12, fontWeight: "700" }}>Preview only. Unlock with premium.</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function UpgradePlanSelector({
  selectedPlan,
  onSelect,
  billingCycle,
}: {
  selectedPlan: UpgradePlan;
  onSelect: (plan: UpgradePlan) => void;
  billingCycle: BillingCycle;
}) {
  const { colors } = useThemeColors();

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Choose your plan</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {(["pro", "elite"] as UpgradePlan[]).map((planTier) => {
          const plan = PREMIUM_PLANS[planTier];
          const copy = getSubscriptionCopy(planTier);
          const active = selectedPlan === planTier;
          const elite = planTier === "elite";

          return (
            <Pressable
              key={planTier}
              onPress={() => onSelect(planTier)}
              style={{
                flex: 1,
                minWidth: 280,
                backgroundColor: elite ? "#142339" : colors.card,
                borderRadius: 28,
                borderWidth: elite ? 1.5 : 1,
                borderColor:
                  elite
                    ? active
                      ? "rgba(103, 232, 249, 0.46)"
                      : "rgba(103, 232, 249, 0.22)"
                    : active
                      ? "rgba(37, 99, 235, 0.32)"
                      : colors.border,
                padding: elite ? 22 : 20,
                gap: 12,
                shadowColor: elite ? "#38bdf8" : "#000000",
                shadowOpacity: elite ? (active ? 0.26 : 0.14) : active ? 0.12 : 0.05,
                shadowRadius: elite ? (active ? 24 : 18) : active ? 16 : 8,
                shadowOffset: { width: 0, height: elite ? 10 : 6 },
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: plan.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{plan.name.toUpperCase()}</Text>
                  <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 8 }}>{plan.prices[billingCycle].label}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 14 }}>{plan.prices[billingCycle].cadenceLabel}</Text>
                </View>
                {elite ? (
                  <View style={{ backgroundColor: "rgba(103, 232, 249, 0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start" }}>
                    <Text style={{ color: "#dffbff", fontSize: 11, fontWeight: "800" }}>MOST POPULAR</Text>
                  </View>
                ) : null}
              </View>

              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>{plan.summary}</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{plan.description}</Text>
              <Text style={{ color: elite ? "#dffbff" : "#dcecff", fontSize: 13, lineHeight: 19 }}>{copy.bestFor}</Text>
              <Text style={{ color: plan.accent, fontSize: 13, fontWeight: "700" }}>{copy.outcomeCopy}</Text>

              {elite ? (
                <View style={{ backgroundColor: "rgba(103, 232, 249, 0.08)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 12 }}>
                  <Text style={{ color: "#dffbff", fontSize: 12, fontWeight: "800" }}>COACHING-STYLE UPGRADE</Text>
                  <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                    Adaptive training, post-run notes, deeper predictions, and weekly summaries that make the app feel much closer to a real coach.
                  </Text>
                </View>
              ) : null}

              <Text style={{ color: active ? plan.accent : colors.subtext, fontSize: 13, fontWeight: "800" }}>
                {active ? "Selected plan" : "Tap to select"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function UpgradeBillingSelector({
  selected,
  onSelect,
  plan,
}: {
  selected: BillingCycle;
  onSelect: (cycle: BillingCycle) => void;
  plan: UpgradePlan;
}) {
  const { colors } = useThemeColors();
  const savings = getSubscriptionSavings(plan);
  const savingsPercent = getSubscriptionSavingsPercent(plan);

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Choose billing</Text>
      <BillingToggle selected={selected} onSelect={onSelect} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <Text style={{ color: "#67e8f9", fontSize: 13, fontWeight: "700" }}>{`Yearly saves ${savingsPercent.toFixed(0)}% on ${PREMIUM_PLANS[plan].name} and lowers the full-year cost.`}</Text>
        {selected === "yearly" ? <Text style={{ color: "#4ade80", fontSize: 13, fontWeight: "800" }}>{`Save $${savings.toFixed(2)} per year on ${PREMIUM_PLANS[plan].name}`}</Text> : null}
      </View>
    </View>
  );
}

export function PlanBenefits({
  plan,
}: {
  plan: UpgradePlan;
}) {
  const { colors } = useThemeColors();
  const planData = PREMIUM_PLANS[plan];
  const copy = getSubscriptionCopy(plan);
  const features = getSubscriptionFeaturesForPlan(plan);

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{planData.name} benefits</Text>
      <View style={{ backgroundColor: plan === "elite" ? "#132438" : colors.card, borderRadius: 28, borderWidth: 1, borderColor: plan === "elite" ? "rgba(103, 232, 249, 0.18)" : colors.border, padding: 20, gap: 14 }}>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>{copy.bestFor}</Text>
        <Text style={{ color: plan === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 13, fontWeight: "700", lineHeight: 20 }}>{copy.outcomeCopy}</Text>
        <View style={{ gap: 10 }}>
          {features.map((feature) => (
            <View key={feature.key} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <Text style={{ color: plan === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 14, fontWeight: "800" }}>{"\u2022"}</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{feature.title}</Text>
                <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>{feature.summary}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function PaymentSummaryCard({
  plan,
  billingCycle,
  onContinue,
  loading,
}: {
  plan: UpgradePlan;
  billingCycle: BillingCycle;
  onContinue: () => void;
  loading?: boolean;
}) {
  const { colors } = useThemeColors();
  const planData = PREMIUM_PLANS[plan];
  const offering = getSubscriptionOffering(plan);
  const copy = getSubscriptionCopy(plan);
  const price = offering.prices[billingCycle];
  const yearlySavings = billingCycle === "yearly" ? getSubscriptionSavings(plan) : 0;
  const ctaLabel = `${plan === "elite" ? "Start Elite" : "Start Pro"} ${billingCycle === "yearly" ? "Yearly" : "Monthly"}`;

  return (
    <View
      style={{
        backgroundColor: "#142339",
        borderRadius: 30,
        borderWidth: plan === "elite" ? 1.5 : 1,
        borderColor: plan === "elite" ? "rgba(103, 232, 249, 0.26)" : "rgba(103, 232, 249, 0.18)",
        padding: 22,
        gap: 16,
        shadowColor: plan === "elite" ? "#38bdf8" : "#000000",
        shadowOpacity: plan === "elite" ? 0.18 : 0.08,
        shadowRadius: plan === "elite" ? 22 : 10,
        shadowOffset: { width: 0, height: plan === "elite" ? 10 : 4 },
      }}
    >
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>CHECKOUT SUMMARY</Text>
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>{planData.name}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{copy.checkoutHeadline}</Text>

      <View style={{ backgroundColor: "rgba(8, 17, 29, 0.62)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 14, gap: 10 }}>
        <SummaryRow label="Selected plan" value={planData.name} />
        <SummaryRow label="Billing cycle" value={billingCycle === "yearly" ? "Yearly" : "Monthly"} />
        <SummaryRow label="Amount billed today" value={`${price.label}${price.cadenceLabel}`} accent={plan === "elite" ? "#67e8f9" : "#93c5fd"} />
        <SummaryRow label="Yearly savings" value={billingCycle === "yearly" ? `Save $${yearlySavings.toFixed(2)} per year` : `Switch to yearly to save $${getSubscriptionSavings(plan).toFixed(2)}`} accent={billingCycle === "yearly" ? "#4ade80" : undefined} />
        <SummaryRow label="Renewal" value={price.renewalLabel} />
      </View>

      <View style={{ backgroundColor: "rgba(103, 232, 249, 0.06)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 14, gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>What this gives you</Text>
        <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{copy.outcomeCopy}</Text>
        <Text style={{ color: plan === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 12, fontWeight: "700" }}>{copy.bestFor}</Text>
      </View>

      <Pressable
        onPress={onContinue}
        disabled={loading}
        style={{
          minHeight: plan === "elite" ? 58 : 54,
          borderRadius: 18,
          backgroundColor: "#2563eb",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 18,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>{loading ? "Preparing checkout..." : ctaLabel}</Text>
      </Pressable>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {copy.trustCopy.map((item) => (
          <View key={item} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ color: "#dcecff", fontSize: 12, fontWeight: "700" }}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 18 }}>
        Checkout runs through Stripe and returns to NextStride so your paid features can unlock as soon as the subscription sync completes.
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const { colors } = useThemeColors();

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: colors.subtext, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: accent || colors.text, fontSize: 13, fontWeight: "700", textAlign: "right", flexShrink: 1 }}>{value}</Text>
    </View>
  );
}
