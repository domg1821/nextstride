import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useThemeColors } from "@/contexts/theme-context";
import { normalizeBillingCycle, normalizeUpgradePlan } from "@/lib/upgrade-route";

export default function BillingCancelScreen() {
  const { colors } = useThemeColors();
  const params = useLocalSearchParams<{ plan?: string; billing?: string }>();
  const plan = normalizeUpgradePlan(params.plan);
  const billing = typeof params.billing === "string" ? normalizeBillingCycle(params.billing) : "yearly";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40, gap: 22, width: "100%", maxWidth: 880, alignSelf: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ backgroundColor: colors.card, borderRadius: 32, borderWidth: 1, borderColor: colors.border, padding: 24, gap: 12 }}>
        <Text style={{ color: "#93c5fd", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>CHECKOUT CANCELED</Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40 }}>No charge was completed.</Text>
        <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 24 }}>
          Your {plan === "elite" ? "Elite" : "Pro"} {billing} checkout was canceled before payment finished. You can head back to upgrade whenever you are ready.
        </Text>
      </View>

      <View style={{ backgroundColor: colors.cardAlt, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>What happens next</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>
          Your current plan stays the same, and no premium access changes were applied. You can return to the upgrade flow to compare plans again or continue training on your current plan.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Pressable
          onPress={() => router.replace({ pathname: "/upgrade", params: { plan, billing } })}
          style={{ flex: 1, minWidth: 220, minHeight: 54, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}
        >
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>Return to Upgrade</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/")}
          style={{ flex: 1, minWidth: 220, minHeight: 54, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Back to Dashboard</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
