import { router } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { useQuickDrawer } from "../components/quick-drawer";
import { PageHeader, SecondaryButton } from "../components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { getPredictionForEvent, normalizePredictorEvent } from "../race-predictor-engine";
import {
  getAdaptiveCoachRecommendations,
  getGoalEventBaseline,
  getInsightsSummary,
  getWeeklyGoalProgress,
  summarizeRaceGoal,
} from "../training-insights";
import { useThemeColors } from "../theme-context";
import { buildAdaptiveWeeklyPlan } from "../training-plan";
import { useWorkouts } from "../workout-context";
import {
  formatFeedDate,
  getStreakSummary,
  getWeeklySummary,
  getWorkoutPace,
} from "../workout-utils";

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
  const weeklyMiles = weeklyGoal.currentMiles;
  const progressPercent = weeklyGoal.progressPercent;

  const weeklyPlan = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        mileageGoal,
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
  const secondaryWorkout = weeklyPlan[1];
  const coachFeedback = useMemo(
    () => getAdaptiveCoachRecommendations(workouts, mileageGoal),
    [mileageGoal, workouts]
  );
  const insightMessages = useMemo(() => getInsightsSummary(workouts, mileageGoal), [mileageGoal, workouts]);
  const activeGoal = useMemo(() => getGoalEventBaseline(profile), [profile]);
  const goalPrediction = useMemo(() => {
    if (!activeGoal) {
      return null;
    }

    const eventKey = normalizePredictorEvent(activeGoal.event);
    return eventKey ? getPredictionForEvent(eventKey, workouts, profile) : null;
  }, [activeGoal, profile, workouts]);
  const goalSummary = useMemo(() => {
    if (!activeGoal) {
      return null;
    }

    return summarizeRaceGoal(activeGoal, workouts, goalPrediction?.predictedSeconds ?? null);
  }, [activeGoal, goalPrediction?.predictedSeconds, workouts]);
  const feedPreview = workouts.slice(0, 2);

  return (
    <AnimatedTabScene tabKey="index">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={displayName} showName={true} onAvatarPress={openDrawer} />

        <PageHeader
          eyebrow="Today"
          title={todaysWorkout?.title || "Workout"}
          subtitle={todaysWorkout?.details || "Your next session will appear here."}
          rightContent={
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 22,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: colors.border,
                minWidth: 92,
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 22, fontWeight: "700", textAlign: "center" }}
              >
                {Math.round(progressPercent)}%
              </Text>
              <Text
                style={{ color: colors.subtext, fontSize: 12, marginTop: 2, textAlign: "center" }}
              >
                weekly
              </Text>
            </View>
          }
        />

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            gap: 18,
          }}
        >
          <SectionTitle
            colors={colors}
            title="This week"
            subtitle="A quick read on volume, momentum, and what is coming next."
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.subtext,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                }}
              >
                WEEKLY GOAL
              </Text>
              <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700", marginTop: 8 }}>
                {weeklyMiles.toFixed(1)} mi
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 15, marginTop: 4 }}>
                of {mileageGoal} mi goal
              </Text>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 8 }}>
                {Math.round(progressPercent)}% of weekly goal
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: colors.border,
                minWidth: 136,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
                {streakSummary.current} day streak {"\uD83D\uDD25"}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>
                Best streak: {streakSummary.best} days
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 12,
              backgroundColor: colors.border,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor: colors.primary,
                borderRadius: 999,
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 14, alignItems: "stretch" }}>
            <View
              style={{
                flex: 1.1,
                backgroundColor: colors.cardAlt,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: colors.subtext,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                }}
              >
                NEXT UP
              </Text>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 8 }}>
                {secondaryWorkout?.title || "Recovery Run"}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                {secondaryWorkout?.details || "Your next planned workout will appear here."}
              </Text>
            </View>

            <View style={{ flex: 0.9, gap: 12 }}>
              <MetricChip colors={colors} label="Workouts logged" value={`${workouts.length}`} />
              <MetricChip colors={colors} label="5K PR" value={profile.pr5k || "Not set"} />
            </View>
          </View>

          <WeeklySummaryCard
            colors={colors}
            totalMiles={weeklySummary.totalMiles}
            workoutsCompleted={weeklySummary.workoutsCompleted}
            averageEffort={weeklySummary.averageEffort}
            longestRun={weeklySummary.longestRun}
          />
        </View>

        {goalSummary ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Race Goal</Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
                  {activeGoal?.event} in {activeGoal?.goalTime || "goal time not set"}
                </Text>
              </View>

              <SecondaryButton label="Open Goals" onPress={() => router.push("/goals")} />
            </View>

            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                gap: 8,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
                {goalSummary.status === "on-track" ? "ON TRACK" : goalSummary.status === "needs-work" ? "NEEDS WORK" : "UPCOMING"}
              </Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                {goalSummary.countdownLabel}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14 }}>{goalSummary.progressLabel}</Text>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{goalSummary.detail}</Text>
            </View>
          </View>
        ) : (
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
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Race Goal</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Add a race goal to track countdown, projected fitness, and goal status from your training.
            </Text>
            <SecondaryButton label="Set Goal" onPress={() => router.push("/goals")} />
          </View>
        )}

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
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
              Coach Feedback
            </Text>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              Rule-based
            </Text>
          </View>

          {coachFeedback.map((message) => (
            <View
              key={message.title}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{message.title}</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
                {message.detail}
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
            padding: 20,
            gap: 12,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Insights</Text>
          {insightMessages.map((insight) => (
            <View
              key={insight.title}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{insight.title}</Text>
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
            gap: 14,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                Activity Feed
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
                Your recent runs in a cleaner feed-style view.
              </Text>
            </View>

            <SecondaryButton label="Open Feed" onPress={() => router.push("/activities")} />
          </View>

          {feedPreview.length === 0 ? (
            <Text style={{ color: colors.subtext, fontSize: 14 }}>
              Log a run or complete a planned workout to start your feed.
            </Text>
          ) : (
            feedPreview.map((workout) => (
              <View
                key={workout.id}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", flex: 1 }}>
                    {workout.type || "Workout"}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13 }}>
                    {formatFeedDate(workout.date)}
                  </Text>
                </View>
                <Text style={{ color: colors.subtext, fontSize: 14 }}>
                  {workout.distance} mi {"\u2022"}{" "}
                  {getWorkoutPace(workout.distance, workout.time) ?? workout.time} {"\u2022"} Effort{" "}
                  {workout.effort.toFixed(1)}
                </Text>
                {workout.notes ? (
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                    {workout.notes}
                  </Text>
                ) : null}
              </View>
            ))
          )}
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Gear</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
                Track shoe mileage and keep rotation checks simple.
              </Text>
            </View>
            <SecondaryButton label="Open Gear" onPress={() => router.push("/gear")} />
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            gap: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                Running Coach
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
                Coach now has its own tab with chat, suggested prompts, and quick pace tools.
              </Text>
            </View>

            <SecondaryButton label="Open Coach" onPress={() => router.push("/(tabs)/coach")} />
          </View>
        </View>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function MetricChip({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function WeeklySummaryCard({
  colors,
  totalMiles,
  workoutsCompleted,
  averageEffort,
  longestRun,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  totalMiles: number;
  workoutsCompleted: number;
  averageEffort: number | null;
  longestRun: number;
}) {
  if (workoutsCompleted === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.cardAlt,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Weekly summary</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
          No workouts logged this week yet. Your summary will update as soon as you save or complete a run.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Weekly summary</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>
            A quick read on your current week
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>This week</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <SummaryChip colors={colors} label="Miles" value={`${totalMiles.toFixed(1)} mi`} />
        <SummaryChip colors={colors} label="Workouts" value={`${workoutsCompleted}`} />
        <SummaryChip
          colors={colors}
          label="Avg effort"
          value={averageEffort === null ? "N/A" : `${averageEffort.toFixed(1)}/10`}
        />
        <SummaryChip colors={colors} label="Longest" value={`${longestRun.toFixed(1)} mi`} />
      </View>
    </View>
  );
}

function SummaryChip({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        minWidth: "47%",
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}
