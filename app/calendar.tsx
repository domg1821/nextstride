import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { InfoCard, PageHeader, SecondaryButton } from "./components/ui-kit";
import { ScreenScroll, SectionTitle } from "./components/ui-shell";
import { useProfile } from "./profile-context";
import { buildAdaptiveWeeklyPlan, PlanDay } from "./training-plan";
import { useThemeColors } from "./theme-context";
import { useWorkouts } from "./workout-context";
import {
  formatFeedDate,
  formatMonthLabel,
  getDateForPlanDay,
  getDayKey,
  getPlanWeekStart,
} from "./workout-utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarEntry = {
  dateKey: string;
  date: Date;
  planned: PlanDay | null;
  workouts: ReturnType<typeof useWorkouts>["workouts"];
  isCurrentMonth: boolean;
};

export default function CalendarScreen() {
  const { profile } = useProfile();
  const {
    workouts,
    likedWorkoutCategories,
    planCycle,
    completedWorkoutIds,
  } = useWorkouts();
  const { colors } = useThemeColors();
  const mileage = parseFloat(profile.mileage) || 30;
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const start = getPlanWeekStart(new Date(), planCycle);
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  const weekPlan = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        mileage,
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
    [completedWorkoutIds, likedWorkoutCategories, mileage, planCycle, profile.goalEvent, profile.pr5k, workouts]
  );

  const plannedByDayKey = useMemo(() => {
    return weekPlan.reduce<Record<string, PlanDay>>((accumulator, day) => {
      const date = getDateForPlanDay(day.day, new Date(), planCycle);
      accumulator[getDayKey(date.toISOString())] = day;
      return accumulator;
    }, {});
  }, [planCycle, weekPlan]);

  const workoutsByDayKey = useMemo(() => {
    return workouts.reduce<Record<string, typeof workouts>>((accumulator, workout) => {
      const key = getDayKey(workout.date);
      accumulator[key] = accumulator[key] ? [...accumulator[key], workout] : [workout];
      return accumulator;
    }, {});
  }, [workouts]);

  const monthEntries = useMemo(
    () => buildMonthEntries(visibleMonth, plannedByDayKey, workoutsByDayKey),
    [plannedByDayKey, visibleMonth, workoutsByDayKey]
  );

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Calendar"
        title="Training at a glance"
        subtitle="See planned sessions, completed workouts, and rest days together so consistency is easier to read visually."
      />

      <InfoCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
              {formatMonthLabel(visibleMonth)}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, marginTop: 6 }}>
              Planned week plus logged workouts on a monthly grid
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <MonthButton colors={colors} label="Prev" onPress={() => setVisibleMonth((current) => addMonths(current, -1))} />
            <MonthButton colors={colors} label="Next" onPress={() => setVisibleMonth((current) => addMonths(current, 1))} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <LegendPill colors={colors} label="Completed" fill={colors.primary} border={colors.primary} textColor={colors.text} />
          <LegendPill colors={colors} label="Planned" fill={colors.cardAlt} border={colors.border} textColor={colors.text} />
          <LegendPill colors={colors} label="Rest" fill={colors.card} border={colors.success} textColor={colors.text} />
        </View>

        <View style={{ flexDirection: "row", marginTop: 20 }}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {monthEntries.map((entry) => (
            <Pressable
              key={entry.dateKey}
              onPress={() => setSelectedEntry(entry)}
              style={{
                width: "13.2%",
                minHeight: 84,
                borderRadius: 18,
                padding: 10,
                backgroundColor: getCellBackground(entry, colors),
                borderWidth: 1,
                borderColor: getCellBorder(entry, colors),
                opacity: entry.isCurrentMonth ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {entry.date.getDate()}
              </Text>

              <View style={{ marginTop: 10, gap: 6 }}>
                {entry.planned ? (
                  <StatusDot
                    color={entry.workouts.length > 0 ? colors.text : entry.planned.kind === "rest" ? colors.success : colors.subtext}
                    label={entry.workouts.length > 0 ? "Done" : entry.planned.kind === "rest" ? "Rest" : "Plan"}
                  />
                ) : null}
                {entry.workouts.length > 0 ? (
                  <StatusDot color={colors.primary} label={`${entry.workouts.length} run`} />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Current plan week"
          subtitle="The active seven-day training structure mapped onto real calendar dates."
        />

        <View style={{ marginTop: 14, gap: 12 }}>
          {weekPlan.map((day) => {
            const date = getDateForPlanDay(day.day, new Date(), planCycle);
            const completed = completedWorkoutIds.includes(day.id);

            return (
              <View
                key={day.id}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: completed ? colors.primary : colors.border,
                  padding: 14,
                }}
              >
                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
                  {formatFeedDate(date.toISOString())}
                </Text>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 6 }}>
                  {day.title}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, marginTop: 6 }}>
                  {day.kind === "rest" ? "Rest day" : `${day.distance} mi planned`} {completed ? "\u2022 Completed" : ""}
                </Text>
              </View>
            );
          })}
        </View>
      </InfoCard>

      <DayDetailModal
        colors={colors}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </ScreenScroll>
  );
}

function buildMonthEntries(
  visibleMonth: Date,
  plannedByDayKey: Record<string, PlanDay>,
  workoutsByDayKey: Record<string, ReturnType<typeof useWorkouts>["workouts"]>
) {
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const start = new Date(monthStart);
  const startOffset = (monthStart.getDay() + 6) % 7;
  start.setDate(monthStart.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = getDayKey(date.toISOString());

    return {
      dateKey,
      date,
      planned: plannedByDayKey[dateKey] ?? null,
      workouts: workoutsByDayKey[dateKey] ?? [],
      isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
    };
  });
}

function getCellBackground(
  entry: CalendarEntry,
  colors: ReturnType<typeof useThemeColors>["colors"]
) {
  if (entry.workouts.length > 0) {
    return colors.primarySoft;
  }

  if (entry.planned?.kind === "rest") {
    return colors.card;
  }

  if (entry.planned) {
    return colors.cardAlt;
  }

  return colors.card;
}

function getCellBorder(
  entry: CalendarEntry,
  colors: ReturnType<typeof useThemeColors>["colors"]
) {
  if (entry.workouts.length > 0) {
    return colors.primary;
  }

  if (entry.planned?.kind === "rest") {
    return colors.success;
  }

  return colors.border;
}

function LegendPill({
  label,
  fill,
  border,
  textColor,
  colors,
}: {
  label: string;
  fill: string;
  border: string;
  textColor: string;
  colors: ReturnType<typeof useThemeColors>["colors"];
}) {
  return (
    <View
      style={{
        backgroundColor: fill,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: textColor || colors.text, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
      <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{label}</Text>
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
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function DayDetailModal({
  colors,
  entry,
  onClose,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  entry: CalendarEntry | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={Boolean(entry)} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(3, 8, 18, 0.7)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>
            DAY DETAILS
          </Text>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 10 }}>
            {entry ? formatFeedDate(entry.date.toISOString()) : ""}
          </Text>

          {entry?.planned ? (
            <View
              style={{
                marginTop: 18,
                backgroundColor: colors.cardAlt,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>PLANNED</Text>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{entry.planned.title}</Text>
              <Text style={{ color: colors.subtext, fontSize: 14 }}>
                {entry.planned.kind === "rest" ? "Rest day" : `${entry.planned.distance} mi planned`}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
                {entry.planned.details}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 18, gap: 12 }}>
            {entry && entry.workouts.length > 0 ? (
              entry.workouts.map((workout) => (
                <View
                  key={workout.id}
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 14,
                    gap: 6,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>COMPLETED</Text>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{workout.type || "Workout"}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 14 }}>
                    {workout.distance} mi {"\u2022"} Effort {workout.effort.toFixed(1)}
                  </Text>
                  {workout.notes ? (
                    <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
                      {workout.notes}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                No completed workout logged for this date yet.
              </Text>
            )}
          </View>

          <View style={{ marginTop: 20 }}>
            <SecondaryButton label="Close" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
