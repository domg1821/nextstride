import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { AdaptiveTrainingCard } from "@/components/adaptive-training-card";
import { OnTrackCard } from "@/components/on-track-card";
import { TodayWorkoutCard } from "@/components/today-workout-card";
import { WeeklyPerformanceSummaryCard } from "@/components/weekly-performance-summary-card";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { getAdaptiveCoachRecommendations, getInsightsSummary, getWeeklyGoalProgress } from "@/utils/training-insights";
import { useThemeColors } from "@/contexts/theme-context";
import { buildAdaptiveWeeklyPlan } from "@/lib/training-plan";
import { useWorkouts } from "@/contexts/workout-context";
import { getStreakSummary, getWeeklySummary } from "@/utils/workout-utils";

export default function Home() {
  const { profile, displayName, heartRateZones } = useProfile();
  const { workouts, completedWorkoutIds, likedWorkoutCategories, planCycle } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();

  const mileageGoal = parseFloat(profile.mileage) || 30;
  const weeklyGoal = useMemo(() => getWeeklyGoalProgress(workouts, mileageGoal), [mileageGoal, workouts]);
  const weeklySummary = useMemo(() => getWeeklySummary(workouts), [workouts]);
  const streakSummary = useMemo(() => getStreakSummary(workouts.map((workout) => workout.date)), [workouts]);

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

  const guidanceInsights = useMemo(() => getAdaptiveCoachRecommendations(workouts, mileageGoal), [mileageGoal, workouts]);
  const insightMessages = useMemo(() => getInsightsSummary(workouts, mileageGoal), [mileageGoal, workouts]);

  const primaryInsight = guidanceInsights[0]
    ? { eyebrow: "Guide insight", title: guidanceInsights[0].title, detail: guidanceInsights[0].detail }
    : insightMessages[0]
      ? { eyebrow: "Training insight", title: insightMessages[0].title, detail: "A single useful read to keep the rest of the week focused." }
      : { eyebrow: "Daily focus", title: "Keep the week simple", detail: "Open today's workout, hit the planned purpose, and let the rest of the week build from there." };

  return (
    <AnimatedTabScene tabKey="index">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={displayName} showName={true} onAvatarPress={openDrawer} />

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>SOLO RUNNER DASHBOARD</Text>
          <Text style={{ color: colors.text, fontSize: 33, fontWeight: "800", lineHeight: 39 }}>Know exactly what to do today.</Text>
          <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23, maxWidth: 640 }}>
            Your plan should remove decision-making. Open the app, see today's session, understand why it matters, and get moving.
          </Text>
        </View>

        <TodayWorkoutCard
          plan={weeklyPlan}
          completedWorkoutIds={completedWorkoutIds}
          heartRateZones={heartRateZones}
        />

        <View style={{ flexDirection: "row", gap: 14 }}>
          <CompactStatCard colors={colors} tone="default" title="Weekly Progress" value={`${weeklyGoal.currentMiles.toFixed(1)} mi`} detail={`of ${mileageGoal} mi goal`} footer={`${weeklySummary.workoutsCompleted} workouts logged this week`} progressPercent={weeklyGoal.progressPercent} />
          <CompactStatCard colors={colors} tone="contrast" title="Streak" value={`${streakSummary.current} days`} detail={`Best streak: ${streakSummary.best} days`} footer={weeklySummary.longestRun > 0 ? `Longest run this week: ${weeklySummary.longestRun.toFixed(1)} mi` : "Log a run to start building momentum"} />
        </View>

        <OnTrackCard />

        <AdaptiveTrainingCard />

        <WeeklyPerformanceSummaryCard />

        <View style={{ flexDirection: "row", gap: 14 }}>
          <ActionCard title="Next action" body="Open your plan, review the next few days, and keep the week moving with less guesswork." cta="Go to plan" onPress={() => router.push("/(solo)/explore")} colors={colors} accent={true} />
          <ActionCard title={primaryInsight.eyebrow} body={primaryInsight.detail} cta="Open Guide" onPress={() => router.push("/(solo)/guide")} colors={colors} />
        </View>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function CompactStatCard({
  colors,
  tone,
  title,
  value,
  detail,
  footer,
  progressPercent,
}: {
  colors: { text: string; subtext: string; primary: string; border: string };
  tone: "default" | "contrast";
  title: string;
  value: string;
  detail: string;
  footer: string;
  progressPercent?: number;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: tone === "contrast" ? "#101f34" : "#0f1b2d", borderRadius: 28, borderWidth: 1, borderColor: tone === "contrast" ? "rgba(103, 232, 249, 0.18)" : colors.border, padding: 18, gap: 10 }}>
      <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>{title.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 27, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>{detail}</Text>
      {typeof progressPercent === "number" ? (
        <View style={{ height: 10, backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: 999, overflow: "hidden", marginTop: 2 }}>
          <View style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%`, height: "100%", backgroundColor: "#2563eb", borderRadius: 999 }} />
        </View>
      ) : null}
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 2 }}>{footer}</Text>
    </View>
  );
}

function ActionCard({
  title,
  body,
  cta,
  onPress,
  colors,
  accent,
}: {
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
  colors: { text: string; subtext: string; border: string };
  accent?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: accent ? "#101f34" : "#0f1b2d", borderRadius: 28, borderWidth: 1, borderColor: accent ? "rgba(103, 232, 249, 0.18)" : colors.border, padding: 20, gap: 10 }}>
      <Text style={{ color: accent ? "#67e8f9" : colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{title.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 28 }}>{accent ? "Stay moving forward" : title}</Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{body}</Text>
      <Text style={{ color: accent ? "#67e8f9" : "#93c5fd", fontSize: 14, fontWeight: "700", marginTop: 2 }}>{cta}</Text>
    </Pressable>
  );
}
