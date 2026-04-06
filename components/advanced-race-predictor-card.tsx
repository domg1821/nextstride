import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { buildDynamicRacePrediction } from "@/lib/premium-coach";
import { buildUpgradePath } from "@/lib/upgrade-route";

export function AdvancedRacePredictorCard() {
  const { colors } = useThemeColors();
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { hasAccess, getFeatureGate } = usePremium();
  const unlocked = hasAccess("race_prediction_advanced");
  const gate = getFeatureGate("race_prediction_advanced");
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const prediction = buildDynamicRacePrediction(profile, sortedWorkouts);
  const trendAccent = getTrendAccent(prediction.trendDirection);

  if (unlocked) {
    return (
      <View
        style={{
          backgroundColor: "#12243b",
          borderRadius: 30,
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.18)",
          padding: 20,
          gap: 14,
          shadowColor: "#2563eb",
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>ELITE RACE PREDICTOR</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>{prediction.eventLabel}</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{prediction.summary}</Text>
          </View>
          <View
            style={{
              minWidth: 120,
              backgroundColor: "rgba(8, 17, 29, 0.66)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(103, 232, 249, 0.12)",
              paddingHorizontal: 14,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>PROJECTED</Text>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 4 }}>
              {prediction.predictedTime || "--"}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "rgba(8, 17, 29, 0.58)",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.1)",
            padding: 16,
            gap: 10,
          }}
        >
          <MetricRow label="Trend" value={prediction.trendLabel} accent={trendAccent} />
          <MetricRow label="Confidence" value={prediction.confidenceLabel} accent="#67e8f9" />
          <MetricRow label="Read" value={prediction.explanation} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#101f34",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.16)",
        padding: 20,
        gap: 14,
      }}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>ELITE PREVIEW</Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Advanced race predictor</Text>
      </View>

      <View
        style={{
          backgroundColor: "rgba(8, 17, 29, 0.58)",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.12)",
          padding: 16,
          gap: 8,
          opacity: 0.84,
        }}
      >
        <Text style={{ color: "#dcecff", fontSize: 15, fontWeight: "700" }}>Projected {prediction.eventLabel}: {prediction.predictedTime || "18:12"}</Text>
        <Text style={{ color: trendAccent, fontSize: 13, fontWeight: "800" }}>{prediction.trendLabel}</Text>
        <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20 }}>
          {prediction.explanation || gate.preview}
        </Text>
      </View>

      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
        Elite adds a deeper race read with trend direction, confidence, and a more coaching-style explanation of what your recent training suggests.
      </Text>

      <Pressable
        onPress={() =>
          router.push(
            buildUpgradePath({
              plan: "elite",
              recommendation: "Best choice for unlocking advanced race prediction",
            })
          )
        }
        style={{
          alignSelf: "flex-start",
          minHeight: 46,
          borderRadius: 16,
          backgroundColor: "#2563eb",
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>Unlock Elite predictor</Text>
      </Pressable>
    </View>
  );
}

function MetricRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19 }}>{value}</Text>
    </View>
  );
}

function getTrendAccent(trend: ReturnType<typeof buildDynamicRacePrediction>["trendDirection"]) {
  switch (trend) {
    case "up":
      return "#4ade80";
    case "steady":
      return "#67e8f9";
    default:
      return "#fbbf24";
  }
}
