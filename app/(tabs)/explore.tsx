import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { useQuickDrawer } from "../components/quick-drawer";
import { InfoCard, PageHeader, PrimaryButton, SecondaryButton, StatCard } from "../components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { buildLongRangePlan, buildMonthGrid, getWorkoutFeedback, type CalendarPlanDay } from "../training-insights";
import { buildAdaptiveWeeklyPlan, type PlanDay } from "../training-plan";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";
import { formatFeedDate, formatMonthLabel, startOfWeek } from "../workout-utils";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EFFORT_OPTIONS = [3, 5, 7, 9];

type SelectedEntry = {
  date: Date;
  dateKey: string;
  planDay: CalendarPlanDay | null;
};

export default function Plan() {
  const { profile, applyAutomaticPr } = useProfile();
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
  const [savedFeedback, setSavedFeedback] = useState<{ title: string; detail: string } | null>(null);
  const mileage = parseFloat(profile.mileage) || 30;

  const adaptiveWeek = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        profile.mileage || "30",
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
      ),
    [completedWorkoutIds, likedWorkoutCategories, planCycle, profile.goalEvent, profile.mileage, profile.pr5k, workouts]
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
  };

  const closeModal = () => setSelectedEntry(null);

  const finishSave = (title: string, detail: string) => {
    setSavedFeedback({ title, detail });
    closeModal();
  };

  const handleComplete = () => {
    if (!selectedEntry?.planDay) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    completePlannedWorkout(selectedEntry.planDay, {
      effort: completeEffort,
      notes: completeNotes,
      dateOverride: selectedEntry.date.toISOString(),
    });
    setPlanDayNote(selectedEntry.dateKey, completeNotes);
    if (selectedEntry.planDay.day === "Sunday" && selectedEntry.date >= weekStart && selectedEntry.date < weekEnd) {
      advancePlanWeek();
    }
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addWorkout({
      type: manualType.trim() || selectedEntry.planDay?.logType || "Manual Workout",
      distance: manualDistance,
      time: manualTime,
      splits: "",
      effort: manualEffort,
      notes: manualNotes,
      date: selectedEntry.date.toISOString(),
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    skipPlannedWorkout(selectedEntry.planDay, skipNotes);
    setPlanDayNote(selectedEntry.dateKey, skipNotes);
    finishSave("Day skipped.", "You can keep tomorrow lighter if today needed to come out of the plan.");
  };

  const handleSaveNotes = () => {
    if (!selectedEntry) return;
    setPlanDayNote(selectedEntry.dateKey, completeNotes);
    finishSave("Note saved.", "Your note is attached to this training day.");
  };

  return (
    <AnimatedTabScene tabKey="explore">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={profile.name} onAvatarPress={openDrawer} />
        <PageHeader
          eyebrow="Plan"
          title={profile.goalEvent || "Build Your Block"}
          subtitle={`Plan is now your central workout hub with logging, completion, notes, and skipping built into the calendar.`}
        />

        {savedFeedback ? (
          <InfoCard>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{savedFeedback.title}</Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{savedFeedback.detail}</Text>
          </InfoCard>
        ) : null}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StatCard label="Target Volume" value={`${mileage} mi`} helper="Weekly goal" />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard label="Weeks Ahead" value="14" helper="Calendar horizon" />
          </View>
        </View>

        <InfoCard>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SectionTitle colors={colors} title="Training Calendar" subtitle="Every day is clickable and can be logged from here." />
            </View>
            <SecondaryButton label="Full Calendar" onPress={() => router.push("/calendar")} />
          </View>

          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Legend colors={colors} label="Today" background={colors.primarySoft} border={colors.primary} />
            <Legend colors={colors} label="Completed" background={colors.primary} border={colors.primary} textColor={colors.background} />
            <Legend colors={colors} label="Skipped" background={colors.card} border={colors.danger} />
            <Legend colors={colors} label="Planned" background={colors.cardAlt} border={colors.border} />
          </View>

          <View style={{ marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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
                style={{
                  width: "13.2%",
                  minHeight: 92,
                  borderRadius: 18,
                  padding: 10,
                  backgroundColor: cellBackground(entry.planDay, colors),
                  borderWidth: 1,
                  borderColor: cellBorder(entry.planDay, colors),
                  opacity: entry.isCurrentMonth ? 1 : 0.45,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{entry.date.getDate()}</Text>
                <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700", marginTop: 10 }} numberOfLines={2}>
                  {entry.planDay?.title || "Open day"}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 10, marginTop: 6 }}>
                  {entry.planDay?.completed ? "Done" : entry.planDay?.skipped ? "Skipped" : entry.planDay ? "Planned" : "Tap"}
                </Text>
              </Pressable>
            ))}
          </View>
        </InfoCard>

        {adaptiveWeek.feedback.length > 0 ? (
          <InfoCard>
            <SectionTitle colors={colors} title="Adaptive Feedback" subtitle="Simple rule-based plan adjustments from your recent training." />
            <View style={{ marginTop: 14, gap: 10 }}>
              {adaptiveWeek.feedback.map((message) => (
                <View key={message} style={{ backgroundColor: colors.cardAlt, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{message}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        ) : null}

        <SectionTitle colors={colors} title="Current Week" subtitle="Tap any day to complete, log differently, skip, or add notes." />

        {currentWeekPlan.map((day, index) => (
          <InfoCard key={day.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>DAY {index + 1} • {formatFeedDate(day.date.toISOString())}</Text>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 8 }}>{day.title}</Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{day.details}</Text>
                {day.dayNote ? <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 10 }}>Note: {day.dayNote}</Text> : null}
              </View>
              <View style={{ alignItems: "flex-end", gap: 10 }}>
                <Pressable onPress={() => toggleLikedWorkout(day.id, day.category)} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: isWorkoutLiked(day.id) ? colors.primary : colors.border, backgroundColor: isWorkoutLiked(day.id) ? colors.primarySoft : colors.cardAlt }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{isWorkoutLiked(day.id) ? "Liked" : "Like"}</Text>
                </Pressable>
                <Pressable onPress={() => openEntry({ date: day.date, dateKey: day.dateKey, planDay: day })} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.primary }}>
                  <Text style={{ color: colors.background, fontSize: 12, fontWeight: "700" }}>Open Day</Text>
                </Pressable>
              </View>
            </View>
          </InfoCard>
        ))}

        <Modal visible={Boolean(selectedEntry)} transparent animationType="fade" onRequestClose={closeModal}>
          <View style={{ flex: 1, backgroundColor: "rgba(3, 8, 18, 0.72)", justifyContent: "center", padding: 20 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>PLAN DAY</Text>
              <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>{selectedEntry ? formatFeedDate(selectedEntry.date.toISOString()) : ""}</Text>
              <View style={{ backgroundColor: colors.cardAlt, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{selectedEntry?.planDay?.title || "Open training day"}</Text>
                <Text style={{ color: colors.subtext, fontSize: 14 }}>{selectedEntry?.planDay ? `${selectedEntry.planDay.distance} mi planned` : "No assigned workout yet. You can still log one."}</Text>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{selectedEntry?.planDay?.details || "Use this day for whatever you actually ran, or save notes for later."}</Text>
              </View>
              {selectedEntry?.planDay ? (
                <View style={{ backgroundColor: colors.cardAlt, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>PREMIUM LOCKED</Text>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 8 }}>HR and fueling guidance</Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                    Unlock heart rate targets, fueling suggestions, and recovery prompts for this workout day.
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {selectedEntry?.planDay && !selectedEntry.planDay.completed && !selectedEntry.planDay.skipped ? <ActionChip colors={colors} label="Complete workout" active={mode === "complete"} onPress={() => setMode("complete")} /> : null}
                <ActionChip colors={colors} label="Log different workout" active={mode === "manual"} onPress={() => setMode("manual")} />
                {selectedEntry?.planDay ? <ActionChip colors={colors} label="Skip day" active={mode === "skip"} onPress={() => setMode("skip")} /> : null}
                <ActionChip colors={colors} label="Add notes" active={mode === "notes"} onPress={() => setMode("notes")} />
              </View>

              {mode === "complete" ? (
                <>
                  <EffortRow colors={colors} selected={completeEffort} onSelect={setCompleteEffort} />
                  <NoteBox colors={colors} value={completeNotes} onChangeText={setCompleteNotes} placeholder="Optional notes" />
                  <PrimaryButton label="Save Completed Workout" onPress={handleComplete} />
                </>
              ) : null}

              {mode === "manual" ? (
                <>
                  <Field colors={colors} value={manualType} onChangeText={setManualType} placeholder="Workout type" />
                  <Field colors={colors} value={manualDistance} onChangeText={setManualDistance} placeholder="Distance (miles)" keyboardType="numeric" />
                  <Field colors={colors} value={manualTime} onChangeText={setManualTime} placeholder="Time (e.g. 24:18)" />
                  <EffortRow colors={colors} selected={manualEffort} onSelect={setManualEffort} />
                  <NoteBox colors={colors} value={manualNotes} onChangeText={setManualNotes} placeholder="Notes" />
                  <PrimaryButton label="Save Logged Workout" onPress={handleManualLog} />
                </>
              ) : null}

              {mode === "skip" ? (
                <>
                  <NoteBox colors={colors} value={skipNotes} onChangeText={setSkipNotes} placeholder="Optional reason or note" />
                  <PrimaryButton label="Confirm Skip" onPress={handleSkip} />
                </>
              ) : null}

              {mode === "notes" ? (
                <>
                  <NoteBox colors={colors} value={completeNotes} onChangeText={setCompleteNotes} placeholder="Save a note for this day" />
                  <PrimaryButton label="Save Note" onPress={handleSaveNotes} />
                </>
              ) : null}

              <SecondaryButton label="Close" onPress={closeModal} />
            </View>
          </View>
        </Modal>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function EffortRow({ colors, selected, onSelect }: { colors: ReturnType<typeof useThemeColors>["colors"]; selected: number; onSelect: (value: number) => void; }) {
  return <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>{EFFORT_OPTIONS.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={{ backgroundColor: selected === value ? colors.primarySoft : colors.cardAlt, borderRadius: 16, borderWidth: 1, borderColor: selected === value ? colors.primary : colors.border, paddingHorizontal: 12, paddingVertical: 10 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>Effort {value}/10</Text></Pressable>)}</View>;
}

function Field({ colors, value, onChangeText, placeholder, keyboardType }: { colors: ReturnType<typeof useThemeColors>["colors"]; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "numeric"; }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.subtext} keyboardType={keyboardType} style={{ backgroundColor: colors.background, color: colors.text, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 }} />;
}

function NoteBox({ colors, value, onChangeText, placeholder }: { colors: ReturnType<typeof useThemeColors>["colors"]; value: string; onChangeText: (value: string) => void; placeholder: string; }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.subtext} multiline style={{ backgroundColor: colors.background, color: colors.text, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13, minHeight: 90, textAlignVertical: "top", fontSize: 15 }} />;
}

function ActionChip({ colors, label, active, onPress }: { colors: ReturnType<typeof useThemeColors>["colors"]; label: string; active: boolean; onPress: () => void; }) {
  return <Pressable onPress={onPress} style={{ backgroundColor: active ? colors.primarySoft : colors.cardAlt, borderRadius: 999, borderWidth: 1, borderColor: active ? colors.primary : colors.border, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{label}</Text></Pressable>;
}

function Legend({ colors, label, background, border, textColor }: { colors: ReturnType<typeof useThemeColors>["colors"]; label: string; background: string; border: string; textColor?: string; }) {
  return <View style={{ backgroundColor: background, borderRadius: 999, borderWidth: 1, borderColor: border, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: textColor ?? colors.text, fontSize: 12, fontWeight: "700" }}>{label}</Text></View>;
}

function MonthButton({ colors, label, onPress }: { colors: ReturnType<typeof useThemeColors>["colors"]; label: string; onPress: () => void; }) {
  return <Pressable onPress={onPress} style={{ backgroundColor: colors.cardAlt, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{label}</Text></Pressable>;
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
  switch (day?.category) {
    case "intervals": return 8;
    case "threshold": return 7;
    case "steady":
    case "long": return 6;
    case "easy": return 4;
    case "recovery": return 3;
    default: return 5;
  }
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
