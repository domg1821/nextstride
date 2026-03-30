import { router } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import {
  PREMIUM_COMPARISON_ROWS,
  PREMIUM_FEATURES,
  PREMIUM_FOUNDATION_STEPS,
  PREMIUM_PRODUCT,
} from "@/lib/premium-products";
import { useThemeColors } from "@/contexts/theme-context";

const STATUS_COLORS = {
  not_premium: "#64748b",
  upgrade_pending: "#f59e0b",
  premium_active: "#22c55e",
} as const;

export default function PremiumScreen() {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const {
    status,
    statusTitle,
    statusDetail,
    environmentLabel,
    lastMessage,
    beginUpgrade,
    restorePurchases,
    clearPendingState,
  } = usePremium();

  const isWide = width >= 980;
  const isTablet = width >= 760;
  const featureCardWidth = isWide ? "48.8%" : "100%";

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/welcome");
  };

  const handleUpgrade = async () => {
    await beginUpgrade();

    Alert.alert(
      status === "premium_active" ? "Premium active" : "Premium upgrade started",
      Platform.OS === "web"
        ? "The Premium page is ready, but checkout is still a placeholder until website billing is chosen and connected."
        : `The UI is ready for ${environmentLabel.toLowerCase()}, but the real billing SDK and receipt handling still need to be connected.`
    );
  };

  const handleRestore = async () => {
    await restorePurchases();

    Alert.alert(
      "Restore purchases",
      Platform.OS === "web"
        ? "There are no web Premium purchases to restore yet."
        : `Restore is prepared for ${environmentLabel.toLowerCase()}, but receipt validation still needs to be added.`
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: isWide ? 32 : 20,
        paddingTop: 24,
        paddingBottom: 36,
        gap: 22,
        alignSelf: "center",
        width: "100%",
        maxWidth: 1180,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <View
        style={{
          backgroundColor: colors.cardAlt,
          borderRadius: 34,
          borderWidth: 1,
          borderColor: colors.border,
          padding: isWide ? 30 : 24,
          gap: 18,
        }}
      >
        <View
          style={{
            flexDirection: isWide ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isWide ? "flex-start" : "stretch",
            gap: 18,
          }}
        >
          <View style={{ flex: 1, maxWidth: 760 }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {PREMIUM_PRODUCT.name}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: isWide ? 42 : 34,
                fontWeight: "800",
                lineHeight: isWide ? 48 : 40,
                marginTop: 12,
              }}
            >
              {PREMIUM_PRODUCT.tagline}
            </Text>
            <Text
              style={{
                color: colors.subtext,
                fontSize: 15,
                lineHeight: 23,
                marginTop: 12,
                maxWidth: 700,
              }}
            >
              {PREMIUM_PRODUCT.description}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 22,
              paddingVertical: 20,
              minWidth: isWide ? 220 : undefined,
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
              MONTHLY
            </Text>
            <Text style={{ color: colors.text, fontSize: 38, fontWeight: "800", marginTop: 10 }}>
              {PREMIUM_PRODUCT.monthlyPrice}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, marginTop: 6 }}>per month</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            gap: 14,
          }}
        >
          <View
            style={{
              flexDirection: isTablet ? "row" : "column",
              justifyContent: "space-between",
              alignItems: isTablet ? "center" : "flex-start",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: STATUS_COLORS[status],
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "800" }}>{statusTitle}</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 14 }}>
                Premium access is ready for real billing later
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, marginTop: 8 }}>
                {statusDetail}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                minWidth: isTablet ? 260 : "100%",
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                BILLING PATH
              </Text>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 8 }}>
                {environmentLabel}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
                {lastMessage}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12 }}>
            <PrimaryActionButton colors={colors} label="Upgrade to Premium" onPress={handleUpgrade} />
            <SecondaryActionButton colors={colors} label="Restore Purchases" onPress={handleRestore} />
            {status === "upgrade_pending" ? (
              <SecondaryActionButton colors={colors} label="Clear Pending State" onPress={clearPendingState} />
            ) : null}
          </View>

          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
            Native billing is intentionally reserved for future Apple In-App Purchase / StoreKit and Google Play Billing integration. No fake payment success is being stored.
          </Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>What Premium includes</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, maxWidth: 760 }}>
          Every feature is framed around better training decisions, clearer workout execution, and stronger race preparation.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {PREMIUM_FEATURES.map((feature) => (
          <View
            key={feature.title}
            style={{
              width: featureCardWidth,
              backgroundColor: colors.card,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              gap: 10,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.primarySoft,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{feature.badge}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{feature.title}</Text>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700", lineHeight: 20 }}>
              {feature.benefit}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Free vs Premium</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, marginTop: 8 }}>
            The free product stays useful. Premium adds more depth where training decisions matter most.
          </Text>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: colors.cardAlt, padding: 16 }}>
          <ComparisonHeader colors={colors} title="Feature" flex={1.5} />
          <ComparisonHeader colors={colors} title="Free" />
          <ComparisonHeader colors={colors} title="Premium" />
        </View>

        {PREMIUM_COMPARISON_ROWS.map((row, index) => (
          <View
            key={row.feature}
            style={{
              flexDirection: "row",
              padding: 16,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <ComparisonCell colors={colors} value={row.feature} flex={1.5} strong={true} />
            <ComparisonCell colors={colors} value={row.free} />
            <ComparisonCell colors={colors} value={row.premium} premium={true} />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 22,
          gap: 16,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Purchase flow foundation</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>
          The current flow is structured for real subscription billing later instead of baking payment assumptions directly into the screen.
        </Text>

        <View style={{ gap: 12 }}>
          {PREMIUM_FOUNDATION_STEPS.map((item) => (
            <View
              key={item.title}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{item.title}</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                {item.body}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function PrimaryActionButton({
  colors,
  label,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 54,
        backgroundColor: colors.primary,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
      }}
    >
      <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function SecondaryActionButton({
  colors,
  label,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 54,
        backgroundColor: colors.cardAlt,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function ComparisonHeader({
  colors,
  title,
  flex = 1,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  title: string;
  flex?: number;
}) {
  return (
    <View style={{ flex }}>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{title}</Text>
    </View>
  );
}

function ComparisonCell({
  colors,
  value,
  flex = 1,
  strong,
  premium,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  value: string;
  flex?: number;
  strong?: boolean;
  premium?: boolean;
}) {
  return (
    <View style={{ flex }}>
      <Text
        style={{
          color: premium ? colors.primary : strong ? colors.text : colors.subtext,
          fontSize: 13,
          fontWeight: strong || premium ? "700" : "500",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
