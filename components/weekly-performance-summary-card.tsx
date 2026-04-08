import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { FadeInView } from "@/components/ui-polish";
import { WorkoutEffortChip } from "@/components/workout-effort-chip";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { buildWeeklyPerformanceSummary } from "@/lib/premium-coach";
import { buildAdaptiveWeeklyPlan } from "@/lib/training-plan";
import { buildUpgradePath } from "@/lib/upgrade-route";
import { getLoggedWorkoutEffortGuidance } from "@/lib/workout-effort";
import { getWeeklySummary } from "@/utils/workout-utils";

export function WeeklyPerformanceSummaryCard() {
  const { colors } = useThemeColors();
  const { profile } = useProfile();
  const { workouts, completedWorkoutIds, likedWorkoutCategories, planCycle } = useWorkouts();
  const { hasAccess, getFeatureGate } = usePremium();
  const unlocked = hasAccess("weekly_performance_summaries");
  const gate = getFeatureGate("weekly_performance_summaries");
  const mileageGoal = Number.parseFloat(profile.mileage) || 24;
  const weeklyPlan = buildAdaptiveWeeklyPlan(
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
  ).plan;
  const summary = buildWeeklyPerformanceSummary({
    profile,
    workouts,
    weeklyPlan,
    completedWorkoutIds,
  });
  const weeklyEffort = getWeeklySummary(workouts).averageEffort;
  const weeklyEffortGuidance = getLoggedWorkoutEffortGuidance({ effort: weeklyEffort });

  if (unlocked) {
    return (
      <FadeInView delay={150}>
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
        <View style={{ gap: 8 }}>
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>ELITE WEEKLY REVIEW</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{summary.headline}</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{summary.summary}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <MetricChip label="Runs" value={String(summary.totalRuns)} />
          <MetricChip label="Mileage" value={`${summary.totalMiles.toFixed(1)} mi`} />
          <MetricChip label="Key work" value={`${summary.keyWorkoutsCompleted}`} />
          <MetricChip label="Consistency" value={summary.consistencyLabel} accent={summary.onTrack ? "#4ade80" : "#67e8f9"} />
        </View>

        {weeklyEffort !== null ? (
          <View style={{ gap: 8 }}>
            <WorkoutEffortChip guidance={weeklyEffortGuidance} />
            <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
              {weeklyEffortGuidance.shortDescription}. {weeklyEffortGuidance.beginnerTip}
            </Text>
          </View>
        ) : null}

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
          <SummaryRow label="Takeaway" body={summary.takeaway} />
          <SummaryRow label="Next week" body={summary.nextWeekSuggestion} accent="#67e8f9" />
        </View>
        </View>
      </FadeInView>
    );
  }

  return (
    <FadeInView delay={150}>
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
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Weekly performance summary</Text>
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
        <Text style={{ color: "#dcecff", fontSize: 15, fontWeight: "700", lineHeight: 21 }}>
          You stayed consistent this week and completed your key workout. That&apos;s a strong foundation to build on.
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20 }}>{gate.preview}</Text>
      </View>

      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
        Elite unlocks weekly coaching insights that turn your logged work into a clear review and a smarter next step.
      </Text>

      <Pressable
        onPress={() =>
          router.push(
            buildUpgradePath({
              plan: "elite",
              recommendation: "Best choice for unlocking weekly performance summaries",
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
        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>Unlock Elite weekly review</Text>
      </Pressable>
      </View>
    </FadeInView>
  );
}

function MetricChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View
      style={{
        minWidth: 120,
        backgroundColor: "rgba(8, 17, 29, 0.58)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(157, 178, 202, 0.1)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: "#9db2ca", fontSize: 11, fontWeight: "700" }}>{label.toUpperCase()}</Text>
      <Text style={{ color: accent || "#f8fbff", fontSize: 16, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19 }}>{body}</Text>
    </View>
  );
}
