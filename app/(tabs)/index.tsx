import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { PageHeader, SecondaryButton } from "../components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { getRunningCoachReply, RUNNING_COACH_SUGGESTIONS } from "../running-coach";
import { useThemeColors } from "../theme-context";
import { buildAdaptiveWeeklyPlan } from "../training-plan";
import { useWorkouts } from "../workout-context";
import {
  formatFeedDate,
  getStreakSummary,
  getWeeklySummary,
  getWorkoutPace,
} from "../workout-utils";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    role: "assistant",
    text: "Ask a running question or a pace conversion. I answer like a built-in running coach.",
  },
];

export default function Home() {
  const { profile, displayName } = useProfile();
  const { workouts, completedWorkoutIds, likedWorkoutCategories, planCycle } = useWorkouts();
  const { colors } = useThemeColors();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);

  const mileageGoal = parseFloat(profile.mileage) || 30;
  const weeklySummary = useMemo(() => getWeeklySummary(workouts), [workouts]);
  const streakSummary = useMemo(
    () => getStreakSummary(workouts.map((workout) => workout.date)),
    [workouts]
  );
  const weeklyMiles = weeklySummary.totalMiles;
  const progressPercent = Math.min((weeklyMiles / mileageGoal) * 100, 100);

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
  const coachContext = useMemo(
    () => ({
      profile: {
        goalEvent: profile.goalEvent,
        mileage: profile.mileage,
        pr5k: profile.pr5k,
        prs: profile.prs,
      },
      workouts,
    }),
    [profile.goalEvent, profile.mileage, profile.pr5k, profile.prs, workouts]
  );
  const todaysWorkout = weeklyPlan[0];
  const secondaryWorkout = weeklyPlan[1];
  const coachFeedback = useMemo(
    () => buildCoachFeedback(workouts, weeklyMiles, mileageGoal, streakSummary.current),
    [mileageGoal, streakSummary, weeklyMiles, workouts]
  );
  const feedPreview = workouts.slice(0, 2);

  const sendCoachMessage = (prompt: string) => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return;
    }

    const reply = getRunningCoachReply(trimmed, coachContext);

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setQuestion("");
  };

  return (
    <AnimatedTabScene tabKey="index">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />

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
              key={message}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{message}</Text>
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
                Focused on running questions, pacing math, workouts, recovery, and race prep.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                Coach mode
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {RUNNING_COACH_SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => sendCoachMessage(suggestion)}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ gap: 10 }}>
            {messages.slice(-6).map((message, index) => {
              const fromAssistant = message.role === "assistant";

              return (
                <View
                  key={`${message.role}-${index}-${message.text.slice(0, 20)}`}
                  style={{
                    alignSelf: fromAssistant ? "flex-start" : "flex-end",
                    maxWidth: "92%",
                    backgroundColor: fromAssistant ? colors.cardAlt : colors.primary,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: fromAssistant ? colors.border : colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      color: fromAssistant ? colors.text : colors.background,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {message.text}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about workouts, pace, recovery, race prep..."
              placeholderTextColor={colors.subtext}
              onSubmitEditing={() => sendCoachMessage(question)}
              style={{
                flex: 1,
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 14,
              }}
            />

            <Pressable
              onPress={() => sendCoachMessage(question)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 18,
                paddingHorizontal: 18,
                paddingVertical: 14,
                minWidth: 72,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: "700" }}>
                Send
              </Text>
            </Pressable>
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

function buildCoachFeedback(
  workouts: ReturnType<typeof useWorkouts>["workouts"],
  weeklyMiles: number,
  mileageGoal: number,
  streak: number
) {
  if (workouts.length === 0) {
    return ["Log your first run to start building coaching feedback."];
  }

  const feedback: string[] = [];
  const lastWorkout = workouts[0];

  if (lastWorkout.effort >= 8) {
    feedback.push("Your last run was high effort. Consider an easy day or full recovery next.");
  }

  if (weeklyMiles < mileageGoal * 0.65) {
    feedback.push("You're below your weekly mileage goal. A steady aerobic day could help close the gap.");
  } else {
    feedback.push("Nice consistency this week. You're tracking well against your mileage goal.");
  }

  if (streak >= 4) {
    feedback.push(`You're on a ${streak}-day streak. Keep the easy days easy so the momentum lasts.`);
  } else if (streak === 0) {
    feedback.push("A small run today can restart your streak and rebuild rhythm quickly.");
  }

  return feedback.slice(0, 3);
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
