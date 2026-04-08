import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AdaptiveTrainingCard } from "@/components/adaptive-training-card";
import { OnTrackCard } from "@/components/on-track-card";
import { RetentionHighlightsCard } from "@/components/retention-highlights-card";
import { GlowBackground, TrackLinesBackdrop } from "@/components/running-visuals";
import { TodayWorkoutCard } from "@/components/today-workout-card";
import { WeeklyPerformanceSummaryCard } from "@/components/weekly-performance-summary-card";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { AnimatedProgressBar, ExpandablePanel, FadeInView, FloatingModalCard, InteractivePressable, SuccessBadge } from "@/components/ui-polish";
import { getSurfaceCardStyle, PrimaryButton, SecondaryButton } from "@/components/ui-kit";
import { useProfile } from "@/contexts/profile-context";
import { buildHomePersonalization } from "@/lib/onboarding-personalization";
import { useResponsiveLayout } from "@/lib/responsive";
import { getCoachInsightOfTheDay, getMiniAchievements, getRacePredictorHighlight, getTomorrowPreview, type MiniAchievement } from "@/lib/runner-return";
import { getAdaptiveCoachRecommendations, getInsightsSummary, getWeeklyGoalProgress } from "@/utils/training-insights";
import { useThemeColors } from "@/contexts/theme-context";
import { buildAdaptiveWeeklyPlan } from "@/lib/training-plan";
import { useWorkouts } from "@/contexts/workout-context";
import { getStreakSummary, getWeeklySummary } from "@/utils/workout-utils";
import { ThemeTokens } from "@/constants/theme";

export default function Home() {
  const { profile, displayName, heartRateZones, applyAutomaticPr } = useProfile();
  const { workouts, completedWorkoutIds, likedWorkoutCategories, planCycle, addWorkout } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const layout = useResponsiveLayout();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [quickLogType, setQuickLogType] = useState("Easy Run");
  const [quickLogDistance, setQuickLogDistance] = useState("");
  const [quickLogTime, setQuickLogTime] = useState("");
  const [quickLogEffort, setQuickLogEffort] = useState("5");
  const [quickLogNotes, setQuickLogNotes] = useState("");
  const [quickLogFeel, setQuickLogFeel] = useState<"great" | "solid" | "flat" | "rough" | null>(null);
  const [quickLogExpectation, setQuickLogExpectation] = useState<"easier" | "as_expected" | "harder" | null>(null);
  const [quickLogSuccess, setQuickLogSuccess] = useState<string | null>(null);

  const mileageGoal = parseFloat(profile.mileage) || 30;
  const weeklyGoal = useMemo(() => getWeeklyGoalProgress(workouts, mileageGoal), [mileageGoal, workouts]);
  const weeklySummary = useMemo(() => getWeeklySummary(workouts), [workouts]);
  const streakSummary = useMemo(() => getStreakSummary(workouts.map((workout) => workout.date)), [workouts]);
  const homePersonalization = useMemo(() => buildHomePersonalization(profile), [profile]);

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
  const tomorrowWorkout = useMemo(() => getTomorrowPreview(weeklyPlan, completedWorkoutIds), [completedWorkoutIds, weeklyPlan]);
  const miniAchievements = useMemo(() => getMiniAchievements(workouts), [workouts]);
  const coachInsight = useMemo(
    () => getCoachInsightOfTheDay(profile, workouts, weeklyPlan, completedWorkoutIds),
    [completedWorkoutIds, profile, weeklyPlan, workouts]
  );
  const racePredictorHighlight = useMemo(() => getRacePredictorHighlight(profile, workouts), [profile, workouts]);

  const primaryInsight = guidanceInsights[0]
    ? { eyebrow: "Guide insight", title: guidanceInsights[0].title, detail: guidanceInsights[0].detail }
    : insightMessages[0]
      ? { eyebrow: "Training insight", title: insightMessages[0].title, detail: "A single useful read to keep the rest of the week focused." }
      : { eyebrow: "Daily focus", title: "Keep the week simple", detail: "Open today's workout, hit the planned purpose, and let the rest of the week build from there." };
  const weeklyCompletionRate = Math.min((weeklySummary.workoutsCompleted / Math.max(profile.preferredTrainingDays || 4, 1)) * 100, 100);
  const quickSignalsSubtitle = tomorrowWorkout
    ? `${tomorrowWorkout.day}: ${tomorrowWorkout.title}`
    : "Tomorrow's preview appears here when the week is active.";

  const handleQuickLog = () => {
    addWorkout({
      type: quickLogType.trim() || "Run",
      distance: quickLogDistance,
      time: quickLogTime,
      splits: "",
      effort: Math.max(1, Math.min(Number.parseInt(quickLogEffort, 10) || 5, 10)),
      notes: quickLogNotes,
      reflectionFeel: quickLogFeel ?? undefined,
      expectation: quickLogExpectation ?? undefined,
    });
    applyAutomaticPr({ distance: quickLogDistance, time: quickLogTime });
    setQuickLogOpen(false);
    setQuickLogSuccess("Run logged");
    setQuickLogType("Easy Run");
    setQuickLogDistance("");
    setQuickLogTime("");
    setQuickLogEffort("5");
    setQuickLogNotes("");
    setQuickLogFeel(null);
    setQuickLogExpectation(null);
    setTimeout(() => setQuickLogSuccess(null), 2800);
  };

  return (
    <AnimatedTabScene tabKey="index">
      <ScreenScroll colors={colors}>
        <TrackLinesBackdrop variant="road" style={{ top: 86, height: 760 }} />
        <TopProfileBar imageUri={profile.image} name={displayName} showName={true} onAvatarPress={openDrawer} />

        <FadeInView delay={30}>
          <View
            style={[
              getSurfaceCardStyle(colors, { tone: "accent", padding: ThemeTokens.spacing.ml }),
              { gap: ThemeTokens.spacing.s, overflow: "hidden" },
            ]}
          >
            <GlowBackground variant="road" />
            <View
              style={{
                position: "absolute",
                top: -28,
                right: -18,
                width: 180,
                height: 180,
                borderRadius: 999,
                backgroundColor: "rgba(37, 99, 235, 0.16)",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: -34,
                left: -18,
                width: 170,
                height: 170,
                borderRadius: 999,
                backgroundColor: "rgba(103, 232, 249, 0.08)",
              }}
            />
            <View style={{ gap: ThemeTokens.spacing.s }}>
              <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1.2 }}>{homePersonalization.eyebrow}</Text>
              <Text style={{ color: colors.text, fontSize: layout.isDesktop ? 34 : layout.isPhone ? 26 : 30, fontWeight: "800", lineHeight: layout.isDesktop ? 40 : layout.isPhone ? 32 : 36, maxWidth: 740 }}>{homePersonalization.title}</Text>
              <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight, maxWidth: 640 }}>
                {homePersonalization.subtitle}
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <HeadlinePill label={`${weeklySummary.workoutsCompleted} runs this week`} />
              <HeadlinePill label={`${streakSummary.current}-day streak`} emphasis />
              <HeadlinePill label={primaryInsight.eyebrow} />
            </View>
          </View>
        </FadeInView>

        <TodayWorkoutCard
          plan={weeklyPlan}
          completedWorkoutIds={completedWorkoutIds}
          heartRateZones={heartRateZones}
        />

        <View
          style={[
            getSurfaceCardStyle(colors, { tone: "contrast", padding: ThemeTokens.spacing.m }),
            { gap: ThemeTokens.spacing.m, overflow: "hidden" },
          ]}
        >
          <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
            <HeroMetric colors={colors} label="Weekly goal" value={`${mileageGoal} mi`} detail={`${weeklyGoal.currentMiles.toFixed(1)} mi done`} footer={`${Math.round(weeklyGoal.progressPercent)}% complete`} progress={weeklyGoal.progressPercent} />
            <HeroMetric colors={colors} label="Consistency" value={`${streakSummary.current} days`} detail={`Best ${streakSummary.best} days`} footer={`${weeklySummary.workoutsCompleted} runs logged this week`} progress={weeklyCompletionRate} />
            <HeroMetric colors={colors} label="Next focus" value={primaryInsight.title} detail="Coach-style read" footer={primaryInsight.detail} accent />
          </View>

          <View
            style={{
              backgroundColor: "rgba(8, 17, 29, 0.52)",
              borderRadius: ThemeTokens.radii.lg,
              borderWidth: 1,
              borderColor: "rgba(103, 232, 249, 0.12)",
              paddingHorizontal: ThemeTokens.spacing.m,
              paddingVertical: ThemeTokens.spacing.ms,
              flexDirection: layout.isPhone ? "column" : "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Text style={{ color: "#f8fbff", fontSize: ThemeTokens.typography.body.fontSize, fontWeight: "700", flex: 1 }}>
              {weeklyGoal.progressPercent >= 100
                ? "Weekly goal closed. Keep the next few runs controlled and let the momentum compound."
                : streakSummary.current >= 5
                  ? "Momentum is real right now. Protect the rhythm and make today's run count."
                  : "The week is still being built. A calm, clean run today moves everything forward."}
            </Text>
            <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.small.fontSize, fontWeight: "800" }}>
              {weeklyGoal.progressPercent >= 100 ? "On target" : `${Math.max(mileageGoal - weeklyGoal.currentMiles, 0).toFixed(1)} mi left`}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <QuickAccessMiniCard title="Recovery" subtitle="Readiness" onPress={() => router.push("/engine/recovery" as never)} />
          <QuickAccessMiniCard title="Fueling" subtitle="Add food" onPress={() => router.push("/engine/fueling" as never)} />
          <QuickAccessMiniCard title="Plan" subtitle="This week" onPress={() => router.push("/(solo)/explore")} />
          <QuickAccessMiniCard title="Progress" subtitle="Recent runs" onPress={() => router.push("/(solo)/progress")} />
        </View>

        {quickLogSuccess ? (
          <FadeInView delay={20}>
            <SuccessBadge label={quickLogSuccess} detail="Your latest run is saved and ready to inform the coach." />
          </FadeInView>
        ) : null}

        <View style={[getSurfaceCardStyle(colors, { tone: "contrast", padding: ThemeTokens.spacing.m }), { gap: ThemeTokens.spacing.s }]}>
        <ExpandablePanel
          title="Today at a glance"
          subtitle={quickSignalsSubtitle}
          headerRight={<Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{coachInsight.eyebrow}</Text>}
        >
        <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
          <SignalCard
            colors={colors}
            eyebrow="Tomorrow"
            title={tomorrowWorkout ? tomorrowWorkout.title : "No workout loaded yet"}
            body={
              tomorrowWorkout
                ? `${tomorrowWorkout.day} · ${tomorrowWorkout.distance > 0 ? `${tomorrowWorkout.distance} mi planned` : "Recovery focus"}`
                : "Open your plan to see the next scheduled session."
            }
            footer={tomorrowWorkout ? tomorrowWorkout.details : "The next-day preview appears here once your week is active."}
          />
          <SignalCard
            colors={colors}
            eyebrow={coachInsight.eyebrow}
            title={coachInsight.title}
            body={coachInsight.detail}
            footer="Short coach-style guidance to keep the next move simple."
            accent
          />
        </View>
        </ExpandablePanel>
        </View>

        <View
          style={[
            getSurfaceCardStyle(colors, { padding: ThemeTokens.spacing.ml }),
            { gap: ThemeTokens.spacing.m },
          ]}
        >
          <ExpandablePanel
            title="Week overview"
            subtitle="Weekly progress, streak, and calendar-style reinforcement."
          >
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
                <CompactStatCard colors={colors} tone="default" title="Weekly Progress" value={`${weeklyGoal.currentMiles.toFixed(1)} mi`} detail={`of ${mileageGoal} mi goal`} footer={`${weeklySummary.workoutsCompleted} workouts logged this week`} progressPercent={weeklyGoal.progressPercent} />
                <CompactStatCard colors={colors} tone="contrast" title="Streak" value={`${streakSummary.current} days`} detail={`Best streak: ${streakSummary.best} days`} footer={weeklySummary.longestRun > 0 ? `Longest run this week: ${weeklySummary.longestRun.toFixed(1)} mi` : "Log a run to start building momentum"} />
              </View>
              <RetentionHighlightsCard />
            </View>
          </ExpandablePanel>

          <ExpandablePanel
            title="Insights"
            subtitle="Small wins, prediction reads, and broader training signals."
          >
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
                <View style={{ flex: 1.1, gap: 12 }}>
                  {miniAchievements.map((achievement) => (
                    <AchievementCard key={achievement.title} achievement={achievement} />
                  ))}
                </View>
                <Pressable
                  onPress={() => router.push("/race-predictor")}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: "#101f34",
                    borderRadius: ThemeTokens.radii.xl,
                    borderWidth: 1,
                    borderColor: "rgba(103, 232, 249, 0.18)",
                    padding: ThemeTokens.spacing.ml,
                    gap: ThemeTokens.spacing.s,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }, { translateY: pressed ? 1 : 0 }],
                    overflow: "hidden",
                  })}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: -18,
                      right: -10,
                      width: 120,
                      height: 120,
                      borderRadius: 999,
                      backgroundColor: "rgba(103, 232, 249, 0.08)",
                    }}
                  />
                  <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>RACE PREDICTOR</Text>
                  <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h2.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h2.lineHeight }}>{racePredictorHighlight.title}</Text>
                  <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, lineHeight: 21 }}>{racePredictorHighlight.detail}</Text>
                  <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.small.fontSize, fontWeight: "700", marginTop: ThemeTokens.spacing.xs }}>{racePredictorHighlight.cta}</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14, alignItems: "stretch" }}>
                <View style={{ flex: 1.05 }}>
                  <OnTrackCard />
                </View>
                <View style={{ flex: 0.95 }}>
                  <AdaptiveTrainingCard />
                </View>
              </View>

              <WeeklyPerformanceSummaryCard />
            </View>
          </ExpandablePanel>

          <ExpandablePanel
            title="Quick actions"
            subtitle="Quick log, plan, and coach shortcuts stay one tap away."
            headerRight={<Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>3 shortcuts</Text>}
          >
            <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
              <ActionCard title="Quick log" body="Save a run fast, including simple reflection notes that make future coaching smarter." cta="Quick log run" onPress={() => setQuickLogOpen(true)} colors={colors} accent={true} />
              <ActionCard title="Next action" body="Open your plan, review the next few days, and keep the week moving with less guesswork." cta="Go to plan" onPress={() => router.push("/(solo)/explore")} colors={colors} accent={true} />
              <ActionCard title={primaryInsight.eyebrow} body={primaryInsight.detail} cta="Open Guide" onPress={() => router.push("/(solo)/guide")} colors={colors} />
            </View>
          </ExpandablePanel>
        </View>

        <FloatingModalCard visible={quickLogOpen} onClose={() => setQuickLogOpen(false)}>
            <View
              style={[
                getSurfaceCardStyle(colors, { padding: ThemeTokens.spacing.ml, radius: ThemeTokens.radii.xl }),
                { maxHeight: "88%" },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>QUICK LOG</Text>
                <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", lineHeight: 34 }}>
                  Save a run without leaving Home
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                  Keep it fast: log the basics, add a quick feel check, and let the app use it everywhere else.
                </Text>

                <QuickLogField colors={colors} label="Workout type" value={quickLogType} onChangeText={setQuickLogType} placeholder="Easy Run" />
                <QuickLogField colors={colors} label="Distance (miles)" value={quickLogDistance} onChangeText={setQuickLogDistance} placeholder="5.0" keyboardType="numeric" />
                <QuickLogField colors={colors} label="Time" value={quickLogTime} onChangeText={setQuickLogTime} placeholder="42:10" />
                <QuickLogField colors={colors} label="Effort (1-10)" value={quickLogEffort} onChangeText={setQuickLogEffort} placeholder="5" keyboardType="numeric" />
                <QuickLogField colors={colors} label="Notes" value={quickLogNotes} onChangeText={setQuickLogNotes} placeholder="Optional notes" multiline />

                <QuickChoiceRow
                  colors={colors}
                  title="How did it feel?"
                  selected={quickLogFeel}
                  options={[
                    { value: "great", label: "Felt strong" },
                    { value: "solid", label: "Felt solid" },
                    { value: "flat", label: "Felt flat" },
                    { value: "rough", label: "Felt rough" },
                  ]}
                  onSelect={setQuickLogFeel}
                />

                <QuickChoiceRow
                  colors={colors}
                  title="Compared with expectation"
                  selected={quickLogExpectation}
                  options={[
                    { value: "easier", label: "Easier" },
                    { value: "as_expected", label: "As expected" },
                    { value: "harder", label: "Harder" },
                  ]}
                  onSelect={setQuickLogExpectation}
                />

                <PrimaryButton label="Save run" onPress={handleQuickLog} />
                <SecondaryButton label="Close" onPress={() => setQuickLogOpen(false)} />
              </ScrollView>
            </View>
        </FloatingModalCard>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function HeroMetric({
  colors,
  label,
  value,
  detail,
  footer,
  progress,
  accent,
}: {
  colors: { card: string; border: string; text: string; subtext: string };
  label: string;
  value: string;
  detail: string;
  footer: string;
  progress?: number;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? "rgba(37, 99, 235, 0.2)" : "rgba(10, 21, 35, 0.8)",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: accent ? "rgba(103, 232, 249, 0.16)" : "rgba(148, 163, 184, 0.12)",
        padding: ThemeTokens.spacing.m,
        gap: ThemeTokens.spacing.s,
        shadowColor: accent ? "#0ea5e9" : "#020817",
        shadowOpacity: accent ? 0.18 : 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      }}
    >
      <Text style={{ color: accent ? "#67e8f9" : colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", lineHeight: 22 }}>{value}</Text>
      <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 18 }}>{detail}</Text>
      {typeof progress === "number" ? (
        <AnimatedProgressBar progress={progress} fillColor={accent ? "#67e8f9" : colors.primary} trackColor="rgba(255,255,255,0.08)" height={7} />
      ) : null}
      <Text style={{ color: accent ? "#cfeeff" : colors.subtext, fontSize: 12, lineHeight: 18 }}>{footer}</Text>
    </View>
  );
}

function HeadlinePill({
  label,
  emphasis,
}: {
  label: string;
  emphasis?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: emphasis ? "rgba(37, 99, 235, 0.18)" : "rgba(255,255,255,0.05)",
        borderRadius: ThemeTokens.radii.round,
        borderWidth: 1,
        borderColor: emphasis ? "rgba(103, 232, 249, 0.18)" : "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: ThemeTokens.spacing.m,
        paddingVertical: ThemeTokens.spacing.s,
      }}
    >
      <Text style={{ color: emphasis ? "#dff4ff" : "#b7c9dc", fontSize: ThemeTokens.typography.small.fontSize, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
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
    <View style={{ flex: 1, backgroundColor: tone === "contrast" ? "#101f34" : "#0f1b2d", borderRadius: 30, borderWidth: 1, borderColor: tone === "contrast" ? "rgba(103, 232, 249, 0.18)" : colors.border, padding: 20, gap: 10, shadowColor: tone === "contrast" ? "#67e8f9" : "#020817", shadowOpacity: tone === "contrast" ? 0.12 : 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, overflow: "hidden" }}>
      {tone === "contrast" ? (
        <View
          style={{
            position: "absolute",
            top: -24,
            right: -20,
            width: 130,
            height: 130,
            borderRadius: 999,
            backgroundColor: "rgba(103, 232, 249, 0.08)",
          }}
        />
      ) : null}
      <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>{title.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 27, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>{detail}</Text>
      {typeof progressPercent === "number" ? (
        <AnimatedProgressBar progress={progressPercent} fillColor="#2563eb" trackColor="rgba(255, 255, 255, 0.08)" height={10} />
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
    <InteractivePressable
      onPress={onPress}
      scaleTo={0.97}
      style={{ flex: 1, backgroundColor: accent ? "#12243b" : "rgba(10, 21, 35, 0.84)", borderRadius: ThemeTokens.radii.lg, borderWidth: 1, borderColor: accent ? "rgba(103, 232, 249, 0.16)" : "rgba(148, 163, 184, 0.12)", padding: ThemeTokens.spacing.ml, gap: ThemeTokens.spacing.s, shadowColor: accent ? "#67e8f9" : "#020817", shadowOpacity: accent ? 0.16 : 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, overflow: "hidden" }}
    >
      {accent ? (
        <View
          style={{
            position: "absolute",
            top: -18,
            right: -10,
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "rgba(103, 232, 249, 0.08)",
          }}
        />
      ) : null}
      <Text style={{ color: accent ? "#67e8f9" : colors.subtext, fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>{title.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h3.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h3.lineHeight }}>{accent ? "Stay moving forward" : title}</Text>
      <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight }}>{body}</Text>
      <Text style={{ color: accent ? "#67e8f9" : "#93c5fd", fontSize: ThemeTokens.typography.body.fontSize, fontWeight: "700", marginTop: ThemeTokens.spacing.xs }}>{cta}</Text>
    </InteractivePressable>
  );
}

function QuickAccessMiniCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <InteractivePressable
      onPress={onPress}
      style={{
        flexGrow: 1,
        minWidth: "22%",
        backgroundColor: "rgba(10, 20, 33, 0.8)",
        borderRadius: ThemeTokens.radii.md,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: ThemeTokens.spacing.m,
        paddingVertical: ThemeTokens.spacing.m,
        gap: ThemeTokens.spacing.xs,
        shadowColor: "#020817",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <Text style={{ color: "#f8fbff", fontSize: 15, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700" }}>{subtitle}</Text>
    </InteractivePressable>
  );
}

function SignalCard({
  colors,
  eyebrow,
  title,
  body,
  footer,
  accent,
}: {
  colors: { text: string; subtext: string; border: string };
  eyebrow: string;
  title: string;
  body: string;
  footer: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? "#12243b" : "rgba(10, 21, 35, 0.84)",
        borderRadius: ThemeTokens.radii.lg,
        borderWidth: 1,
        borderColor: accent ? "rgba(103, 232, 249, 0.16)" : "rgba(148, 163, 184, 0.12)",
        padding: ThemeTokens.spacing.m,
        gap: ThemeTokens.spacing.s,
        shadowColor: accent ? "#38bdf8" : "#020817",
        shadowOpacity: accent ? 0.14 : 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      }}
    >
      <Text style={{ color: accent ? "#67e8f9" : "#9db2ca", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{eyebrow.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800", lineHeight: 27 }}>{title}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 }}>{body}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>{footer}</Text>
    </View>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: MiniAchievement;
}) {
  const toneColor =
    achievement.tone === "consistency" ? "#67e8f9" : achievement.tone === "milestone" ? "#4ade80" : "#93c5fd";

  return (
    <View
      style={{
        backgroundColor: "rgba(10, 21, 35, 0.84)",
        borderRadius: ThemeTokens.radii.lg,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        padding: ThemeTokens.spacing.m,
        gap: ThemeTokens.spacing.xs,
      }}
    >
      <Text style={{ color: toneColor, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>MILESTONE</Text>
      <Text style={{ color: "#f8fbff", fontSize: 16, fontWeight: "800" }}>{achievement.title}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19 }}>{achievement.detail}</Text>
    </View>
  );
}

function QuickLogField({
  colors,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  colors: { text: string; subtext: string; background: string; border: string };
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontSize: 15,
          minHeight: multiline ? 92 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function QuickChoiceRow<T extends string>({
  colors,
  title,
  selected,
  options,
  onSelect,
}: {
  colors: { text: string; primarySoft: string; primary: string; cardAlt: string; border: string };
  title: string;
  selected: T | null;
  options: readonly { value: T; label: string }[];
  onSelect: (value: T) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => ({
              backgroundColor: selected === option.value ? colors.primarySoft : colors.cardAlt,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: selected === option.value ? colors.primary : colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
