import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { GlowBackground, RunnerEmptyState, RunningSurfaceAccent } from "@/components/running-visuals";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { getSurfaceCardStyle, PageHeader } from "@/components/ui-kit";
import { ExpandablePanel, FadeInView, InteractivePressable } from "@/components/ui-polish";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { useEngine } from "@/contexts/engine-context";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { type WorkoutType, useWorkouts } from "@/contexts/workout-context";
import { getDailyFuelingSummary } from "@/lib/fueling-tracker";
import { getUnifiedRecoveryState } from "@/lib/recovery-engine";
import { getRunningCoachReply, RUNNING_COACH_SUGGESTIONS, type RunningCoachContext } from "@/lib/running-coach";
import { useResponsiveLayout } from "@/lib/responsive";
import { buildAdaptiveWeeklyPlan, getGoalLabel, getTodayPlanDay } from "@/lib/training-plan";
import { buildUpgradePath } from "@/lib/upgrade-route";
import { formatFeedDate, getStreakSummary, getWeeklySummary, getWorkoutPace, parseDistance } from "@/utils/workout-utils";
import { ThemeTokens } from "@/constants/theme";
import type { PremiumFeatureKey, PremiumTier } from "@/lib/premium-products";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type QuickAction = {
  key: "analyze_last_run" | "help_with_today" | "race_prediction" | "explain_workout";
  label: string;
  featureKey?: PremiumFeatureKey;
  requiredTier?: PremiumTier;
  badge?: string;
};

type PendingChoice = {
  kind: "race_prediction" | "explain_workout";
  title: string;
  subtitle: string;
  options: { id: string; label: string; detail?: string }[];
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    role: "assistant",
    text: "I can help you understand today's workout, pacing, recovery, race prep, and why your training is set up the way it is.",
  },
];

export default function GuideTab() {
  const { profile, displayName } = useProfile();
  const { workouts, likedWorkoutCategories, completedWorkoutIds, planCycle } = useWorkouts();
  const { engine } = useEngine();
  const { hasAccess, getFeatureGate } = usePremium();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const layout = useResponsiveLayout();
  const composerRef = useRef<TextInput>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);

  const weeklyMileageGoal = Number.parseFloat(profile.mileage) || 30;

  const weeklyPlan = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        String(weeklyMileageGoal),
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
      ),
    [
      completedWorkoutIds,
      likedWorkoutCategories,
      planCycle,
      profile.goalEvent,
      profile.preferredTrainingDays,
      profile.pr5k,
      profile.runnerLevel,
      weeklyMileageGoal,
      workouts,
    ]
  );

  const todayWorkout = useMemo(() => getTodayPlanDay(weeklyPlan.plan), [weeklyPlan.plan]);
  const recentWorkout = useMemo(
    () =>
      [...workouts].sort((left, right) => {
        return new Date(right.date).getTime() - new Date(left.date).getTime();
      })[0] ?? null,
    [workouts]
  );
  const weeklySummary = useMemo(() => getWeeklySummary(workouts), [workouts]);
  const streakSummary = useMemo(() => getStreakSummary(workouts.map((workout) => workout.date)), [workouts]);
  const nextRace = profile.raceGoals[0] ?? null;
  const goalLabel = profile.goalEvent ? getGoalLabel(profile.goalEvent) : "your next goal";
  const recentPace = recentWorkout ? getWorkoutPace(recentWorkout.distance, recentWorkout.time) : null;
  const recentDistance = recentWorkout ? parseDistance(recentWorkout.distance) : null;
  const recentInsight = getRecentInsight(recentWorkout?.effort ?? null);
  const currentStreak = streakSummary.current;
  const recoveryState = useMemo(() => getUnifiedRecoveryState(engine, workouts), [engine, workouts]);
  const todayFueling = useMemo(
    () => getDailyFuelingSummary(engine, workouts, new Date().toISOString().slice(0, 10)),
    [engine, workouts]
  );

  const guideContext = useMemo(
    () => ({
      profile: {
        goalEvent: profile.goalEvent,
        mileage: profile.mileage,
        pr5k: profile.pr5k,
        prs: profile.prs,
        raceGoals: profile.raceGoals,
        runnerLevel: profile.runnerLevel,
        preferredTrainingDays: profile.preferredTrainingDays,
      },
      workouts,
      todayWorkout: todayWorkout
        ? {
            title: todayWorkout.title,
            details: todayWorkout.details,
            distance: todayWorkout.distance,
            kind: todayWorkout.kind,
          }
        : null,
      weeklySummary: {
        totalMiles: weeklySummary.totalMiles,
        runCount: weeklySummary.workoutsCompleted,
        averageEffort: weeklySummary.averageEffort,
      },
      streak: currentStreak,
      adaptiveFeedback: weeklyPlan.feedback,
      recovery: {
        percent: recoveryState.percent,
        status: recoveryState.status,
        explanation: recoveryState.explanation,
        recommendation: recoveryState.recommendation,
        adjustment: recoveryState.adjustment.level,
      },
      engine: {
        sleepHours: engine.sleepHours,
        sleepQuality: engine.sleepQuality,
        sleepScore: engine.sleepScore,
        restingHr: engine.restingHr,
        heartRateTrend: engine.heartRateTrend,
        fuelingStatus: engine.fuelingStatus,
        fatigueLevel: engine.fatigueLevel,
      },
      fuelingToday: {
        eatenCalories: todayFueling.eatenCalories,
        burnedCalories: todayFueling.burnedCalories,
        netCalories: todayFueling.netCalories,
        status: todayFueling.status,
        statusLabel: todayFueling.statusLabel,
        insight: todayFueling.insight,
      },
    }),
    [
      engine.fatigueLevel,
      engine.fuelingStatus,
      engine.heartRateTrend,
      engine.restingHr,
      engine.sleepHours,
      engine.sleepQuality,
      engine.sleepScore,
      profile.goalEvent,
      profile.mileage,
      profile.preferredTrainingDays,
      profile.pr5k,
      profile.prs,
      profile.raceGoals,
      profile.runnerLevel,
      recoveryState.adjustment.level,
      recoveryState.explanation,
      recoveryState.percent,
      recoveryState.recommendation,
      recoveryState.status,
      currentStreak,
      todayFueling.burnedCalories,
      todayFueling.eatenCalories,
      todayFueling.insight,
      todayFueling.netCalories,
      todayFueling.status,
      todayFueling.statusLabel,
      todayWorkout,
      weeklyPlan.feedback,
      weeklySummary.averageEffort,
      weeklySummary.workoutsCompleted,
      weeklySummary.totalMiles,
      workouts,
    ]
  );

  const quickActions: QuickAction[] = [
    { key: "analyze_last_run", label: "Analyze last run", featureKey: "personalized_insights_advanced", requiredTier: "elite", badge: "ELITE" },
    { key: "help_with_today", label: "Help with today" },
    { key: "race_prediction", label: "Race prediction", featureKey: "race_prediction_basic", requiredTier: "pro", badge: "PRO" },
    { key: "explain_workout", label: "Explain workout", featureKey: "personalized_insights_advanced", requiredTier: "elite", badge: "ELITE" },
  ];

  const groupedPrompts = [
    {
      label: "Today",
      prompts: ["Help with today's workout", "What pace should I run today?", "What should my long run feel like?"],
    },
    {
      label: "Recovery",
      prompts: ["Why did my run feel hard?", "How should I recover after this workout?"],
    },
    {
      label: "Goal",
      prompts: ["Am I on track for my goal?"],
    },
  ];

  const sendGuideMessage = (prompt: string) => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return;
    }

    const reply = getRunningCoachReply(trimmed, guideContext);

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setQuestion("");
    setPendingChoice(null);
  };

  const appendAssistantMessage = (text: string) => {
    setMessages((current) => [...current, { role: "assistant", text }]);
  };

  const appendConversationTurn = (userText: string, assistantText: string) => {
    setMessages((current) => [
      ...current,
      { role: "user", text: userText },
      { role: "assistant", text: assistantText },
    ]);
  };

  const focusComposer = (nextQuestion?: string) => {
    if (typeof nextQuestion === "string") {
      setQuestion(nextQuestion);
    }

    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.featureKey && !hasAccess(action.featureKey)) {
      const gate = getFeatureGate(action.featureKey);
      router.push(
        buildUpgradePath({
          plan: gate.requiredTier === "elite" ? "elite" : "pro",
          recommendation: gate.upgradeCopy,
        })
      );
      return;
    }

    switch (action.key) {
      case "analyze_last_run": {
        setPendingChoice(null);
        const userText = "Analyze my last run.";
        const reply = buildLastRunAnalysis({
          workout: recentWorkout,
          recentPace,
          recentDistance,
          heartRateTrend: engine.heartRateTrend,
          recoveryExplanation: recoveryState.explanation,
        });
        appendConversationTurn(userText, reply);
        focusComposer("What part of that run should I look at next?");
        return;
      }
      case "help_with_today": {
        setPendingChoice(null);
        const userText = "Help with today.";
        const reply = buildTodayWorkoutHelp({
          todayWorkout,
          nextPlannedWorkout: getNextPlannedWorkout(weeklyPlan.plan),
          recoveryRecommendation: recoveryState.recommendation,
          recoveryAdjustment: recoveryState.adjustment.level,
        });
        appendConversationTurn(userText, reply);
        focusComposer(todayWorkout ? "What pace should I use for today?" : "What should I ask about instead?");
        return;
      }
      case "race_prediction": {
        const choice: PendingChoice = {
          kind: "race_prediction",
          title: "Choose a race for prediction",
          subtitle: "Pick the event you want the coach to estimate from your training.",
          options: [
            { id: "800m", label: "800m" },
            { id: "1500m", label: "1500m" },
            { id: "1600m_mile", label: "1600m / mile" },
            { id: "5k", label: "5K" },
            { id: "10k", label: "10K" },
            { id: "half_marathon", label: "Half marathon" },
          ],
        };
        setPendingChoice(choice);
        appendAssistantMessage("Which race do you want a prediction for? Pick one below and I’ll base it on your recent running, consistency, mileage, and any race data on your account.");
        focusComposer("How aggressive should this prediction be?");
        return;
      }
      case "explain_workout": {
        const choice: PendingChoice = buildWorkoutExplainChoice(weeklyPlan.plan);
        setPendingChoice(choice);
        appendAssistantMessage("Which workout do you want explained? Choose one below and I’ll break down what it is, why it is there, and how it should feel.");
        focusComposer("How should that workout feel?");
      }
    }
  };

  const handlePendingChoice = (choiceKind: PendingChoice["kind"], optionId: string) => {
    if (choiceKind === "race_prediction") {
      const label = getRacePredictionLabel(optionId);
      const reply = buildRacePredictionReply({
        eventId: optionId,
        context: guideContext,
      });
      appendConversationTurn(`Predict my ${label}.`, reply);
      setPendingChoice(null);
      focusComposer("How should I train if I want to improve that prediction?");
      return;
    }

    const selectedWorkout = getSelectedWorkoutForExplanation(optionId, weeklyPlan.plan);
    const reply = buildWorkoutExplanationSelectionReply({
      optionId,
      selectedWorkout,
      recoveryAdjustment: recoveryState.adjustment.level,
    });
    appendConversationTurn(`Explain this workout: ${selectedWorkout?.title || optionId}.`, reply);
    setPendingChoice(null);
    focusComposer("What pace or effort should I use for that workout?");
  };

  const isEmptyConversation = messages.length === 1;

  return (
    <AnimatedTabScene tabKey="guide">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={displayName} onAvatarPress={openDrawer} />

        <PageHeader
          eyebrow="AI Coach"
          title="A running assistant built for the middle of real training weeks"
          subtitle="Use it for today's workout, pacing, recovery, race goals, and honest training questions when you want a useful answer fast."
        />

        <FadeInView delay={40}>
          <CoachHero
            colors={colors}
            displayName={displayName || "Runner"}
            weeklyMileage={weeklySummary.totalMiles}
            streak={streakSummary.current}
            goalLabel={goalLabel}
            quickActions={quickActions}
            onSelectAction={handleQuickAction}
            isPhone={layout.isPhone}
            hasAccess={hasAccess}
          />
        </FadeInView>

        <View
          style={[
            getSurfaceCardStyle(colors, { tone: "contrast", padding: ThemeTokens.spacing.m }),
            { gap: 12, overflow: "hidden" },
          ]}
        >
          <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10 }}>
            <GuideSignalCard
              label="What matters now"
              value={todayWorkout ? todayWorkout.title : "No workout loaded"}
              detail={todayWorkout ? "Today's run is the best first question for the coach." : "Open your plan and the coach will anchor to the next session."}
              accent
            />
            <GuideSignalCard
              label="Training context"
              value={`${weeklySummary.totalMiles.toFixed(1)} mi this week`}
              detail={`${streakSummary.current} day streak with ${weeklySummary.workoutsCompleted} logged runs`}
            />
            <GuideSignalCard
              label="Goal lens"
              value={nextRace?.event || goalLabel}
              detail={nextRace?.goalTime ? `Goal: ${nextRace.goalTime}` : "Use the coach for pacing, progression, and race readiness."}
            />
          </View>
        </View>

        <FadeInView delay={80}>
          <View style={{ gap: 14 }}>
          <ExpandablePanel
            title="Coach view"
            subtitle="Open the deeper training read only when you want extra context."
          >
          {!hasAccess("personalized_insights_advanced") ? (
            <PremiumCoachPreview
              colors={colors}
              title="Elite coaching preview"
              body="Advanced AI coaching ties together your recent workouts, fueling, heart rate, sleep, and goal context into a more specific performance read."
              cta="Unlock Elite coaching"
              onPress={() =>
                router.push(
                  buildUpgradePath({
                    plan: "elite",
                    recommendation: "Upgrade to Elite to unlock coaching-style AI guidance.",
                  })
                )
              }
            />
          ) : null}
          <CoachSectionTitle colors={colors} title="What your coach sees right now" subtitle="A quick read on your training so the page feels useful before you even ask a question." eyebrow="Coach view" />

          <View style={{ gap: 14 }}>
            <InsightCard
              colors={colors}
              eyebrow="Today"
              title={todayWorkout ? todayWorkout.title : "No workout loaded yet"}
              body={
                todayWorkout
                  ? todayWorkout.details
                  : "Open your weekly plan and your coach will help explain the purpose and feel of the day."
              }
              footer={
                todayWorkout
                  ? `${todayWorkout.distance > 0 ? `${todayWorkout.distance} mi planned` : "Recovery focus"}`
                  : "Training guidance will appear here once your plan is active."
              }
              accent
              emphasis="primary"
              locked={!hasAccess("personalized_insights_advanced")}
            />

            <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
              <InsightCard
                colors={colors}
                eyebrow="Recent training insight"
                title={recentInsight.title}
                body={recentInsight.body}
                footer={recentWorkout
                  ? `${formatFeedDate(recentWorkout.date)}${recentDistance ? ` • ${recentDistance.toFixed(recentDistance % 1 === 0 ? 0 : 1)} mi` : ""}${recentPace ? ` • ${recentPace}` : ""}`
                  : "Log a run and the coach will start reading patterns here."}
                emphasis="secondary"
                locked={!hasAccess("personalized_insights_advanced")}
              />

              <InsightCard
                colors={colors}
                eyebrow="Goal status"
                title={nextRace ? nextRace.event : goalLabel}
                body={
                  nextRace?.goalTime
                    ? `Goal time: ${nextRace.goalTime}. Ask the coach if your recent running lines up with that target.`
                    : nextRace?.raceDate
                      ? `Race date: ${formatShortDate(nextRace.raceDate)}. The coach can help you stay patient and specific on the way there.`
                      : "No race locked in yet. The coach is still useful for pacing, progression, and day-to-day training decisions."
                }
                footer={
                  nextRace?.raceDate
                    ? getRaceCountdownText(nextRace.raceDate)
                    : `Current weekly goal: about ${weeklyMileageGoal} mi`
                }
                emphasis="secondary"
                locked={!hasAccess("personalized_insights_advanced")}
              />
            </View>
          </View>
          </ExpandablePanel>
          </View>
        </FadeInView>

        <FadeInView delay={120}>
          <View style={{ gap: 14 }}>
          <ExpandablePanel
            title="Prompt library"
            subtitle="Keep extra question starters tucked away while the quick actions stay visible."
          >
          <CoachSectionTitle
            colors={colors}
            title="Start with a helpful question"
            subtitle="Use a quick prompt or type your own. The coach keeps answers centered on running only."
            eyebrow="Quick start"
          />

          <View
            style={{
              backgroundColor: "#0f1b2d",
              borderRadius: 32,
              borderWidth: 1,
              borderColor: "rgba(103, 232, 249, 0.14)",
              padding: 20,
              gap: 18,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -18,
                right: -12,
                width: 140,
                height: 140,
                borderRadius: 999,
                backgroundColor: "rgba(37, 99, 235, 0.16)",
              }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {RUNNING_COACH_SUGGESTIONS.map((suggestion) => (
                <PromptChip
                  key={suggestion}
                  colors={colors}
                  label={suggestion}
                  onPress={() => sendGuideMessage(suggestion)}
                />
              ))}
            </ScrollView>

            <View style={{ gap: 14 }}>
              {groupedPrompts.map((group) => (
                <View key={group.label} style={{ gap: 10 }}>
                  <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }}>
                    {group.label.toUpperCase()} QUESTIONS
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    {group.prompts.map((prompt) => (
                      <PromptCard
                        key={prompt}
                        colors={colors}
                        label={prompt}
                        onPress={() => sendGuideMessage(prompt)}
                        wide={layout.isPhone}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
          </ExpandablePanel>
          </View>
        </FadeInView>

        <FadeInView delay={160}>
          <View
          style={[
            getSurfaceCardStyle(colors, { tone: "contrast", padding: 0 }),
            { overflow: "hidden" },
          ]}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(148, 163, 184, 0.12)",
              gap: 10,
              backgroundColor: "#111c2f",
            }}
          >
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>COACH CONVERSATION</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>Coach conversation</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Ask directly and the reply will stay focused on your running, not generic motivation.
            </Text>
            <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10 }}>
              <ConversationSignal
                colors={colors}
                label="Today's angle"
                value={todayWorkout ? todayWorkout.title : "Open your plan to anchor the conversation"}
              />
              <ConversationSignal
                colors={colors}
                label="Goal context"
                value={nextRace?.event || goalLabel}
              />
            </View>
          </View>

          <View style={{ padding: 20, gap: 14 }}>
            <ExpandablePanel
              title="Conversation history"
              subtitle={isEmptyConversation ? "Open to see starter guidance once you begin chatting." : "Older messages stay tucked away until you want them."}
            >
              {isEmptyConversation ? (
                <RunnerEmptyState
                  title="Start with today's run, your last hard effort, or your goal race"
                  body="If you are newer to running, ask what the workout should feel like. If you are more experienced, ask whether the plan, effort, and pacing line up with your goal."
                  icon="chatbubble-ellipses-outline"
                />
              ) : null}

              <View style={{ gap: 12 }}>
                {messages.slice(-10).map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${index}-${message.text.slice(0, 24)}`}
                    colors={colors}
                    role={message.role}
                    text={message.text}
                  />
                ))}
              </View>
            </ExpandablePanel>

            <View
              style={{
                backgroundColor: "#101b2d",
                borderRadius: ThemeTokens.radii.lg,
                borderWidth: 1,
                borderColor: "rgba(103, 232, 249, 0.12)",
                padding: ThemeTokens.spacing.m,
                gap: ThemeTokens.spacing.ms,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                ASK A RUNNING QUESTION
              </Text>
              <TextInput
                ref={composerRef}
                value={question}
                onChangeText={setQuestion}
                placeholder="Ask about pace, workouts, recovery, race prep, or why a run felt harder than expected..."
                placeholderTextColor={colors.subtext}
                multiline
                style={{
                  minHeight: 82,
                  color: colors.text,
                  fontSize: 15,
                  lineHeight: 22,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  textAlignVertical: "top",
                }}
              />

              <View style={{ flexDirection: layout.isPhone ? "column" : "row", justifyContent: "space-between", alignItems: layout.isPhone ? "stretch" : "center", gap: 12 }}>
                <Text style={{ color: colors.subtext, fontSize: 12, flex: 1 }}>
                  Best results come from specific questions like what happened, how hard it felt, and what goal you are training for.
                </Text>

                <Pressable
                  onPress={() => sendGuideMessage(question)}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary,
                    borderRadius: ThemeTokens.radii.md,
                    paddingHorizontal: ThemeTokens.spacing.m,
                    paddingVertical: ThemeTokens.spacing.ms,
                    minWidth: layout.isPhone ? undefined : 88,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.94 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }, { translateY: pressed ? 1 : 0 }],
                  })}
                >
                  <Text style={{ color: colors.background, fontSize: 14, fontWeight: "800" }}>Ask coach</Text>
                </Pressable>
              </View>

              {pendingChoice ? (
                <View
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.72)",
                    borderRadius: ThemeTokens.radii.md,
                    borderWidth: 1,
                    borderColor: "rgba(103, 232, 249, 0.12)",
                    padding: ThemeTokens.spacing.ms,
                    gap: ThemeTokens.spacing.s,
                  }}
                >
                  <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                    COACH OPTIONS
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{pendingChoice.title}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>{pendingChoice.subtitle}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {pendingChoice.options.map((option) => (
                      <PromptChip
                        key={option.id}
                        colors={colors}
                        label={option.label}
                        onPress={() => handlePendingChoice(pendingChoice.kind, option.id)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          </View>
        </FadeInView>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function CoachHero({
  colors,
  displayName,
  weeklyMileage,
  streak,
  goalLabel,
  quickActions,
  onSelectAction,
  isPhone,
  hasAccess,
}: {
  colors: { card: string; border: string; primary: string; text: string; subtext: string };
  displayName: string;
  weeklyMileage: number;
  streak: number;
  goalLabel: string;
  quickActions: QuickAction[];
  onSelectAction: (action: QuickAction) => void;
  isPhone: boolean;
  hasAccess: (featureKey: PremiumFeatureKey) => boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: "#0f1b2d",
        borderRadius: ThemeTokens.radii.xl,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.15)",
        padding: ThemeTokens.spacing.ml,
        gap: ThemeTokens.spacing.ml,
        overflow: "hidden",
        ...ThemeTokens.shadows.low,
      }}
    >
      <GlowBackground variant="road" />
      <RunningSurfaceAccent variant="road" />
      <View
        style={{
          position: "absolute",
          top: -34,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: "rgba(37, 99, 235, 0.18)",
        }}
      />
      <View style={{ gap: ThemeTokens.spacing.ms }}>
        <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>RUNNING ASSISTANT</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <MetricPill colors={colors} label="Today" value="Workout help" />
          <MetricPill colors={colors} label="Recent" value={`${weeklyMileage.toFixed(1)} mi this week`} />
          <MetricPill colors={colors} label="Momentum" value={`${streak} day streak`} />
          <MetricPill colors={colors} label="Focus" value={goalLabel} />
        </View>

        <Text style={{ color: colors.text, fontSize: isPhone ? ThemeTokens.typography.h2.fontSize : 28, fontWeight: "800", lineHeight: isPhone ? ThemeTokens.typography.h2.lineHeight : 34 }}>
          {displayName.split(" ")[0] || "Runner"}, your coach can explain the run, the pace, and what to do next.
        </Text>
        <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight }}>
          Start with a quick action when you want a fast answer, or ask a more specific training question when you want coach-style context.
        </Text>
      </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {quickActions.map((action, index) => {
            const locked = action.featureKey ? !hasAccess(action.featureKey) : false;

            return (
              <InteractivePressable
                key={action.label}
                onPress={() => onSelectAction(action)}
                scaleTo={0.97}
                style={{
                  minWidth: isPhone ? "100%" : index < 2 ? "47%" : "31%",
                  flexGrow: 1,
                  backgroundColor: index === 0 ? "rgba(37, 99, 235, 0.26)" : "rgba(15, 23, 42, 0.82)",
                  borderRadius: ThemeTokens.radii.lg,
                  borderWidth: 1,
                  borderColor: index === 0 ? "rgba(103, 232, 249, 0.28)" : colors.border,
                  paddingHorizontal: ThemeTokens.spacing.m,
                  paddingVertical: ThemeTokens.spacing.m,
                  shadowColor: index === 0 ? "#38bdf8" : "#020817",
                  shadowOpacity: index === 0 ? 0.16 : 0.08,
                  shadowRadius: index === 0 ? 12 : 8,
                  shadowOffset: { width: 0, height: 6 },
                }}
              >
                <Text style={{ color: index === 0 ? "#67e8f9" : colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }}>
                  QUICK ACTION
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 20, flex: 1 }}>
                    {action.label}
                  </Text>
                  {action.badge ? (
                    <View
                      style={{
                        backgroundColor: locked ? "rgba(255,255,255,0.08)" : "rgba(103, 232, 249, 0.14)",
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: locked ? colors.border : "rgba(103, 232, 249, 0.24)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: locked ? colors.subtext : "#67e8f9", fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }}>
                        {action.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
                  {locked ? `Upgrade to ${action.requiredTier === "elite" ? "Elite" : "Pro"} to unlock this coach action.` : getQuickActionHint(action.label)}
                </Text>
              </InteractivePressable>
            );
          })}
      </View>
    </View>
  );
}

function CoachSectionTitle({
  colors,
  title,
  subtitle,
  eyebrow,
}: {
  colors: { text: string; subtext: string };
  title: string;
  subtitle: string;
  eyebrow?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {eyebrow ? (
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{eyebrow.toUpperCase()}</Text>
      ) : null}
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{subtitle}</Text>
    </View>
  );
}

function MetricPill({
  colors,
  label,
  value,
}: {
  colors: { card: string; border: string; text: string; subtext: string };
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.78)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 9,
        gap: 3,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function GuideSignalCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? "rgba(37, 99, 235, 0.16)" : "rgba(8, 17, 29, 0.56)",
        borderRadius: ThemeTokens.radii.md,
        borderWidth: 1,
        borderColor: accent ? "rgba(103, 232, 249, 0.18)" : "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: ThemeTokens.spacing.m,
        paddingVertical: ThemeTokens.spacing.ms,
        gap: 6,
      }}
    >
      <Text style={{ color: accent ? "#67e8f9" : "rgba(226, 232, 240, 0.72)", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fbff", fontSize: 15, fontWeight: "800", lineHeight: 20 }}>{value}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 12, lineHeight: 17 }}>{detail}</Text>
    </View>
  );
}

function InsightCard({
  colors,
  eyebrow,
  title,
  body,
  footer,
  accent,
  emphasis,
  locked,
}: {
  colors: { card: string; border: string; text: string; subtext: string };
  eyebrow: string;
  title: string;
  body: string;
  footer: string;
  accent?: boolean;
  emphasis?: "primary" | "secondary";
  locked?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? "#101f34" : emphasis === "secondary" ? "#111827" : colors.card,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: accent ? "rgba(103, 232, 249, 0.18)" : colors.border,
        padding: 18,
        gap: 10,
        shadowColor: accent ? "#38bdf8" : "#020817",
        shadowOpacity: accent ? 0.14 : 0.08,
        shadowRadius: accent ? 14 : 10,
        shadowOffset: { width: 0, height: 6 },
        overflow: "hidden",
      }}
    >
      {locked ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(4, 10, 18, 0.58)",
            zIndex: 1,
          }}
        />
      ) : null}
      <Text style={{ color: accent ? "#67e8f9" : colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 0.9 }}>
        {eyebrow.toUpperCase()}
      </Text>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 28 }}>{title}</Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{body}</Text>
      <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 18, marginTop: 4 }}>{footer}</Text>
    </View>
  );
}

function PremiumCoachPreview({
  colors,
  title,
  body,
  cta,
  onPress,
}: {
  colors: { text: string; subtext: string; border: string; primary: string };
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.16)",
        padding: 16,
        gap: 10,
      }}
    >
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.9 }}>
        ELITE COACHING
      </Text>
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{body}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          borderRadius: 999,
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.2)",
          paddingHorizontal: 14,
          paddingVertical: 10,
          opacity: pressed ? 0.94 : 1,
        })}
      >
        <Text style={{ color: "#dff7ff", fontSize: 12, fontWeight: "800" }}>{cta}</Text>
      </Pressable>
    </View>
  );
}

function PromptChip({
  colors,
  label,
  onPress,
}: {
  colors: { cardAlt: string; border: string; text: string };
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.cardAlt,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }, { translateY: pressed ? 1 : 0 }],
      })}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function PromptCard({
  colors,
  label,
  onPress,
  wide,
}: {
  colors: { cardAlt: string; border: string; text: string; subtext: string };
  label: string;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: wide ? "100%" : "47%",
        flexGrow: 1,
        backgroundColor: "#111827",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }, { translateY: pressed ? 1 : 0 }],
      })}
      >
        <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
          SUGGESTED ASK
        </Text>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 6 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ConversationSignal({
  colors,
  label,
  value,
}: {
  colors: { border: string; text: string; subtext: string };
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.68)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function MessageBubble({
  colors,
  role,
  text,
}: {
  colors: { cardAlt: string; border: string; primary: string; text: string; background: string; subtext: string };
  role: "assistant" | "user";
  text: string;
}) {
  const fromAssistant = role === "assistant";

  return (
    <View
      style={{
        alignSelf: fromAssistant ? "flex-start" : "flex-end",
        maxWidth: "94%",
        gap: 6,
      }}
    >
      <Text
        style={{
          color: colors.subtext,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.8,
          paddingHorizontal: 4,
        }}
      >
        {fromAssistant ? "COACH" : "YOU"}
      </Text>

      <View
        style={{
          backgroundColor: fromAssistant ? colors.cardAlt : colors.primary,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: fromAssistant ? colors.border : colors.primary,
          paddingHorizontal: 15,
          paddingVertical: 13,
        }}
      >
        <Text
          style={{
            color: fromAssistant ? colors.text : colors.background,
            fontSize: 14,
            lineHeight: 21,
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function getRecentInsight(effort: number | null) {
  if (effort === null) {
    return {
      title: "No recent run yet",
      body: "Once you log a workout, the coach can help you explain what happened and what to adjust next.",
    };
  }

  if (effort >= 8) {
    return {
      title: "Recent effort was pretty high",
      body: "A good next question is whether your next run should stay easier so the hard work actually pays off.",
    };
  }

  if (effort >= 6) {
    return {
      title: "You are sitting in solid work",
      body: "This is a good time to ask if the pace, workout purpose, and recovery all match your goal.",
    };
  }

  return {
    title: "Recent running looks controlled",
    body: "Ask whether you should hold steady or gently progress the next few days.",
  };
}

function getQuickActionHint(label: string) {
  switch (label) {
    case "Analyze last run":
      return "Read what your last effort probably means.";
    case "Help with today":
      return "Get a quick feel, pace, and purpose check.";
    case "Race prediction":
      return "Choose an event and get a realistic estimate.";
    case "Explain workout":
      return "Pick a planned session and see what it builds.";
    default:
      return "Ask the coach for a focused running answer.";
  }
}

function buildLastRunAnalysis({
  workout,
  recentPace,
  recentDistance,
  heartRateTrend,
  recoveryExplanation,
}: {
  workout: WorkoutType | null;
  recentPace: string | null;
  recentDistance: number | null;
  heartRateTrend: string;
  recoveryExplanation: string;
}) {
  if (!workout) {
    return "Short answer: I do not have a recent logged run to analyze yet.\n\nWhy: The coach works best when it can tie the answer to an actual session instead of guessing.\n\nWhat to do next: Log a run, or ask me about today's workout, pacing, recovery, or a race goal instead.";
  }

  const effortRead =
    workout.effort >= 8
      ? "This was a hard session, so the main question is whether it was controlled hard or costly hard."
      : workout.effort >= 6
        ? "This looks like moderate work, which is useful when it fits the plan and does not spill into threshold effort."
        : "This was a lighter run, so the value is mostly in aerobic support and recovery, not proving fitness.";
  const feelRead =
    workout.expectation === "harder"
      ? "It felt harder than expected, which usually points to fatigue, heat, low fueling, or a pace mismatch."
      : workout.reflectionFeel === "rough"
        ? "Your reflection suggests the session took more out of you than it should have."
        : workout.reflectionFeel === "great"
          ? "Your reflection suggests the run landed well and was absorbed cleanly."
          : "Nothing here suggests the session went wildly off script.";

  return [
    `Short answer: Last logged run: ${workout.type || "Run"}.`,
    `Why: Details: ${formatLoggedWorkoutDetails(workout, recentDistance, recentPace, heartRateTrend)} What it suggests: ${workout.effort >= 8 ? "this was a fairly demanding day" : workout.effort >= 6 ? "this was solid training stress" : "this was a controlled aerobic day"}. ${effortRead} ${feelRead} ${heartRateTrend === "elevated" ? "Your HR trend is also elevated, so this run may have cost more recovery than usual." : recoveryExplanation}`,
    `What to do next: ${workout.effort >= 8 ? "Keep the next run easy, do not chase pace, and make sure food and sleep are strong before the next hard session." : workout.effort >= 6 ? "Treat the next day like support work unless the plan clearly calls for another quality session." : "Use this as a good setup run and keep the next harder session specific rather than forcing extra volume."}`,
  ].join("\n\n");
}

function buildTodayWorkoutHelp({
  todayWorkout,
  nextPlannedWorkout,
  recoveryRecommendation,
  recoveryAdjustment,
}: {
  todayWorkout: ReturnType<typeof getTodayPlanDay> | null;
  nextPlannedWorkout: ReturnType<typeof getNextPlannedWorkout>;
  recoveryRecommendation: string;
  recoveryAdjustment: "push" | "maintain" | "ease_off";
}) {
  if (!todayWorkout) {
    return [
      "Short answer: There is no workout scheduled for today.",
      `Why: ${nextPlannedWorkout ? `The next planned workout is ${nextPlannedWorkout.title} on ${nextPlannedWorkout.day}.` : "I cannot see a loaded plan item to anchor the day right now."}`,
      `What to do next: ${nextPlannedWorkout ? `Ask me to explain ${nextPlannedWorkout.title}, or tap Explain workout and choose the next planned session.` : "Open your plan, or ask about tomorrow's workout and I will coach it from there."}`,
    ].join("\n\n");
  }

  const feelCue =
    todayWorkout.kind === "recovery" || todayWorkout.kind === "easy"
      ? "It should feel conversational and almost too controlled."
      : todayWorkout.kind === "long"
        ? "It should feel patient early and mostly aerobic unless the plan clearly calls for progression."
        : todayWorkout.kind === "quality"
          ? "It should feel controlled hard, not reckless."
          : "It should match the purpose of the day without drifting into race effort.";

  return [
    `Short answer: Today's scheduled workout: ${todayWorkout.title}.`,
    `Why: Key details: ${formatPlannedWorkoutDetails(todayWorkout)} Purpose: ${getWorkoutPurposeSummary(todayWorkout)} ${feelCue} ${recoveryRecommendation}`,
    `What to do next: ${recoveryAdjustment === "ease_off" ? "Start easy, run by effort instead of pace, and be willing to shorten or simplify it if the body never comes around." : recoveryAdjustment === "maintain" ? "Open the run a little more conservatively than normal, then settle into the right effort once breathing and rhythm smooth out." : "Warm up calmly, then execute the session as planned and keep the effort tied to the workout goal."}`,
  ].join("\n\n");
}

function buildWorkoutExplainChoice(plan: ReturnType<typeof buildAdaptiveWeeklyPlan>["plan"]): PendingChoice {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const options = [
    plan[todayIndex]
      ? { id: `offset-0`, label: `Today`, detail: plan[todayIndex].title }
      : null,
    plan[(todayIndex + 1) % plan.length]
      ? { id: `offset-1`, label: `Tomorrow`, detail: plan[(todayIndex + 1) % plan.length].title }
      : null,
    ...plan.slice(todayIndex + 2, Math.min(todayIndex + 5, plan.length)).map((day, index) => ({
      id: `offset-${index + 2}`,
      label: day.day,
      detail: day.title,
    })),
  ].filter(Boolean) as PendingChoice["options"];

  return {
    kind: "explain_workout",
    title: "Choose a workout to explain",
    subtitle: "Pick today, tomorrow, or another upcoming session from your current week.",
    options,
  };
}

function getSelectedWorkoutForExplanation(
  optionId: string,
  plan: ReturnType<typeof buildAdaptiveWeeklyPlan>["plan"]
) {
  const offsetValue = Number.parseInt(optionId.replace("offset-", ""), 10);
  const todayIndex = (new Date().getDay() + 6) % 7;

  if (!Number.isFinite(offsetValue)) {
    return null;
  }

  return plan[(todayIndex + offsetValue) % plan.length] ?? null;
}

function buildWorkoutExplanationSelectionReply({
  optionId,
  selectedWorkout,
  recoveryAdjustment,
}: {
  optionId: string;
  selectedWorkout: ReturnType<typeof getSelectedWorkoutForExplanation>;
  recoveryAdjustment: "push" | "maintain" | "ease_off";
}) {
  if (!selectedWorkout) {
    return "Short answer: I could not find that scheduled workout.\n\nWhy: The current plan does not have a clear session tied to that selection.\n\nWhat to do next: Choose another upcoming workout or ask me about the run you want to understand.";
  }

  const development =
    selectedWorkout.kind === "long"
      ? "endurance and durability"
      : selectedWorkout.kind === "recovery" || selectedWorkout.kind === "easy"
        ? "aerobic support with low recovery cost"
        : selectedWorkout.kind === "quality"
          ? "specific quality that sharpens race-relevant fitness"
          : "steady aerobic strength";

  return [
    `Short answer: Selected workout: ${selectedWorkout.title}.`,
    `Why: Key details: ${formatPlannedWorkoutDetails(selectedWorkout)} What it is: ${getWorkoutTypeSummary(selectedWorkout)} Why it is in the plan: this session builds ${development} without overlapping too much with the harder and longer work around it.`,
    `What to do next: ${recoveryAdjustment === "ease_off" ? "Keep the effort one notch more controlled than the written ideal and let feel beat pace if the body is not fresh." : "Anchor the session to effort first, then use pace only if it matches how the run is supposed to feel."}`,
  ].join("\n\n");
}

function getRacePredictionLabel(optionId: string) {
  switch (optionId) {
    case "800m":
      return "800m";
    case "1500m":
      return "1500m";
    case "1600m_mile":
      return "1600m / mile";
    case "5k":
      return "5K";
    case "10k":
      return "10K";
    default:
      return "half marathon";
  }
}

function buildRacePredictionReply({
  eventId,
  context,
}: {
  eventId: string;
  context: RunningCoachContext;
}) {
  const prediction = getRacePredictionEstimate(eventId, context);

  if (!prediction) {
    return `Short answer: Selected race: ${getRacePredictionLabel(eventId)}.\n\nWhy: I do not have enough race-quality data to give a trustworthy prediction for that event yet. A useful estimate needs either a recent race mark, a solid training block, or enough timed runs to anchor it.\n\nWhat to do next: Log a few steady and quality runs, or add a recent PR so I can make the prediction more specific.`;
  }

  return [
    `Short answer: Selected race: ${prediction.label}. Current prediction: about ${prediction.time}.`,
    `Why: Data used: ${prediction.dataPoints}. ${prediction.reasoning}`,
    `What to do next: Treat that as a realistic current read, not a ceiling. If you want to improve it, ask what training change would move the prediction the most.`,
  ].join("\n\n");
}

function getRacePredictionEstimate(eventId: string, context: RunningCoachContext) {
  const goalMiles = getRaceDistanceMiles(eventId);
  const candidateTimes = [
    ...getStoredRaceCandidates(context.profile),
    ...getRecentWorkoutCandidates(context.workouts),
  ]
    .filter((candidate) => candidate.miles > 0 && candidate.seconds > 0)
    .slice(0, 8);

  if (candidateTimes.length === 0 || !goalMiles) {
    return null;
  }

  const projectedSeconds = candidateTimes.map((candidate) => {
    return candidate.seconds * Math.pow(goalMiles / candidate.miles, 1.06);
  });
  const averageProjection =
    projectedSeconds.reduce((sum, seconds) => sum + seconds, 0) / projectedSeconds.length;
  const consistencyModifier =
    (context.weeklySummary?.runCount ?? 0) >= 5 ? 0.985 : (context.weeklySummary?.runCount ?? 0) >= 3 ? 1 : 1.02;
  const mileageModifier =
    (context.weeklySummary?.totalMiles ?? 0) >= (Number.parseFloat(context.profile.mileage) || 30) * 0.9
      ? 0.99
      : 1.015;
  const adjustedSeconds = Math.round(averageProjection * consistencyModifier * mileageModifier);

  return {
    label: getRacePredictionLabel(eventId),
    time: formatDuration(adjustedSeconds),
    dataPoints: buildRacePredictionDataPoints(context),
    reasoning:
      candidateTimes.length > 1
        ? `You have enough recent running to anchor the estimate, and I kept it honest by adjusting slightly for current weekly rhythm rather than giving you a hype answer.`
        : `This is anchored to your best available mark, so it is useful as a practical estimate but still less certain than a prediction built from several recent race-quality efforts.`,
  };
}

function getStoredRaceCandidates(profile: RunningCoachContext["profile"]) {
  const candidates: { miles: number; seconds: number }[] = [];
  const stored = [
    { key: "800" as const, miles: 0.4971 },
    { key: "1600" as const, miles: 0.9942 },
    { key: "5k" as const, miles: 3.1069 },
    { key: "10k" as const, miles: 6.2137 },
    { key: "half" as const, miles: 13.1094 },
    { key: "marathon" as const, miles: 26.2188 },
  ];

  stored.forEach((entry) => {
    const source = profile.prs[entry.key];
    const seconds = parseTimeToSeconds(source);

    if (seconds) {
      candidates.push({ miles: entry.miles, seconds });
    }
  });

  return candidates;
}

function getRecentWorkoutCandidates(workouts: WorkoutType[]) {
  return [...workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 8)
    .flatMap((workout) => {
      const miles = parseDistance(workout.distance);
      const seconds = parseTimeToSeconds(workout.time);

      if (!miles || !seconds || workout.effort < 5) {
        return [];
      }

      return [{ miles, seconds }];
    });
}

function getRaceDistanceMiles(eventId: string) {
  switch (eventId) {
    case "800m":
      return 0.4971;
    case "1500m":
      return 0.932056;
    case "1600m_mile":
      return 0.9942;
    case "5k":
      return 3.1069;
    case "10k":
      return 6.2137;
    case "half_marathon":
      return 13.1094;
    default:
      return null;
  }
}

function formatLoggedWorkoutDetails(
  workout: WorkoutType,
  recentDistance: number | null,
  recentPace: string | null,
  heartRateTrend: string
) {
  const details = [
    workout.date ? formatFeedDate(workout.date) : null,
    recentDistance ? `${recentDistance.toFixed(recentDistance % 1 === 0 ? 0 : 1)} mi` : workout.distance || null,
    workout.time || null,
    recentPace ? `${recentPace} pace` : null,
    Number.isFinite(workout.effort) ? `effort ${workout.effort}/10` : null,
    heartRateTrend ? `HR trend ${heartRateTrend.replace("_", " ")}` : null,
  ].filter(Boolean);

  return details.join(" • ");
}

function formatPlannedWorkoutDetails(workout: NonNullable<ReturnType<typeof getTodayPlanDay>>) {
  const details = [
    workout.day,
    workout.distance > 0 ? `${workout.distance} mi planned` : "Duration/effort focus",
    workout.kind,
    workout.details,
  ].filter(Boolean);

  return details.join(" • ");
}

function getWorkoutPurposeSummary(workout: NonNullable<ReturnType<typeof getTodayPlanDay>>) {
  if (workout.kind === "easy" || workout.kind === "recovery") {
    return "build aerobic support without adding much recovery cost.";
  }

  if (workout.kind === "long") {
    return "extend endurance and reinforce durable aerobic strength.";
  }

  if (workout.kind === "quality") {
    return "sharpen race-relevant fitness with controlled quality.";
  }

  return "develop the intended system for this part of the week.";
}

function getWorkoutTypeSummary(workout: NonNullable<ReturnType<typeof getTodayPlanDay>>) {
  if (workout.kind === "easy" || workout.kind === "recovery") {
    return "an aerobic support run that should stay controlled.";
  }

  if (workout.kind === "long") {
    return "an endurance-focused session built around time on feet and steady aerobic work.";
  }

  if (workout.kind === "quality") {
    return "a quality session meant to target a specific fitness demand.";
  }

  return "a steady run that supports the shape of the week.";
}

function getNextPlannedWorkout(plan: ReturnType<typeof buildAdaptiveWeeklyPlan>["plan"]) {
  const todayIndex = (new Date().getDay() + 6) % 7;

  for (let offset = 1; offset < plan.length; offset += 1) {
    const workout = plan[(todayIndex + offset) % plan.length];

    if (workout) {
      return workout;
    }
  }

  return null;
}

function buildRacePredictionDataPoints(context: RunningCoachContext) {
  const data = [
    context.profile.pr5k ? `saved 5K PR ${context.profile.pr5k}` : null,
    context.weeklySummary?.totalMiles ? `${context.weeklySummary.totalMiles.toFixed(1)} mi this week` : null,
    context.weeklySummary?.runCount ? `${context.weeklySummary.runCount} recent runs this week` : null,
    context.workouts.length > 0 ? `${Math.min(context.workouts.length, 8)} recent logged runs considered` : null,
  ].filter(Boolean);

  return data.join(", ");
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getRaceCountdownText(value: string) {
  const raceDate = new Date(value);

  if (Number.isNaN(raceDate.getTime())) {
    return "Race date saved";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  raceDate.setHours(0, 0, 0, 0);
  const days = Math.round((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days > 1) {
    return `${days} days to race day`;
  }

  if (days === 1) {
    return "Race is tomorrow";
  }

  if (days === 0) {
    return "Race is today";
  }

  return "Race date has passed";
}
