import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { PremiumFeatureExperiences } from "@/components/premium-feature-experiences";
import {
  BillingToggle,
  PremiumAudienceSection,
  PremiumFeatureComparison,
  PremiumFinalCta,
  PremiumHero,
  PremiumPlanCard,
} from "@/components/premium-pricing";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import { PREMIUM_PLANS, type PremiumTier } from "@/lib/premium-products";
import { buildUpgradePath } from "@/lib/upgrade-route";

export default function PremiumScreen() {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const {
    tier,
    status,
    statusTitle,
    statusDetail,
    environmentLabel,
    lastMessage,
    selectedBillingCycle,
    setSelectedBillingCycle,
    restorePurchases,
    clearPendingState,
  } = usePremium();
  const isWide = width >= 1080;

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
      contentContainerStyle={{ paddingHorizontal: isWide ? 32 : 20, paddingTop: 24, paddingBottom: 40, gap: 22, width: "100%", maxWidth: 1200, alignSelf: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PremiumHero />

      <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 }}>
        <View style={{ flexDirection: isWide ? "row" : "column", justifyContent: "space-between", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{statusTitle}</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, marginTop: 8 }}>{statusDetail}</Text>
          </View>
          <BillingToggle selected={selectedBillingCycle} onSelect={setSelectedBillingCycle} />
        </View>

        <View style={{ backgroundColor: colors.cardAlt, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>BILLING STATUS</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 8 }}>
            {PREMIUM_PLANS[tier].name} plan
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
            {environmentLabel}. {lastMessage}
          </Text>
        </View>

        <View style={{ flexDirection: isWide ? "row" : "column", gap: 12 }}>
          <Pressable onPress={() => handleUpgrade("elite")} style={{ flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>Choose Elite</Text>
          </Pressable>
          <Pressable onPress={() => handleUpgrade("pro")} style={{ flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: "#0f1b2d", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>Choose Pro</Text>
          </Pressable>
          <Pressable onPress={handleRestore} style={{ flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Restore</Text>
          </Pressable>
          {status === "upgrade_pending" ? (
            <Pressable onPress={clearPendingState} style={{ flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Clear Pending</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Plans</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, maxWidth: 760 }}>
          Start with the essentials, step into smarter guidance, or unlock the full coaching-style layer.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {(["free", "pro", "elite"] as PremiumTier[]).map((planTier) => (
          <PremiumPlanCard key={planTier} tier={planTier} billingCycle={selectedBillingCycle} currentTier={tier} onPress={() => handleUpgrade(planTier)} />
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Compare features</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, maxWidth: 760 }}>
          Every plan is built around clearer value, with Elite positioned as the strongest option for runners chasing serious progress.
        </Text>
      </View>

      <PremiumFeatureComparison />

      <PremiumFeatureExperiences />

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Who each plan is for</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, maxWidth: 760 }}>
          Choose the level of support that matches how much guidance and personalization you want from the platform.
        </Text>
      </View>

      <PremiumAudienceSection />

      <PremiumFinalCta onPrimaryPress={() => handleUpgrade("elite")} onSecondaryPress={() => handleUpgrade("free")} />
    </ScrollView>
  );
}
