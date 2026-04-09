import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BillingToggle,
  PremiumFeatureComparison,
  PremiumFinalCta,
  PremiumHero,
  PremiumPlanCard,
} from "@/components/premium-pricing";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import { PREMIUM_PLANS, type PremiumTier } from "@/lib/premium-products";
import { useResponsiveLayout } from "@/lib/responsive";
import { buildUpgradePath } from "@/lib/upgrade-route";

export default function PremiumScreen() {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const {
    tier,
    status,
    statusTitle,
    environmentLabel,
    lastMessage,
    selectedBillingCycle,
    setSelectedBillingCycle,
    restorePurchases,
    clearPendingState,
  } = usePremium();
  const isWide = width >= 1080;
  const pageBottomPadding = Math.max(40, insets.bottom + 28);

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/welcome");
  };

  const handleUpgrade = (targetTier: PremiumTier) => {
    if (targetTier === "free") {
      router.push("/signup");
      return;
    }

    router.push(buildUpgradePath({ plan: targetTier, billing: selectedBillingCycle }));
  };

  const handleRestore = async () => {
    const result = await restorePurchases();

    Alert.alert(
      result.status === "active" ? "Subscription synced" : "No active subscription found",
      result.message
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: isWide ? 32 : width >= 768 ? 24 : 20, paddingTop: Math.max(24, insets.top + 12), paddingBottom: pageBottomPadding, gap: layout.isPhone ? 18 : 20, width: "100%", maxWidth: 1120, alignSelf: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PremiumHero />

      <View style={{ backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: layout.isPhone ? 16 : 18, gap: 10 }}>
        <View style={{ flexDirection: width >= 768 ? "row" : "column", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>CURRENT PLAN</Text>
            <Text style={{ color: colors.text, fontSize: layout.isPhone ? 18 : 20, lineHeight: layout.isPhone ? 24 : 26, fontWeight: "800", marginTop: 6 }}>
              {PREMIUM_PLANS[tier].name} plan
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {statusTitle}. {environmentLabel}.
            </Text>
          </View>
          <BillingToggle selected={selectedBillingCycle} onSelect={setSelectedBillingCycle} />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: layout.isPhone ? 24 : 26, fontWeight: "800" }}>Free vs Pro vs Elite</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, maxWidth: 680 }}>
          Free handles the basics. Pro adds sharper insight. Elite adds coach-style guidance.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {(["free", "pro", "elite"] as PremiumTier[]).map((planTier) => (
          <PremiumPlanCard key={planTier} tier={planTier} billingCycle={selectedBillingCycle} currentTier={tier} onPress={() => handleUpgrade(planTier)} />
        ))}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: layout.isPhone ? 24 : 26, fontWeight: "800" }}>What changes when you upgrade</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, maxWidth: 680 }}>
          The clearest differences, at a glance.
        </Text>
      </View>

      <PremiumFeatureComparison />

      <PremiumFinalCta onPrimaryPress={() => handleUpgrade("elite")} onSecondaryPress={() => handleUpgrade("free")} />

      <View style={{ flexDirection: width >= 768 ? "row" : "column", flexWrap: "wrap", gap: 12 }}>
        <Pressable onPress={() => handleUpgrade("elite")} style={{ flex: width >= 768 ? 1 : undefined, width: width >= 768 ? undefined : "100%", minHeight: 50, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>Choose Elite</Text>
        </Pressable>
        <Pressable onPress={() => handleUpgrade("pro")} style={{ flex: width >= 768 ? 1 : undefined, width: width >= 768 ? undefined : "100%", minHeight: 50, borderRadius: 18, backgroundColor: "#0f1b2d", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>Choose Pro</Text>
        </Pressable>
        <Pressable onPress={handleRestore} style={{ flex: width >= 768 ? 1 : undefined, width: width >= 768 ? undefined : "100%", minHeight: 50, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Restore</Text>
        </Pressable>
        {status === "upgrade_pending" ? (
          <Pressable onPress={clearPendingState} style={{ flex: width >= 768 ? 1 : undefined, width: width >= 768 ? undefined : "100%", minHeight: 50, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Clear Pending</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
        {lastMessage}
      </Text>
    </ScrollView>
  );
}
