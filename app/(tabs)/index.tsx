import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import {
  getAdaptiveCoachRecommendations,
  getInsightsSummary,
  getWeeklyGoalProgress,
} from "@/utils/training-insights";
import { useThemeColors } from "@/contexts/theme-context";
import { buildAdaptiveWeeklyPlan } from "@/lib/training-plan";
import { useWorkouts } from "@/contexts/workout-context";
import { getStreakSummary, getWeeklySummary } from "@/utils/workout-utils";

export default function Home() {
  const { profile, displayName } = useProfile();
  const { workouts, completedWorkoutIds, likedWorkoutCategories, planCycle } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();

  const mileageGoal = parseFloat(profile.mileage) || 30;
  const weeklyGoal = useMemo(() => getWeeklyGoalProgress(workouts, mileageGoal), [mileageGoal, workouts]);
  const weeklySummary = useMemo(() => getWeeklySummary(workouts), [workouts]);
  const streakSummary = useMemo(
    () => getStreakSummary(workouts.map((workout) => workout.date)),
    [workouts]
  );

  const weeklyPlan = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        String(mileageGoal),
        profile.pr5k || "",
        likedWorkoutCategories,
        planCycle,
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
    [
      completedWorkoutIds,
      likedWorkoutCategories,
      mileageGoal,
      planCycle,
      profile.goalEvent,
      profile.pr5k,
      workouts,
    ]
  );

  const todaysWorkout = weeklyPlan[0];
  const coachFeedback = useMemo(
    () => getAdaptiveCoachRecommendations(workouts, mileageGoal),
    [mileageGoal, workouts]
  );
  const insightMessages = useMemo(() => getInsightsSummary(workouts, mileageGoal), [mileageGoal, workouts]);

  const primaryInsight = coachFeedback[0]
    ? {
        eyebrow: "Coach insight",
        title: coachFeedback[0].title,
        detail: coachFeedback[0].detail,
      }
    : insightMessages[0]
      ? {
          eyebrow: "Training insight",
          title: insightMessages[0].title,
          detail: "A single read to keep the day focused instead of stacking multiple messages.",
        }
      : {
          eyebrow: "Daily focus",
          title: "Keep the week simple",
          detail: "Open today's workout, hit the planned purpose, and let the rest of the week build from there.",
        };

  return (
    <AnimatedTabScene tabKey="index">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={displayName} showName={true} onAvatarPress={openDrawer} />

        <View style={{ gap: 14 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>
            DAILY DASHBOARD
          </Text>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: "800", lineHeight: 38 }}>
            Today&apos;s workout comes first.
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23, maxWidth: 620 }}>
            A cleaner home view built around what you need right now: today&apos;s workout, weekly progress, streak, and one useful insight.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.cardAlt,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 24,
            gap: 22,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                TODAY&apos;S WORKOUT
              </Text>
              <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36, marginTop: 12 }}>
                {todaysWorkout?.title || "Recovery day"}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 620 }}>
                {todaysWorkout?.details || "Your next planned session will appear here as soon as your week is generated."}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                minWidth: 112,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700", textAlign: "center" }}>
                WEEKLY
              </Text>
              <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 6, textAlign: "center" }}>
                {Math.round(weeklyGoal.progressPercent)}%
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", flex: 1 }}>
                {todaysWorkout?.kind === "rest" ? "Today is about recovery and absorbing the work." : "Your plan is ready. Open it and keep the day focused."}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                {todaysWorkout?.category?.toUpperCase() || "TODAY"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={todaysWorkout ? "View Workout" : "View Plan"}
                  onPress={() => router.push("/(tabs)/explore")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Complete"
                  onPress={() => router.push("/(tabs)/explore")}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 14 }}>
          <CompactStatCard
            colors={colors}
            title="Weekly Progress"
            value={`${weeklyGoal.currentMiles.toFixed(1)} mi`}
            detail={`of ${mileageGoal} mi goal`}
            footer={`${weeklySummary.workoutsCompleted} workouts logged this week`}
            progressPercent={weeklyGoal.progressPercent}
          />
          <CompactStatCard
            colors={colors}
            title="Streak"
            value={`${streakSummary.current} days`}
            detail={`Best streak: ${streakSummary.best} days`}
            footer={
              weeklySummary.longestRun > 0
                ? `Longest run this week: ${weeklySummary.longestRun.toFixed(1)} mi`
                : "Log a run to start building momentum"
            }
          />
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/coach")}
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            gap: 10,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
            {primaryInsight.eyebrow.toUpperCase()}
          </Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 28 }}>
            {primaryInsight.title}
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
            {primaryInsight.detail}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
            Open Coach
          </Text>
        </Pressable>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function CompactStatCard({
  colors,
  title,
  value,
  detail,
  footer,
  progressPercent,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  title: string;
  value: string;
  detail: string;
  footer: string;
  progressPercent?: number;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        gap: 10,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>
        {title.toUpperCase()}
      </Text>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>{detail}</Text>
      {typeof progressPercent === "number" ? (
        <View
          style={{
            height: 10,
            backgroundColor: colors.border,
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 2,
          }}
        >
          <View
            style={{
              width: `${Math.max(0, Math.min(progressPercent, 100))}%`,
              height: "100%",
              backgroundColor: colors.primary,
              borderRadius: 999,
            }}
          />
        </View>
      ) : null}
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 2 }}>{footer}</Text>
    </View>
  );
}
