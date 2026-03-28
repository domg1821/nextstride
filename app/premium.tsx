import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useThemeColors } from "./theme-context";

const PREMIUM_BLOCKS = [
  {
    title: "Heart Rate Guided Training",
    body: "Workouts include clearer target zones so aerobic, tempo, and hard days stay in the right effort range.",
  },
  {
    title: "Fueling Guidance",
    body: "Get practical pre-run, long-run, and recovery fueling suggestions that feel runner-specific instead of generic.",
  },
  {
    title: "Adaptive Training Adjustments",
    body: "Plans respond to completed workouts, missed sessions, effort levels, and consistency so the week feels smarter.",
  },
  {
    title: "Race Predictor + Training Insights",
    body: "See updated race predictions, confidence context, and recent-trend feedback grounded in your training history.",
  },
  {
    title: "Advanced Coach Features",
    body: "Unlock deeper coach feedback, more personalized answers, and better suggestions based on goals, profile, and training.",
  },
  {
    title: "Recovery & Readiness Insights",
    body: "See high-effort follow-up suggestions, recovery nudges, and warnings when the recent load looks too heavy.",
  },
];

const COMPARISON_ROWS = [
  ["Basic training plan", "Included", "Included"],
  ["Workout logging", "Included", "Included"],
  ["Progress tracking", "Included", "Included"],
  ["AI coach basics", "Included", "Included"],
  ["Heart rate guidance", "-", "Included"],
  ["Fueling guidance", "-", "Included"],
  ["Adaptive plan adjustments", "Basic", "Advanced"],
  ["Race predictor", "Basic", "Deeper explanations"],
  ["Advanced insights", "-", "Included"],
  ["Weekly training summary", "-", "Included"],
];

export default function PremiumScreen() {
  const { colors } = useThemeColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>Back</Text>
      </Pressable>

      <View
        style={{
          backgroundColor: colors.cardAlt,
          borderRadius: 30,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 14,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
          NEXTSTRIDE PREMIUM
        </Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40 }}>
          More guidance. Better decisions. Better racing.
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 22, maxWidth: 680 }}>
          Premium is designed to help runners train better and race better with practical guidance, stronger context, and smarter adjustments around the work they are actually doing.
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            alignSelf: "flex-start",
            minWidth: 180,
          }}
        >
          <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>PRICE</Text>
          <Text style={{ color: colors.text, fontSize: 36, fontWeight: "800", marginTop: 8 }}>
            $2.50
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, marginTop: 4 }}>per month</Text>
        </View>

        <Pressable
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>Unlock Premium</Text>
        </Pressable>

        <Text style={{ color: colors.subtext, fontSize: 13 }}>
          Purchase flow placeholder for now. No payment processing is connected yet.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {PREMIUM_BLOCKS.map((block) => (
          <View
            key={block.title}
            style={{
              width: "47.8%",
              backgroundColor: colors.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{block.title}</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 10 }}>
              {block.body}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", backgroundColor: colors.cardAlt, padding: 16 }}>
          <TableHeader colors={colors} title="Feature" flex={1.5} />
          <TableHeader colors={colors} title="Free" />
          <TableHeader colors={colors} title="Premium" />
        </View>
        {COMPARISON_ROWS.map((row, index) => (
          <View
            key={row[0]}
            style={{
              flexDirection: "row",
              padding: 16,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <TableCell colors={colors} value={row[0]} flex={1.5} strong={true} />
            <TableCell colors={colors} value={row[1]} />
            <TableCell colors={colors} value={row[2]} premium={true} />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          gap: 12,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>Premium goes further with</Text>
        {[
          "Advanced statistics dashboard",
          "Deeper calendar planning tools",
          "Future race prep mode",
          "Long-run guidance",
          "Shoe rotation insights",
          "Premium weekly training summary",
        ].map((item) => (
          <Text key={item} style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
            {`\u2022 ${item}`}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function TableHeader({
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

function TableCell({
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
      <Text style={{ color: premium ? colors.primary : strong ? colors.text : colors.subtext, fontSize: 13, fontWeight: strong || premium ? "700" : "500" }}>
        {value}
      </Text>
    </View>
  );
}
