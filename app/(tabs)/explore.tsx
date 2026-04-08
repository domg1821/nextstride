import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { ConditionTrainingCard } from "@/components/condition-training-card";
import TopProfileBar from "@/components/TopProfileBar";
import { PostRunFeedbackCard } from "@/components/post-run-feedback-card";
import { useQuickDrawer } from "@/components/quick-drawer";
import { TrackLinesBackdrop } from "@/components/running-visuals";
import { WorkoutEffortChip } from "@/components/workout-effort-chip";
import { getSurfaceCardStyle, InfoCard, PageHeader, PrimaryButton, SecondaryButton, StatCard } from "@/components/ui-kit";
import { AnimatedProgressBar, ExpandablePanel, FadeInView, FloatingModalCard, SuccessBadge, animateNextLayout } from "@/components/ui-polish";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { type PostRunFeedback, generatePostRunFeedback } from "@/lib/premium-coach";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getFuelingStrategyForWorkout } from "@/lib/fueling-guidance";
import { useEngine } from "@/contexts/engine-context";
import { getRecoveryFuelingConnection, getUnifiedRecoveryState, getWorkoutAdjustment, getWorkoutStructure } from "@/lib/recovery-engine";
import { useResponsiveLayout } from "@/lib/responsive";
import { buildAdaptiveWeeklyPlan, type PlanDay } from "@/lib/training-plan";
import { buildUpgradePath } from "@/lib/upgrade-route";
import { getDefaultEffortScore, getPlanDayEffortGuidance, getWorkoutPurpose } from "@/lib/workout-effort";
import { buildLongRangePlan, buildMonthGrid, getWorkoutFeedback, type CalendarPlanDay } from "@/utils/training-insights";
import { formatFeedDate, formatMonthLabel, startOfWeek } from "@/utils/workout-utils";
import { ThemeTokens } from "@/constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EFFORT_OPTIONS = [3, 5, 7, 9];
const REFLECTION_FEEL_OPTIONS = [
  { value: "great", label: "Felt strong" },
  { value: "solid", label: "Felt solid" },
  { value: "flat", label: "Felt flat" },
  { value: "rough", label: "Felt rough" },
] as const;
const EXPECTATION_OPTIONS = [
  { value: "easier", label: "Easier than expected" },
  { value: "as_expected", label: "About as expected" },
  { value: "harder", label: "Harder than expected" },
] as const;

type SelectedEntry = {
  date: Date;
  dateKey: string;
  planDay: CalendarPlanDay | null;
};

export default function Plan() {
  const { profile, applyAutomaticPr } = useProfile();
  const { hasAccess } = usePremium();
  const { engine } = useEngine();
  const {
    workouts,
    likedWorkoutCategories,
    toggleLikedWorkout,
    isWorkoutLiked,
    completedWorkoutIds,
    skippedWorkoutIds,
    planDayNotes,
    completePlannedWorkout,
    skipPlannedWorkout,
    setPlanDayNote,
    addWorkout,
    planCycle,
    advancePlanWeek,
    plannedOverrides,
  } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const layout = useResponsiveLayout();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const start = startOfWeek(new Date());
    start.setDate(start.getDate() + planCycle * 7);
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry | null>(null);
  const [mode, setMode] = useState<"details" | "complete" | "manual" | "skip" | "notes">("details");
  const [completeEffort, setCompleteEffort] = useState(5);
  const [completeNotes, setCompleteNotes] = useState("");
  const [manualType, setManualType] = useState("");
  const [manualDistance, setManualDistance] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualEffort, setManualEffort] = useState(5);
  const [manualNotes, setManualNotes] = useState("");
  const [skipNotes, setSkipNotes] = useState("");
  const [reflectionFeel, setReflectionFeel] = useState<"great" | "solid" | "flat" | "rough" | null>(null);
  const [expectation, setExpectation] = useState<"easier" | "as_expected" | "harder" | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<{ title: string; detail: string } | null>(null);
  const [savedPostRunFeedback, setSavedPostRunFeedback] = useState<PostRunFeedback | null>(null);
  const mileage = parseFloat(profile.mileage) || 30;
  const conditionTrainingUnlocked = hasAccess("condition_training");

  const adaptiveWeek = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        profile.mileage || "30",
        profile.pr5k || "",
        likedWorkoutCategories,
        planCycle,
        {
          runnerLevel: profile.runnerLevel,
          preferredTrainingDays: profile.preferredTrainingDays,
        },
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
      profile.mileage,
      profile.pr5k,
      profile.runnerLevel,
      profile.preferredTrainingDays,
      workouts,
    ]
  );

  const planDays = useMemo(
    () =>
      buildLongRangePlan({
        profile,
        workouts,
        likedWorkoutCategories,
        completedWorkoutIds,
        skippedWorkoutIds,
        planDayNotes,
        planCycle,
        plannedOverrides,
        weeksToBuild: 14,
      }),
    [completedWorkoutIds, likedWorkoutCategories, planCycle, planDayNotes, plannedOverrides, profile, skippedWorkoutIds, workouts]
  );

  const monthEntries = useMemo(() => buildMonthGrid(planDays, visibleMonth), [planDays, visibleMonth]);
  const weekStart = useMemo(() => {
    const start = startOfWeek(new Date());
    start.setDate(start.getDate() + planCycle * 7);
    return start;
  }, [planCycle]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);
  const currentWeekPlan = planDays.filter((day) => day.date >= weekStart && day.date < weekEnd);
  const completedThisWeek = currentWeekPlan.filter((day) => day.completed).length;
  const skippedThisWeek = currentWeekPlan.filter((day) => day.skipped).length;
  const plannedMilesThisWeek = currentWeekPlan.reduce((total, day) => total + day.distance, 0);
  const focusDay =
    currentWeekPlan.find((day) => day.isToday) ??
    currentWeekPlan.find((day) => !day.completed && !day.skipped) ??
    currentWeekPlan[0] ??
    null;
  const nextQualityDay =
    currentWeekPlan.find((day) => !day.completed && !day.skipped && ["tempo", "interval", "long"].includes(day.category)) ??
    focusDay;
  const weekCompletionPercent = Math.round((completedThisWeek / Math.max(currentWeekPlan.length, 1)) * 100);
  const currentWeekSubtitle = focusDay
    ? `${focusDay.day}: ${focusDay.title}`
    : "Open the week timeline when you're ready to manage daily details.";
  const calendarCellWidth = layout.isPhone ? "12.8%" : layout.isTablet ? "13.1%" : "13.3%";
  const recovery = getUnifiedRecoveryState(engine, workouts);
  const selectedPlanDay = selectedEntry?.planDay ?? null;
  const selectedGuidance = selectedPlanDay ? getPlanDayEffortGuidance(selectedPlanDay) : null;
  const selectedAdjustment = selectedPlanDay ? getWorkoutAdjustment(selectedPlanDay, recovery) : null;
  const selectedStructure = selectedPlanDay ? getWorkoutStructure(selectedPlanDay, recovery) : null;
  const selectedFueling = selectedPlanDay ? getFuelingStrategyForWorkout(selectedPlanDay) : null;
  const selectedRecoveryFueling = selectedPlanDay ? getRecoveryFuelingConnection(selectedPlanDay, recovery) : null;

  const openEntry = (entry: SelectedEntry) => {
    setSelectedEntry(entry);
    setMode("details");
    setCompleteEffort(defaultEffort(entry.planDay));
    setCompleteNotes(entry.planDay?.dayNote || planDayNotes[entry.dateKey] || "");
    setManualType(entry.planDay?.logType || "");
    setManualDistance(entry.planDay ? String(entry.planDay.distance) : "");
    setManualTime("");
    setManualEffort(defaultEffort(entry.planDay));
    setManualNotes(entry.planDay?.dayNote || "");
    setSkipNotes(entry.planDay?.dayNote || "");
    setReflectionFeel(null);
    setExpectation(null);
  };

  const closeModal = () => setSelectedEntry(null);

  const finishSave = (title: string, detail: string) => {
    setSavedFeedback({ title, detail });
    closeModal();
  };

  const handleComplete = () => {
    if (!selectedEntry?.planDay) return;
    const completedWorkout = {
      id: `completed-${selectedEntry.planDay.id}`,
      type: selectedEntry.planDay.logType,
      distance: String(selectedEntry.planDay.distance),
      time: "Completed",
      splits: "",
      effort: completeEffort,
      notes: completeNotes || `Completed from weekly plan: ${selectedEntry.planDay.title}`,
      date: selectedEntry.date.toISOString(),
      shoeId: null,
    };
    animateNextLayout();
    completePlannedWorkout(selectedEntry.planDay, {
      effort: completeEffort,
      notes: completeNotes,
      dateOverride: selectedEntry.date.toISOString(),
      reflectionFeel: reflectionFeel ?? undefined,
      expectation: expectation ?? undefined,
    });
    setPlanDayNote(selectedEntry.dateKey, completeNotes);
    if (selectedEntry.planDay.day === "Sunday" && selectedEntry.date >= weekStart && selectedEntry.date < weekEnd) {
      advancePlanWeek();
    }
    setSavedPostRunFeedback(
      generatePostRunFeedback({
        workout: completedWorkout,
        previousWorkouts: workouts.slice(0, 5),
      })
    );
    finishSave(
      ...Object.values(
        getWorkoutFeedback({
          workoutType: selectedEntry.planDay.logType,
          effort: completeEffort,
          distance: String(selectedEntry.planDay.distance),
        })
      ) as [string, string]
    );
  };

  const handleManualLog = () => {
    if (!selectedEntry) return;
    const manualWorkout = {
      id: `manual-${selectedEntry.dateKey}`,
      type: manualType.trim() || selectedEntry.planDay?.logType || "Manual Workout",
      distance: manualDistance,
      time: manualTime,
      splits: "",
      effort: manualEffort,
      notes: manualNotes,
      date: selectedEntry.date.toISOString(),
      shoeId: null,
    };
    animateNextLayout();
    addWorkout({
      type: manualWorkout.type,
      distance: manualWorkout.distance,
      time: manualWorkout.time,
      splits: "",
      effort: manualWorkout.effort,
      notes: manualWorkout.notes,
      date: manualWorkout.date,
      reflectionFeel: reflectionFeel ?? undefined,
      expectation: expectation ?? undefined,
    });
    applyAutomaticPr({ distance: manualDistance, time: manualTime });
    if (selectedEntry.planDay) {
      completePlannedWorkout(selectedEntry.planDay, {
        effort: manualEffort,
        notes: manualNotes || `Logged a different workout on ${selectedEntry.planDay.title.toLowerCase()} day.`,
        dateOverride: selectedEntry.date.toISOString(),
        skipWorkoutSave: true,
      });
    }
    setPlanDayNote(selectedEntry.dateKey, manualNotes);
    setSavedPostRunFeedback(
      generatePostRunFeedback({
        workout: manualWorkout,
        previousWorkouts: workouts.slice(0, 5),
      })
    );
    finishSave(
      ...Object.values(
        getWorkoutFeedback({
          workoutType: manualType,
          effort: manualEffort,
          distance: manualDistance,
        })
      ) as [string, string]
    );
  };

  const handleSkip = () => {
    if (!selectedEntry?.planDay) return;
    animateNextLayout();
    skipPlannedWorkout(selectedEntry.planDay, skipNotes);
    setPlanDayNote(selectedEntry.dateKey, skipNotes);
    setSavedPostRunFeedback(null);
    finishSave("Day skipped.", "You can keep tomorrow lighter if today needed to come out of the plan.");
  };

  const handleSaveNotes = () => {
    if (!selectedEntry) return;
    setPlanDayNote(selectedEntry.dateKey, completeNotes);
    setSavedPostRunFeedback(null);
    finishSave("Note saved.", "Your note is attached to this training day.");
  };

  return (
    <AnimatedTabScene tabKey="explore">
      <ScreenScroll colors={colors}>
        <TrackLinesBackdrop variant="track" style={{ top: 92, height: 780 }} />
        <TopProfileBar imageUri={profile.image} name={profile.name} onAvatarPress={openDrawer} />
        <PageHeader
          eyebrow="Plan"
          title={profile.goalEvent || "Build Your Block"}
          subtitle="See the shape of the week, the key workout that matters most, and exactly where your schedule is heading next."
        />

        <FadeInView delay={40}>
          <View
            style={[
              getSurfaceCardStyle(colors, { tone: "accent", padding: ThemeTokens.spacing.ml }),
              { gap: ThemeTokens.spacing.m, overflow: "hidden" },
            ]}
          >
            <View
              style={{
                position: "absolute",
                top: -34,
                right: -24,
                width: 200,
                height: 200,
                borderRadius: 999,
                backgroundColor: "rgba(37, 99, 235, 0.16)",
              }}
            />
            <View style={{ gap: ThemeTokens.spacing.s }}>
              <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>
                WEEKLY ANCHOR
              </Text>
              <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h1.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h1.lineHeight }}>
                {focusDay?.isToday ? `Today centers on ${focusDay.title}` : focusDay?.title || "Your training week is ready to review"}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, lineHeight: 21 }}>
                {focusDay
                  ? `${focusDay.day} is the workout to trust first. Keep the rest of the week in view, but let this session set the tone.`
                  : "The calendar gives you the long view, but the current week is the part that should feel easiest to trust and follow."}
              </Text>
            </View>
            <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10 }}>
              <PlanHighlightPill
                label="Week focus"
                value={nextQualityDay ? `${nextQualityDay.day} · ${nextQualityDay.title}` : "Steady aerobic rhythm"}
              />
              <PlanHighlightPill
                label="Progress"
                value={`${completedThisWeek}/${currentWeekPlan.length || 0} days done`}
              />
              <PlanHighlightPill
                label="Planned volume"
                value={`${plannedMilesThisWeek.toFixed(1)} mi`}
              />
            </View>
            <AnimatedProgressBar
              progress={Math.min((completedThisWeek / Math.max(currentWeekPlan.length, 1)) * 100, 100)}
              fillColor="#2563eb"
              trackColor="rgba(255,255,255,0.08)"
              height={10}
            />
            <View
              style={{
                flexDirection: layout.isPhone ? "column" : "row",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
                {weekCompletionPercent}% of this week completed
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
                {skippedThisWeek > 0 ? `${skippedThisWeek} skipped day${skippedThisWeek > 1 ? "s" : ""}` : "No skipped days yet"}
              </Text>
            </View>
          </View>
        </FadeInView>

        {savedFeedback ? (
          <FadeInView delay={30} distance={14}>
            <InfoCard>
              <SuccessBadge label={savedFeedback.title} detail="Your training day was updated and the week has been refreshed." />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{savedFeedback.title}</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{savedFeedback.detail}</Text>
            </InfoCard>
          </FadeInView>
        ) : null}

        {savedFeedback ? (
          <FadeInView delay={70} distance={16}>
            <PostRunFeedbackCard feedback={savedPostRunFeedback} />
          </FadeInView>
        ) : null}

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StatCard label="Target Volume" value={`${mileage} mi`} helper={`${plannedMilesThisWeek.toFixed(1)} mi planned this week`} />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard label="Weeks Ahead" value="14" helper="Calendar horizon" />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard label="Current Week" value={`${completedThisWeek}/${currentWeekPlan.length || 0}`} helper="Completed days" />
          </View>
        </View>

        <InfoCard>
          <ExpandablePanel
            title="Future weeks and calendar"
            subtitle="Keep the current week visible first, then open the wider calendar only when you need it."
            headerRight={<SecondaryButton label="Full Calendar" onPress={() => router.push("/calendar")} />}
          >
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <Legend colors={colors} label="Today" background={colors.primarySoft} border={colors.primary} />
              <Legend colors={colors} label="Completed" background={colors.primary} border={colors.primary} textColor={colors.background} />
              <Legend colors={colors} label="Skipped" background={colors.card} border={colors.danger} />
              <Legend colors={colors} label="Planned" background={colors.cardAlt} border={colors.border} />
            </View>

            <View
              style={{
                marginTop: 20,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <MonthButton colors={colors} label="Prev" onPress={() => setVisibleMonth((current) => addMonths(current, -1))} />
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>{formatMonthLabel(visibleMonth)}</Text>
              <MonthButton colors={colors} label="Next" onPress={() => setVisibleMonth((current) => addMonths(current, 1))} />
            </View>

            <View style={{ flexDirection: "row", marginTop: 18 }}>
              {WEEKDAY_LABELS.map((label) => (
                <View key={label} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {monthEntries.map((entry) => (
              <Pressable
                key={entry.dateKey}
                onPress={() => openEntry({ date: entry.date, dateKey: entry.dateKey, planDay: entry.planDay })}
                style={({ pressed }) => ({
                  width: calendarCellWidth,
                  minHeight: layout.isPhone ? 82 : 96,
                  borderRadius: 18,
                  padding: 10,
                  backgroundColor: cellBackground(entry.planDay, colors),
                  borderWidth: entry.planDay?.isToday ? 2 : 1,
                  borderColor: cellBorder(entry.planDay, colors),
                  opacity: pressed ? 0.9 : entry.isCurrentMonth ? 1 : 0.45,
                  transform: [{ scale: pressed ? 0.985 : 1 }, { translateY: pressed ? 1 : 0 }],
                  shadowColor: entry.planDay?.isToday ? colors.primary : "#020817",
                  shadowOpacity: entry.planDay?.isToday ? 0.18 : 0.08,
                  shadowRadius: entry.planDay?.isToday ? 10 : 6,
                  shadowOffset: { width: 0, height: 4 },
                })}
              >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{entry.date.getDate()}</Text>
                    {entry.planDay?.isToday ? (
                      <View
                        style={{
                          borderRadius: 999,
                          backgroundColor: colors.primary,
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ color: colors.background, fontSize: 9, fontWeight: "800" }}>TODAY</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700", marginTop: 10 }} numberOfLines={2}>
                    {entry.planDay?.title || "Open day"}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 10, marginTop: 6 }}>
                    {entry.planDay?.completed ? "Done" : entry.planDay?.skipped ? "Skipped" : entry.planDay ? "Planned" : "Tap"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ExpandablePanel>
        </InfoCard>

        {adaptiveWeek.feedback.length > 0 ? (
          <InfoCard>
            <ExpandablePanel
              title="Adaptive feedback"
              subtitle="Open the recent training notes only when you want extra context."
            >
              <View style={{ gap: 10 }}>
                {adaptiveWeek.feedback.map((message) => (
                  <View
                    key={message}
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.82)",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "rgba(103, 232, 249, 0.12)",
                      padding: 15,
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>ADAPTIVE NOTE</Text>
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{message}</Text>
                  </View>
                ))}
              </View>
            </ExpandablePanel>
          </InfoCard>
        ) : null}

        <InfoCard>
          <ExpandablePanel
            title="Current week"
            subtitle={currentWeekSubtitle}
            headerRight={<Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{currentWeekPlan.length} days</Text>}
          >
            <View style={{ gap: ThemeTokens.spacing.s }}>
              <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>
                FOLLOW THE WEEK WITH LESS GUESSWORK
              </Text>
              <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, lineHeight: 21 }}>
                Tap any day to complete it, log a different workout, skip it, or save notes without losing the structure of the week.
              </Text>
            </View>

            <View
              style={[
                getSurfaceCardStyle(colors, { tone: "contrast", padding: ThemeTokens.spacing.m }),
                { overflow: "hidden", gap: 0, marginTop: ThemeTokens.spacing.m },
              ]}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 18,
                  right: 18,
                  height: 2,
                  borderRadius: 999,
                  backgroundColor: "rgba(103, 232, 249, 0.38)",
                }}
              />
              {currentWeekPlan.map((day, index) => (
                <Pressable
                  key={day.id}
                  onPress={() => openEntry({ date: day.date, dateKey: day.dateKey, planDay: day })}
                  style={({ pressed }) => ({
                    paddingVertical: 18,
                    paddingHorizontal: 2,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.96 : 1,
                    transform: [{ translateY: pressed ? 1 : 0 }],
                    backgroundColor: pressed ? "rgba(255,255,255,0.02)" : "transparent",
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
                    <View
                      style={{
                        width: 74,
                        alignItems: "flex-start",
                        paddingTop: 2,
                      }}
                    >
                      <Text style={{ color: day.isToday ? colors.primary : colors.subtext, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
                        {day.isToday ? "TODAY" : day.day.toUpperCase()}
                      </Text>
                      <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }}>
                        {formatFeedDate(day.date.toISOString())}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 10,
                        alignItems: "center",
                        paddingTop: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: day.completed ? colors.primary : day.skipped ? colors.danger : day.isToday ? colors.primary : colors.border,
                        }}
                      />
                      {index < currentWeekPlan.length - 1 ? (
                        <View
                          style={{
                            width: 2,
                            flex: 1,
                            marginTop: 6,
                            backgroundColor: colors.border,
                            minHeight: 52,
                          }}
                        />
                      ) : null}
                    </View>

                    <View style={{ flex: 1, gap: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 6 }}>
                            {day.category.toUpperCase()} SESSION
                          </Text>
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: day.isToday ? 24 : 20,
                              fontWeight: "800",
                              lineHeight: day.isToday ? 30 : 26,
                            }}
                          >
                            {day.title}
                          </Text>
                          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
                            {day.details}
                          </Text>
                        </View>

                        <View
                          style={{
                            alignSelf: "flex-start",
                            backgroundColor: day.completed ? colors.primarySoft : day.isToday ? "rgba(37, 99, 235, 0.18)" : colors.cardAlt,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: day.completed ? colors.primary : day.skipped ? colors.danger : day.isToday ? colors.primary : colors.border,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: "800" }}>
                            {day.completed ? "DONE" : day.skipped ? "SKIPPED" : `${day.distance} MI`}
                          </Text>
                        </View>
                      </View>

                      {day.dayNote ? (
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                          Note: {day.dayNote}
                        </Text>
                      ) : null}

                      <View
                        style={{
                          flexDirection: layout.isPhone ? "column" : "row",
                          justifyContent: "space-between",
                          alignItems: layout.isPhone ? "flex-start" : "center",
                          gap: 8,
                        }}
                      >
                        <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, flex: 1 }}>
                          {getPlanDayEffortGuidance(day).shortDescription}. Purpose: {getWorkoutPurpose(day)}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
                          {day.distance} mi planned
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                        <WorkoutEffortChip guidance={getPlanDayEffortGuidance(day)} compact={true} />
                        <InlineChip
                          colors={colors}
                          label={isWorkoutLiked(day.id) ? "Liked" : "Like"}
                          active={isWorkoutLiked(day.id)}
                          onPress={() => toggleLikedWorkout(day.id, day.category)}
                        />
                        <InlineOpenLink colors={colors} label="Open Day" />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </ExpandablePanel>
        </InfoCard>

        <FloatingModalCard visible={Boolean(selectedEntry)} onClose={closeModal}>
          <View
            style={[
              getSurfaceCardStyle(colors, { padding: 0, radius: ThemeTokens.radii.xl }),
              {
                alignSelf: "center",
                width: "100%",
                maxWidth: layout.isDesktop ? 860 : 760,
                maxHeight: layout.isDesktop ? "84%" : "90%",
                overflow: "hidden",
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: ThemeTokens.spacing.ml, gap: 18 }}
            >
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                  PLAN DAY
                </Text>
                <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36 }}>
                  {selectedPlanDay?.title || "Open training day"}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 22 }}>
                  {selectedEntry ? formatFeedDate(selectedEntry.date.toISOString()) : ""}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 20,
                  gap: 14,
                }}
              >
                <View style={{ gap: 10 }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                    {selectedPlanDay ? `${selectedPlanDay.distance} mi planned` : "No assigned workout yet"}
                  </Text>
                  {selectedGuidance ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      <WorkoutEffortChip guidance={selectedGuidance} />
                    </View>
                  ) : null}
                  {selectedGuidance ? (
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 21 }}>
                      {selectedGuidance.shortDescription}
                    </Text>
                  ) : null}
                  {selectedPlanDay ? (
                    <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                      {selectedPlanDay.details || "Use this day for whatever you actually ran, or save notes for later."}
                    </Text>
                  ) : null}
                </View>

                <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
                  <DetailMetricCard
                    label="Purpose"
                    value={selectedPlanDay ? getWorkoutPurpose(selectedPlanDay) : "Open the day"}
                  />
                  <DetailMetricCard
                    label="Adjustment"
                    value={selectedAdjustment?.title || "On plan"}
                  />
                  <DetailMetricCard
                    label="Pace / effort"
                    value={selectedAdjustment ? selectedAdjustment.paceAdjustment : selectedGuidance?.beginnerTip || "Effort-led"}
                  />
                </View>

                {selectedAdjustment ? (
                  <View
                    style={{
                      backgroundColor: "rgba(37, 99, 235, 0.12)",
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: "rgba(103, 232, 249, 0.18)",
                      padding: 14,
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
                      {selectedAdjustment.title.toUpperCase()}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 }}>
                      {selectedAdjustment.reason}
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      label={selectedPlanDay && !selectedPlanDay.completed && !selectedPlanDay.skipped ? "Complete workout" : "Log workout"}
                      onPress={() => setMode(selectedPlanDay && !selectedPlanDay.completed && !selectedPlanDay.skipped ? "complete" : "manual")}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton label="Close" onPress={closeModal} />
                  </View>
                </View>
              </View>

              <ExpandablePanel
                title="Workout structure"
                subtitle="Warm-up, main work, cooldown, and post-run work."
              >
                {selectedStructure ? (
                  <View style={{ gap: 12 }}>
                    <StructureGroup title="Warm-up" items={selectedStructure.warmup} />
                    <StructureGroup title="Main workout" items={selectedStructure.main} />
                    <StructureGroup title="Cooldown" items={selectedStructure.cooldown} />
                    <StructureGroup
                      title="Post-run"
                      items={selectedStructure.postRun}
                      accent={selectedAdjustment?.skipExtras ? "#fbbf24" : "#67e8f9"}
                    />
                  </View>
                ) : (
                  <PanelFallback colors={colors} body="Open a planned workout day to see the full structure here." />
                )}
              </ExpandablePanel>

              <ExpandablePanel
                title="Fueling for today"
                subtitle="Before, during, after, and recovery support."
              >
                {selectedFueling ? (
                  <View style={{ gap: 10 }}>
                    <PanelInfoLine label="Summary" value={selectedFueling.summary} accent="#67e8f9" />
                    <PanelInfoLine label="Before" value={selectedFueling.before} />
                    <PanelInfoLine label="During" value={selectedFueling.during} />
                    <PanelInfoLine label="After" value={selectedFueling.after} />
                    <PanelInfoLine label="Recovery support" value={selectedRecoveryFueling || "Recovery support appears here when a planned workout is loaded."} accent={colors.primary} />
                  </View>
                ) : (
                  <PanelFallback colors={colors} body="Fueling guidance will appear when this day has a planned workout attached." />
                )}
              </ExpandablePanel>

              <ExpandablePanel
                title="Condition training"
                subtitle="Adjust pace, effort, and hydration for real conditions."
              >
                {selectedPlanDay ? <ConditionTrainingCard workout={selectedPlanDay} /> : <PanelFallback colors={colors} body="Select a planned workout to use condition-based adjustments." />}
                {!conditionTrainingUnlocked && selectedPlanDay ? (
                  <View
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      gap: 6,
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>PRO INCLUDED</Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Heart rate and fueling guidance</Text>
                    <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                      Pro still unlocks heart rate targets, fueling suggestions, and recovery prompts for this workout day.
                    </Text>
                    <Pressable
                      onPress={() => router.push(buildUpgradePath({ plan: "pro" }))}
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 6,
                        borderRadius: 999,
                        backgroundColor: colors.primarySoft,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>Upgrade to Pro</Text>
                    </Pressable>
                  </View>
                ) : null}
              </ExpandablePanel>

              <ExpandablePanel
                title="Recovery notes"
                subtitle="What the day should feel like and how to adjust if readiness is off."
              >
                {selectedGuidance ? (
                  <View style={{ gap: 10 }}>
                    <PanelInfoLine label="How it should feel" value={selectedGuidance.shortDescription} accent="#67e8f9" />
                    <PanelInfoLine label="Beginner tip" value={selectedGuidance.beginnerTip} />
                    {selectedAdjustment ? (
                      <>
                        <PanelInfoLine label="Pace adjustment" value={selectedAdjustment.paceAdjustment} />
                        <PanelInfoLine label="Effort adjustment" value={selectedAdjustment.effortAdjustment} />
                      </>
                    ) : null}
                  </View>
                ) : (
                  <PanelFallback colors={colors} body="Recovery notes appear when a planned workout day is selected." />
                )}
              </ExpandablePanel>

              <ExpandablePanel
                title="Update this day"
                subtitle="Complete it, log something different, skip it, or save notes."
                defaultExpanded
              >
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {selectedPlanDay && !selectedPlanDay.completed && !selectedPlanDay.skipped ? (
                      <ActionChip colors={colors} label="Complete workout" active={mode === "complete"} onPress={() => setMode("complete")} />
                    ) : null}
                    <ActionChip colors={colors} label="Log different workout" active={mode === "manual"} onPress={() => setMode("manual")} />
                    {selectedPlanDay ? (
                      <ActionChip colors={colors} label="Skip day" active={mode === "skip"} onPress={() => setMode("skip")} />
                    ) : null}
                    <ActionChip colors={colors} label="Add notes" active={mode === "notes"} onPress={() => setMode("notes")} />
                  </View>

                  {mode === "complete" ? (
                    <View style={{ gap: 14 }}>
                      <EffortRow colors={colors} selected={completeEffort} onSelect={setCompleteEffort} />
                      <ReflectionRow
                        colors={colors}
                        title="How did it feel?"
                        selected={reflectionFeel}
                        options={REFLECTION_FEEL_OPTIONS}
                        onSelect={setReflectionFeel}
                      />
                      <ReflectionRow
                        colors={colors}
                        title="Compared with the plan"
                        selected={expectation}
                        options={EXPECTATION_OPTIONS}
                        onSelect={setExpectation}
                      />
                      <NoteBox colors={colors} value={completeNotes} onChangeText={setCompleteNotes} placeholder="Optional notes" />
                      <PrimaryButton label="Save Completed Workout" onPress={handleComplete} />
                    </View>
                  ) : null}

                  {mode === "manual" ? (
                    <View style={{ gap: 14 }}>
                      <Field colors={colors} value={manualType} onChangeText={setManualType} placeholder="Workout type" />
                      <Field colors={colors} value={manualDistance} onChangeText={setManualDistance} placeholder="Distance (miles)" keyboardType="numeric" />
                      <Field colors={colors} value={manualTime} onChangeText={setManualTime} placeholder="Time (e.g. 24:18)" />
                      <EffortRow colors={colors} selected={manualEffort} onSelect={setManualEffort} />
                      <ReflectionRow
                        colors={colors}
                        title="How did it feel?"
                        selected={reflectionFeel}
                        options={REFLECTION_FEEL_OPTIONS}
                        onSelect={setReflectionFeel}
                      />
                      <ReflectionRow
                        colors={colors}
                        title="Compared with the plan"
                        selected={expectation}
                        options={EXPECTATION_OPTIONS}
                        onSelect={setExpectation}
                      />
                      <NoteBox colors={colors} value={manualNotes} onChangeText={setManualNotes} placeholder="Notes" />
                      <PrimaryButton label="Save Logged Workout" onPress={handleManualLog} />
                    </View>
                  ) : null}

                  {mode === "skip" ? (
                    <View style={{ gap: 14 }}>
                      <NoteBox colors={colors} value={skipNotes} onChangeText={setSkipNotes} placeholder="Optional reason or note" />
                      <PrimaryButton label="Confirm Skip" onPress={handleSkip} />
                    </View>
                  ) : null}

                  {mode === "notes" ? (
                    <View style={{ gap: 14 }}>
                      <NoteBox colors={colors} value={completeNotes} onChangeText={setCompleteNotes} placeholder="Save a note for this day" />
                      <PrimaryButton label="Save Note" onPress={handleSaveNotes} />
                    </View>
                  ) : null}
                </View>
              </ExpandablePanel>
            </ScrollView>
          </View>
        </FloatingModalCard>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function EffortRow({
  colors,
  selected,
  onSelect,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
      {EFFORT_OPTIONS.map((value) => (
        <Pressable
          key={value}
          onPress={() => onSelect(value)}
          style={({ pressed }) => ({
            backgroundColor: selected === value ? colors.primarySoft : colors.cardAlt,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: selected === value ? colors.primary : colors.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>Effort {value}/10</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ReflectionRow<T extends string>({
  colors,
  title,
  selected,
  options,
  onSelect,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  title: string;
  selected: T | null;
  options: readonly { value: T; label: string }[];
  onSelect: (value: T) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{title}</Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
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

function Field({
  colors,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.subtext}
      keyboardType={keyboardType}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
      }}
    />
  );
}

function NoteBox({
  colors,
  value,
  onChangeText,
  placeholder,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.subtext}
      multiline
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 13,
        minHeight: 90,
        textAlignVertical: "top",
        fontSize: 15,
      }}
    />
  );
}

function DetailMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(8, 17, 29, 0.58)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 6,
      }}
    >
      <Text style={{ color: "#9fb5ce", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fbff", fontSize: 14, fontWeight: "700", lineHeight: 20 }}>
        {value}
      </Text>
    </View>
  );
}

function PanelInfoLine({
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
        backgroundColor: "rgba(8, 17, 29, 0.52)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#dcecff", fontSize: 14, lineHeight: 21 }}>
        {value}
      </Text>
    </View>
  );
}

function PanelFallback({
  colors,
  body,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  body: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
        {body}
      </Text>
    </View>
  );
}

function ActionChip({
  colors,
  label,
  active,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: active ? colors.primarySoft : colors.cardAlt,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function Legend({
  colors,
  label,
  background,
  border,
  textColor,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  background: string;
  border: string;
  textColor?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: background,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: textColor ?? colors.text, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function MonthButton({
  colors,
  label,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.cardAlt,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 9,
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function PlanHighlightPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: "rgba(226, 232, 240, 0.72)", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "700" }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function StructureGroup({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ gap: 8 }}>
        {items.map((item) => (
          <View key={`${title}-${item}`} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: accent || "#67e8f9",
                marginTop: 7,
              }}
            />
            <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19, flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function InlineChip({
  colors,
  label,
  active,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primarySoft : colors.cardAlt,
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function InlineOpenLink({
  colors,
  label,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 2,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

function cellBackground(day: CalendarPlanDay | null, colors: ReturnType<typeof useThemeColors>["colors"]) {
  if (!day) return colors.card;
  if (day.completed || day.isToday) return colors.primarySoft;
  if (day.skipped) return colors.card;
  return colors.cardAlt;
}

function cellBorder(day: CalendarPlanDay | null, colors: ReturnType<typeof useThemeColors>["colors"]) {
  if (!day) return colors.border;
  if (day.completed || day.isToday) return colors.primary;
  if (day.skipped) return colors.danger;
  return colors.border;
}

function defaultEffort(day: PlanDay | CalendarPlanDay | null) {
  return getDefaultEffortScore(day?.category);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
