import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { buildGoalTrackStatus } from "@/lib/premium-coach";
import { buildUpgradePath } from "@/lib/upgrade-route";

export function OnTrackCard() {
  const { colors } = useThemeColors();
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { hasAccess, getFeatureGate } = usePremium();
  const unlocked = hasAccess("goal_on_track");
  const gate = getFeatureGate("goal_on_track");
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const goalTrack = buildGoalTrackStatus({ profile, workouts: sortedWorkouts });
  const accent = getStatusAccent(goalTrack.state);

  if (unlocked) {
    return (
      <View
        style={{
          backgroundColor: "#12243b",
          borderRadius: 30,
          borderWidth: 1,
          borderColor: `${accent}55`,
          padding: 20,
          gap: 14,
          shadowColor: accent,
          shadowOpacity: 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>ELITE ON TRACK</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>{goalTrack.statusLabel}</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 22 }}>{goalTrack.headline}</Text>
          </View>
          <View
            style={{
              minWidth: 92,
              backgroundColor: "rgba(8, 17, 29, 0.66)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${accent}44`,
              paddingHorizontal: 14,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>READINESS</Text>
            <Text style={{ color: accent, fontSize: 28, fontWeight: "800", marginTop: 4 }}>{goalTrack.progressPercent}%</Text>
          </View>
        </View>

        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{goalTrack.summary}</Text>

        <View
          style={{
            backgroundColor: "rgba(8, 17, 29, 0.62)",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(157, 178, 202, 0.12)",
            padding: 16,
            gap: 10,
          }}
        >
          <MetricRow label="Confidence" value={goalTrack.confidenceLabel} accent={accent} />
          <MetricRow label="Trend" value={goalTrack.trendNote} />
          <MetricRow label="Suggestion" value={goalTrack.suggestion} />
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
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>On Track progress system</Text>
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
        <Text style={{ color: "#4ade80", fontSize: 14, fontWeight: "800" }}>TRENDING UP</Text>
        <Text style={{ color: "#dcecff", fontSize: 15, fontWeight: "700", lineHeight: 21 }}>
          Recent workouts suggest improving race readiness.
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20 }}>{gate.preview}</Text>
      </View>

      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
        Elite unlocks goal tracking and coaching-style progress guidance tied to your recent consistency, race goal, and training trend.
      </Text>

      <Pressable
        onPress={() =>
          router.push(
            buildUpgradePath({
              plan: "elite",
              recommendation: "Best choice for unlocking on-track progress",
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
        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>Unlock Elite goal tracking</Text>
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

function getStatusAccent(state: ReturnType<typeof buildGoalTrackStatus>["state"]) {
  switch (state) {
    case "on_track":
      return "#4ade80";
    case "trending_up":
      return "#67e8f9";
    case "slightly_behind":
      return "#fbbf24";
    default:
      return "#f97316";
  }
}
