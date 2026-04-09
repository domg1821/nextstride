import React from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/contexts/theme-context";
import { useResponsiveLayout } from "@/lib/responsive";
import {
  PREMIUM_COMPARISON_ROWS,
  PREMIUM_FEATURES,
  PREMIUM_PLANS,
  PREMIUM_PRODUCT,
  type BillingCycle,
  type PremiumTier,
} from "@/lib/premium-products";

export function PremiumHero() {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();

  return (
    <View style={{ backgroundColor: "#142339", borderRadius: 32, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.18)", padding: layout.isPhone ? 18 : 24, gap: 10 }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.3, textTransform: "uppercase" }}>
        {PREMIUM_PRODUCT.name}
      </Text>
      <Text style={{ color: colors.text, fontSize: layout.isPhone ? 28 : layout.width >= 768 ? 34 : 38, fontWeight: "800", lineHeight: layout.isPhone ? 34 : layout.width >= 768 ? 40 : 44 }}>
        Upgrade when you want more guidance
      </Text>
      <Text style={{ color: colors.subtext, fontSize: layout.isPhone ? 14 : 15, lineHeight: layout.isPhone ? 21 : 23, maxWidth: 640 }}>
        Free gives you the core plan. Pro adds insight. Elite adds coach-style support.
      </Text>
    </View>
  );
}

export function BillingToggle({
  selected,
  onSelect,
}: {
  selected: BillingCycle;
  onSelect: (cycle: BillingCycle) => void;
}) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ flexDirection: layout.width >= 768 ? "row" : "column", alignItems: layout.width >= 768 ? "center" : "stretch", justifyContent: "space-between", gap: 10, backgroundColor: "#0f1b2d", borderRadius: 22, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 5, width: layout.width >= 768 ? undefined : "100%", minWidth: 0 }}>
      <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", minWidth: 0 }}>
        {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
          const active = selected === cycle;

          return (
            <Pressable
              key={cycle}
              onPress={() => onSelect(cycle)}
              style={{
                backgroundColor: active ? "#2563eb" : "transparent",
                borderRadius: 999,
                paddingHorizontal: layout.isPhone ? 14 : 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: active ? "#ffffff" : "#c8d7ea", fontSize: 13, fontWeight: "700" }}>
                {cycle === "monthly" ? "Monthly" : "Yearly"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ backgroundColor: "rgba(103, 232, 249, 0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, alignSelf: layout.width >= 768 ? "auto" : "flex-start" }}>
        <Text style={{ color: "#dffbff", fontSize: 12, lineHeight: 16, fontWeight: "800" }}>Save yearly</Text>
      </View>
    </View>
  );
}

export function PremiumPlanCard({
  tier,
  billingCycle,
  currentTier,
  onPress,
}: {
  tier: PremiumTier;
  billingCycle: BillingCycle;
  currentTier: PremiumTier;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();
  const plan = PREMIUM_PLANS[tier];
  const active = tier === currentTier;
  const highlightedFeatures = plan.featureKeys.slice(0, tier === "elite" ? 3 : 2);

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        minWidth: layout.isDesktop ? 280 : layout.width >= 768 ? 240 : 0,
        backgroundColor: plan.highlighted ? "#142339" : colors.card,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: plan.highlighted ? "rgba(103, 232, 249, 0.24)" : active ? "rgba(37, 99, 235, 0.3)" : colors.border,
        padding: layout.isPhone ? 16 : 18,
        gap: 8,
        shadowColor: plan.highlighted ? "#38bdf8" : "#000000",
        shadowOpacity: plan.highlighted ? 0.16 : 0.06,
        shadowRadius: plan.highlighted ? 22 : 10,
        shadowOffset: { width: 0, height: plan.highlighted ? 8 : 4 },
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: plan.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{plan.name.toUpperCase()}</Text>
          <Text style={{ color: colors.text, fontSize: layout.isPhone ? 25 : 28, lineHeight: layout.isPhone ? 31 : 33, fontWeight: "800", marginTop: 6 }}>{plan.name}</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 18, marginTop: 6 }}>{shortPlanSummary(tier)}</Text>
        </View>
        {plan.highlighted ? (
          <View style={{ backgroundColor: "rgba(103, 232, 249, 0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ color: "#dffbff", fontSize: 11, fontWeight: "800" }}>BEST VALUE</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ color: colors.text, fontSize: layout.isPhone ? 31 : 34, lineHeight: layout.isPhone ? 35 : 38, fontWeight: "800", marginTop: 2 }}>
        {plan.prices[billingCycle].label}
        <Text style={{ color: colors.subtext, fontSize: 15 }}>{plan.prices[billingCycle].cadenceLabel}</Text>
      </Text>

      <Text style={{ color: plan.accent, fontSize: 13, lineHeight: 18, fontWeight: "700" }}>{shortAudience(tier)}</Text>

      <View style={{ gap: 6, marginTop: 2 }}>
        {highlightedFeatures.map((key) => {
          const feature = PREMIUM_FEATURES.find((item) => item.key === key);
          if (!feature) {
            return null;
          }

          return (
            <Text key={key} style={{ color: "#dcecff", fontSize: 12.5, lineHeight: 17 }}>
              {`\u2022 ${feature.title}`}
            </Text>
          );
        })}
      </View>

      {plan.yearlySavingsLabel && billingCycle === "yearly" ? (
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", marginTop: 4 }}>{plan.yearlySavingsLabel}</Text>
      ) : null}

      {tier === "elite" ? (
        <View style={{ backgroundColor: "rgba(103, 232, 249, 0.08)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.14)", padding: 10 }}>
          <Text style={{ color: "#dffbff", fontSize: 12, fontWeight: "800" }}>Best for full guidance</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        style={{
          marginTop: 10,
          minHeight: 52,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tier === "elite" ? "#2563eb" : "#0f1b2d",
          borderWidth: 1,
          borderColor: tier === "elite" ? "rgba(103, 232, 249, 0.32)" : colors.border,
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>{plan.cta}</Text>
      </Pressable>
    </View>
  );
}

export function PremiumFeatureComparison() {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();
  const featuredRows = PREMIUM_COMPARISON_ROWS.filter((row) =>
    [
      "Adaptive training",
      "Post-run feedback",
      "Heart rate guidance",
      "Fueling suggestions",
      "Race predictions",
      "Advanced training insights",
    ].includes(row.feature)
  );

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>KEY DIFFERENCES</Text>
      </View>
      <View style={{ flexDirection: "row", backgroundColor: colors.cardAlt, padding: layout.isPhone ? 10 : 14 }}>
        <ComparisonText label="Feature" flex={1.7} strong={true} />
        <ComparisonText label="Free" strong={true} />
        <ComparisonText label="Pro" strong={true} />
        <ComparisonText label="Elite" strong={true} />
      </View>
      {featuredRows.map((row, index) => (
        <View key={row.feature} style={{ flexDirection: "row", padding: layout.isPhone ? 10 : 14, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}>
          <ComparisonText label={row.feature} flex={1.7} strong={true} />
          <ComparisonText label={row.free} />
          <ComparisonText label={row.pro} accent="#93c5fd" />
          <ComparisonText label={row.elite} accent="#67e8f9" />
        </View>
      ))}
    </View>
  );
}

export function PremiumFinalCta({
  onPrimaryPress,
  onSecondaryPress,
}: {
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
}) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ backgroundColor: "#142339", borderRadius: 34, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.18)", padding: layout.isPhone ? 22 : 28, alignItems: "center" }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>READY TO UPGRADE</Text>
      <Text style={{ color: "#f8fbff", fontSize: layout.isPhone ? 28 : 34, lineHeight: layout.isPhone ? 34 : 40, fontWeight: "800", marginTop: 12, textAlign: "center" }}>
        Pick the level that fits your goals
      </Text>
      <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 12, textAlign: "center", maxWidth: 560 }}>
        Pro adds sharper feedback. Elite adds the most support.
      </Text>
      <View style={{ flexDirection: layout.width >= 768 ? "row" : "column", width: layout.width >= 768 ? undefined : "100%", gap: 12, marginTop: 20, justifyContent: "center" }}>
        <Pressable onPress={onPrimaryPress} style={{ minWidth: layout.width >= 768 ? 180 : 0, minHeight: 52, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>View Elite</Text>
        </Pressable>
        <Pressable onPress={onSecondaryPress} style={{ minWidth: layout.width >= 768 ? 180 : 0, minHeight: 52, borderRadius: 18, backgroundColor: "#0f1b2d", borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
          <Text style={{ color: "#dcecff", fontSize: 15, fontWeight: "800" }}>Start Free</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ComparisonText({
  label,
  flex = 1,
  strong,
  accent,
}: {
  label: string;
  flex?: number;
  strong?: boolean;
  accent?: string;
}) {
  const { colors } = useThemeColors();

  return (
    <View style={{ flex, minWidth: 0, paddingRight: 6 }}>
      <Text style={{ color: accent ?? (strong ? colors.text : colors.subtext), fontSize: 13, lineHeight: 18, fontWeight: strong || accent ? "700" : "500" }}>
        {label}
      </Text>
    </View>
  );
}

function shortPlanSummary(tier: PremiumTier) {
  switch (tier) {
    case "free":
      return "Weekly plan and core tracking.";
    case "pro":
      return "Sharper feedback and better training reads.";
    case "elite":
      return "Adaptive support with the deepest guidance.";
  }
}

function shortAudience(tier: PremiumTier) {
  switch (tier) {
    case "free":
      return "For runners who want a simple plan.";
    case "pro":
      return "For runners who want more insight.";
    case "elite":
      return "For runners who want coach-style support.";
  }
}
