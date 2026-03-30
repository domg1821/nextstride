import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getPredictionForEvent, normalizePredictorEvent } from "@/utils/race-predictor-engine";
import { summarizeRaceGoal } from "@/utils/training-insights";

export default function GoalsScreen() {
  const { profile, updateProfile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const [event, setEvent] = useState(profile.raceGoals[0]?.event || profile.goalEvent || "");
  const [goalTime, setGoalTime] = useState(profile.raceGoals[0]?.goalTime || "");
  const [raceDate, setRaceDate] = useState(profile.raceGoals[0]?.raceDate || "");

  const goalsWithStatus = useMemo(
    () =>
      profile.raceGoals.map((goal) => {
        const eventKey = normalizePredictorEvent(goal.event);
        const prediction = eventKey ? getPredictionForEvent(eventKey, workouts, profile) : null;

        return {
          goal,
          summary: summarizeRaceGoal(goal, workouts, prediction?.predictedSeconds ?? null),
        };
      }),
    [profile, workouts]
  );

  const saveGoal = () => {
    if (!event.trim() || !raceDate.trim()) {
      return;
    }

    const nextGoal = {
      id: `goal-${Date.now()}`,
      event: event.trim(),
      goalTime: goalTime.trim(),
      raceDate: raceDate.trim(),
    };
    const remainingGoals = profile.raceGoals.filter(
      (goal) => goal.raceDate !== raceDate.trim() || goal.event.toLowerCase() !== event.trim().toLowerCase()
    );

    updateProfile({
      goalEvent: event.trim(),
      raceGoals: [nextGoal, ...remainingGoals].slice(0, 4),
    });
  };

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Goals"
        title="Race goals that stay visible"
        subtitle="Set a target event, goal time, and race date so NextStride can show countdown, projected status, and progress."
      />

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Set a goal"
          subtitle="Keep it simple for now: one clear event, one goal time, and one race date."
        />

        <Field
          colors={colors}
          label="Race / Event"
          placeholder="5k, 10k, half marathon..."
          value={event}
          onChangeText={setEvent}
        />
        <Field
          colors={colors}
          label="Goal Time"
          placeholder="18:30"
          value={goalTime}
          onChangeText={setGoalTime}
        />
        <Field
          colors={colors}
          label="Race Date"
          placeholder="2026-05-17"
          value={raceDate}
          onChangeText={setRaceDate}
        />

        <View style={{ marginTop: 18 }}>
          <PrimaryButton label="Save Goal" onPress={saveGoal} />
        </View>
      </InfoCard>

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Tracked goals"
          subtitle="Your saved goals update with countdown and simple on-track guidance."
        />

        <View style={{ marginTop: 16, gap: 12 }}>
          {goalsWithStatus.length === 0 ? (
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              No goals saved yet. Add one above to unlock race countdown and progress feedback.
            </Text>
          ) : (
            goalsWithStatus.map(({ goal, summary }) => (
              <View
                key={goal.id}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor:
                    summary.status === "on-track"
                      ? colors.success
                      : summary.status === "needs-work"
                        ? colors.primary
                        : colors.border,
                  padding: 16,
                  gap: 8,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{goal.event}</Text>
                <Text style={{ color: colors.subtext, fontSize: 14 }}>
                  Goal: {goal.goalTime || "Time not set"} • {goal.raceDate}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                  {summary.countdownLabel}
                </Text>
                <Text style={{ color: colors.text, fontSize: 14 }}>{summary.progressLabel}</Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>{summary.detail}</Text>
              </View>
            ))
          )}
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}

function Field({
  colors,
  label,
  value,
  placeholder,
  onChangeText,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
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
    </View>
  );
}
