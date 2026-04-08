import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { AnimatedProgressBar, FadeInView } from "@/components/ui-polish";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { evaluateAdaptiveTraining } from "@/lib/adaptive-training";
import { buildAdaptiveWeeklyPlan } from "@/lib/training-plan";
import { buildUpgradePath } from "@/lib/upgrade-route";

export function AdaptiveTrainingCard() {
  const { colors } = useThemeColors();
  const { profile } = useProfile();
  const { workouts, completedWorkoutIds, skippedWorkoutIds, likedWorkoutCategories, planCycle } = useWorkouts();
  const { hasAccess, getFeatureGate } = usePremium();
  const unlocked = hasAccess("adaptive_training");
  const gate = getFeatureGate("adaptive_training");
  const mileageGoal = Number.parseFloat(profile.mileage) || 24;

  const weeklyPlan = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        String(mileageGoal),
        profile.pr5k || "",
        likedWorkoutCategories,
        planCycle,
        { runnerLevel: profile.runnerLevel, preferredTrainingDays: profile.preferredTrainingDays },
        {
          workouts: workouts.map((workout) => ({
            date: workout.date,
            effort: workout.effort,
            notes: workout.notes,
            distance: workout.distance,
          })),
          completedWorkoutIds,
        }
      ).plan,
    [completedWorkoutIds, likedWorkoutCategories, mileageGoal, planCycle, profile.goalEvent, profile.preferredTrainingDays, profile.pr5k, profile.runnerLevel, workouts]
  );

  const adaptiveResult = useMemo(
    () =>
      evaluateAdaptiveTraining({
        profile,
        workouts,
        plannedWorkouts: weeklyPlan,
        completedWorkoutIds,
        skippedWorkoutIds,
      }),
    [completedWorkoutIds, profile, skippedWorkoutIds, weeklyPlan, workouts]
  );

  const accent = getStatusAccent(adaptiveResult.status);
  const statusLabel = getStatusLabel(adaptiveResult.status);
  const progressValue = adaptiveResult.status === "increase" ? 78 : adaptiveResult.status === "hold" ? 58 : 34;

  if (unlocked) {
    return (
      <FadeInView delay={120}>
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
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 18,
            right: 18,
            height: 2,
            borderRadius: 999,
            backgroundColor: `${accent}55`,
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>ELITE ADAPTIVE TRAINING</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>{statusLabel}</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 22 }}>{adaptiveResult.summary}</Text>
          </View>
          <View
            style={{
              minWidth: 108,
              backgroundColor: "rgba(8, 17, 29, 0.66)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${accent}44`,
              paddingHorizontal: 14,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>NEXT WEEK</Text>
            <Text style={{ color: accent, fontSize: 24, fontWeight: "800", marginTop: 4 }}>{statusLabel}</Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
              NEXT WEEK LOAD
            </Text>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "800" }}>{statusLabel.toUpperCase()}</Text>
          </View>
          <AnimatedProgressBar
            progress={progressValue}
            fillColor={accent}
            trackColor="rgba(255,255,255,0.08)"
            height={8}
          />
        </View>

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
          <MetricRow label="Reason" value={adaptiveResult.reason} accent={accent} />
          <MetricRow label="Suggestion" value={adaptiveResult.suggestion} />
        </View>
        </View>
      </FadeInView>
    );
  }

  return (
    <FadeInView delay={120}>
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
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Adaptive training adjustments</Text>
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
        <Text style={{ color: "#67e8f9", fontSize: 14, fontWeight: "800" }}>HOLD</Text>
        <Text style={{ color: "#dcecff", fontSize: 15, fontWeight: "700", lineHeight: 21 }}>
          Consistency is solid. Keeping your training progression steady.
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20 }}>{gate.preview}</Text>
      </View>

      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
        Unlock adaptive training to get personalized coaching adjustments before next week starts to drift.
      </Text>

      <Pressable
        onPress={() =>
          router.push(
            buildUpgradePath({
              plan: "elite",
              recommendation: "Unlock adaptive training to get personalized coaching adjustments",
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
        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>Unlock Elite adaptive training</Text>
      </Pressable>
      </View>
    </FadeInView>
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

function getStatusLabel(status: "increase" | "hold" | "reduce") {
  switch (status) {
    case "increase":
      return "Increase";
    case "reduce":
      return "Reduce";
    default:
      return "Hold";
  }
}

function getStatusAccent(status: "increase" | "hold" | "reduce") {
  switch (status) {
    case "increase":
      return "#4ade80";
    case "reduce":
      return "#f97316";
    default:
      return "#67e8f9";
  }
}
