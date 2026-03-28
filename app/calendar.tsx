import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { InfoCard, PageHeader, PrimaryButton, SecondaryButton } from "./components/ui-kit";
import { ScreenScroll, SectionTitle } from "./components/ui-shell";
import { useProfile } from "./profile-context";
import { buildLongRangePlan, buildMonthGrid, type CalendarPlanDay } from "./training-insights";
import { useThemeColors } from "./theme-context";
import { useWorkouts } from "./workout-context";
import { formatFeedDate, formatMonthLabel } from "./workout-utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarScreen() {
  const { profile } = useProfile();
  const { workouts, likedWorkoutCategories, completedWorkoutIds, skippedWorkoutIds, planDayNotes, planCycle, plannedOverrides, completePlannedWorkout } =
    useWorkouts();
  const { colors } = useThemeColors();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + planCycle * 7);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<CalendarPlanDay | null>(null);

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
        weeksToBuild: 18,
      }),
    [completedWorkoutIds, likedWorkoutCategories, planCycle, planDayNotes, plannedOverrides, profile, skippedWorkoutIds, workouts]
  );
  const monthEntries = useMemo(() => buildMonthGrid(planDays, visibleMonth), [planDays, visibleMonth]);

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Calendar"
        title="Training at a glance"
        subtitle="A wider view of planned sessions, completed workouts, and recovery days across future weeks."
      />

      <InfoCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, -1))}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>Prev</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
            {formatMonthLabel(visibleMonth)}
          </Text>
          <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, 1))}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>Next</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <Legend colors={colors} label="Completed" background={colors.primary} border={colors.primary} textColor={colors.background} />
          <Legend colors={colors} label="Today" background={colors.primarySoft} border={colors.primary} />
          <Legend colors={colors} label="Planned" background={colors.cardAlt} border={colors.border} />
          <Legend colors={colors} label="Rest" background={colors.card} border={colors.success} />
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
              onPress={() => entry.planDay && setSelectedDay(entry.planDay)}
              style={{
                width: "13.2%",
                minHeight: 92,
                borderRadius: 18,
                padding: 10,
                backgroundColor: getCellBackground(entry.planDay, colors),
                borderWidth: 1,
                borderColor: getCellBorder(entry.planDay, colors),
                opacity: entry.isCurrentMonth ? 1 : 0.45,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{entry.date.getDate()}</Text>
              {entry.planDay ? (
                <View style={{ marginTop: 10, gap: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }} numberOfLines={2}>
                    {entry.planDay.title}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 10 }}>
                    {entry.planDay.completed ? "Done" : entry.planDay.kind === "rest" ? "Rest" : `${entry.planDay.distance} mi`}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </InfoCard>

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Planning horizon"
          subtitle="NextStride currently generates about four months of structured training ahead with weekly variation."
        />
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 16 }}>
          Weekly structure stays familiar, but details and distances shift from week to week so future blocks do not feel copy-pasted.
        </Text>
      </InfoCard>

      <Modal visible={Boolean(selectedDay)} transparent animationType="fade" onRequestClose={() => setSelectedDay(null)}>
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
              gap: 14,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
              DAY DETAILS
            </Text>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>
              {selectedDay ? formatFeedDate(selectedDay.date.toISOString()) : ""}
            </Text>

            {selectedDay ? (
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
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{selectedDay.title}</Text>
                <Text style={{ color: colors.subtext, fontSize: 14 }}>
                  {selectedDay.kind === "rest" ? "Rest / recovery focus" : `${selectedDay.distance} mi planned`}
                </Text>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{selectedDay.details}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton label="Close" onPress={() => setSelectedDay(null)} />
              </View>
              {selectedDay && !selectedDay.completed && selectedDay.kind !== "rest" ? (
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Complete"
                    onPress={() => {
                      completePlannedWorkout(selectedDay, {
                        effort: 6,
                        dateOverride: selectedDay.date.toISOString(),
                      });
                      setSelectedDay(null);
                    }}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenScroll>
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

function getCellBackground(day: CalendarPlanDay | null, colors: ReturnType<typeof useThemeColors>["colors"]) {
  if (!day) {
    return colors.card;
  }

  if (day.completed || day.isToday) {
    return colors.primarySoft;
  }

  if (day.kind === "rest") {
    return colors.card;
  }

  return colors.cardAlt;
}

function getCellBorder(day: CalendarPlanDay | null, colors: ReturnType<typeof useThemeColors>["colors"]) {
  if (!day) {
    return colors.border;
  }

  if (day.completed || day.isToday) {
    return colors.primary;
  }

  if (day.kind === "rest") {
    return colors.success;
  }

  return colors.border;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
