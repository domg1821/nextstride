import React from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/contexts/theme-context";
import {
  PREMIUM_COMPARISON_ROWS,
  PREMIUM_FEATURES,
  PREMIUM_PLANS,
  PREMIUM_PRODUCT,
  type BillingCycle,
  type PremiumTier,
  getComparisonCategories,
} from "@/lib/premium-products";

export function PremiumHero() {
  const { colors } = useThemeColors();

  return (
    <View style={{ backgroundColor: "#142339", borderRadius: 36, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.18)", padding: 28, gap: 14 }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.3, textTransform: "uppercase" }}>
        {PREMIUM_PRODUCT.name}
      </Text>
      <Text style={{ color: colors.text, fontSize: 40, fontWeight: "800", lineHeight: 46 }}>
        {PREMIUM_PRODUCT.heroTitle}
      </Text>
      <Text style={{ color: colors.subtext, fontSize: 16, lineHeight: 25, maxWidth: 760 }}>
        {PREMIUM_PRODUCT.heroSubtitle}
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, backgroundColor: "#0f1b2d", borderRadius: 999, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 5 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
          const active = selected === cycle;

          return (
            <Pressable
              key={cycle}
              onPress={() => onSelect(cycle)}
              style={{
                backgroundColor: active ? "#2563eb" : "transparent",
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 11,
              }}
            >
              <Text style={{ color: active ? "#ffffff" : "#c8d7ea", fontSize: 13, fontWeight: "700" }}>
                {cycle === "monthly" ? "Monthly" : "Yearly"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ backgroundColor: "rgba(103, 232, 249, 0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ color: "#dffbff", fontSize: 12, fontWeight: "800" }}>{PREMIUM_PRODUCT.yearlyToggleLabel}</Text>
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
  const plan = PREMIUM_PLANS[tier];
  const active = tier === currentTier;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 280,
        backgroundColor: plan.highlighted ? "#142339" : colors.card,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: plan.highlighted ? "rgba(103, 232, 249, 0.24)" : active ? "rgba(37, 99, 235, 0.3)" : colors.border,
        padding: 22,
        gap: 12,
        shadowColor: plan.highlighted ? "#38bdf8" : "#000000",
        shadowOpacity: plan.highlighted ? 0.16 : 0.06,
        shadowRadius: plan.highlighted ? 22 : 10,
        shadowOffset: { width: 0, height: plan.highlighted ? 8 : 4 },
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: plan.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{plan.name.toUpperCase()}</Text>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", marginTop: 8 }}>{plan.name}</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{plan.summary}</Text>
        </View>
        {plan.highlighted ? (
          <View style={{ backgroundColor: "rgba(103, 232, 249, 0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ color: "#dffbff", fontSize: 11, fontWeight: "800" }}>BEST VALUE</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ color: colors.text, fontSize: 38, fontWeight: "800", marginTop: 4 }}>
        {plan.prices[billingCycle].label}
        <Text style={{ color: colors.subtext, fontSize: 15 }}>{plan.prices[billingCycle].cadenceLabel}</Text>
      </Text>

      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{plan.description}</Text>
      <Text style={{ color: plan.accent, fontSize: 13, fontWeight: "700" }}>{plan.audience}</Text>

      <View style={{ gap: 10, marginTop: 6 }}>
        {plan.featureKeys.slice(0, tier === "elite" ? 8 : 5).map((key) => {
          const feature = PREMIUM_FEATURES.find((item) => item.key === key);
          if (!feature) {
            return null;
          }

          return (
            <Text key={key} style={{ color: "#dcecff", fontSize: 14, lineHeight: 20 }}>
              - {feature.title}
            </Text>
          );
        })}
      </View>

      {plan.yearlySavingsLabel && billingCycle === "yearly" ? (
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", marginTop: 4 }}>{plan.yearlySavingsLabel}</Text>
      ) : null}

      {tier === "elite" ? (
        <View style={{ backgroundColor: "rgba(103, 232, 249, 0.08)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.14)", padding: 12 }}>
          <Text style={{ color: "#dffbff", fontSize: 12, fontWeight: "800" }}>MOST POPULAR FOR SERIOUS RUNNERS</Text>
          <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            Elite is where NextStride starts to feel like a real running coach instead of just a better training app.
          </Text>
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
  const categories = getComparisonCategories();

  return (
    <View style={{ gap: 18 }}>
      {categories.map((category) => (
        <View key={category} style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{category.toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: "row", backgroundColor: colors.cardAlt, padding: 16 }}>
            <ComparisonText label="Feature" flex={1.7} strong={true} />
            <ComparisonText label="Free" strong={true} />
            <ComparisonText label="Pro" strong={true} />
            <ComparisonText label="Elite" strong={true} />
          </View>
          {PREMIUM_COMPARISON_ROWS.filter((row) => row.category === category).map((row, index) => (
            <View key={row.feature} style={{ flexDirection: "row", padding: 16, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <ComparisonText label={row.feature} flex={1.7} strong={true} />
              <ComparisonText label={row.free} />
              <ComparisonText label={row.pro} accent="#93c5fd" />
              <ComparisonText label={row.elite} accent="#67e8f9" />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PremiumAudienceSection() {
  const { colors } = useThemeColors();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
      {(Object.keys(PREMIUM_PLANS) as PremiumTier[]).map((tier) => {
        const plan = PREMIUM_PLANS[tier];

        return (
          <View key={tier} style={{ flex: 1, minWidth: 260, backgroundColor: colors.card, borderRadius: 26, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
            <Text style={{ color: plan.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{plan.name.toUpperCase()}</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 10 }}>{plan.audience}</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, marginTop: 10 }}>{plan.description}</Text>
            <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 20, marginTop: 10 }}>
              {tier === "free"
                ? "Best if you want basic structure, simple tracking, and the core dashboard experience."
                : tier === "pro"
                  ? "Best if you want better tools, clearer feedback, and stronger performance insight without full coaching."
                  : "Best if you want adaptive planning, post-run feedback, and a coaching-style layer built around your goals."}
            </Text>
          </View>
        );
      })}
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
  return (
    <View style={{ backgroundColor: "#142339", borderRadius: 34, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.18)", padding: 28, alignItems: "center" }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>READY TO UPGRADE</Text>
      <Text style={{ color: "#f8fbff", fontSize: 34, fontWeight: "800", marginTop: 12, textAlign: "center" }}>
        Train with the level of support your goals deserve
      </Text>
      <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 12, textAlign: "center", maxWidth: 640 }}>
        Start free, step up to Pro for smarter guidance, or choose Elite when you want coaching-style personalization built into every week.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22, justifyContent: "center" }}>
        <Pressable onPress={onPrimaryPress} style={{ minWidth: 180, minHeight: 52, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>View Elite</Text>
        </Pressable>
        <Pressable onPress={onSecondaryPress} style={{ minWidth: 180, minHeight: 52, borderRadius: 18, backgroundColor: "#0f1b2d", borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
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
    <View style={{ flex }}>
      <Text style={{ color: accent ?? (strong ? colors.text : colors.subtext), fontSize: 13, fontWeight: strong || accent ? "700" : "500" }}>
        {label}
      </Text>
    </View>
  );
}
