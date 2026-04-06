import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { WorkoutEffortChip } from "@/components/workout-effort-chip";
import type { PlanDay } from "@/lib/training-plan";
import {
  getTodayWorkout,
  getWorkoutGuidance,
  getWorkoutTypeLabel,
  getWorkoutWhyItMatters,
} from "@/lib/today-workout";
import type { HeartRateZone } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit";

export function TodayWorkoutCard({
  plan,
  completedWorkoutIds,
  heartRateZones,
}: {
  plan: PlanDay[];
  completedWorkoutIds: string[];
  heartRateZones: HeartRateZone[];
}) {
  const { colors } = useThemeColors();
  const today = getTodayWorkout(plan, completedWorkoutIds);
  const workout = today.workout;
  const guidance = getWorkoutGuidance(workout, heartRateZones);
  const typeLabel = getWorkoutTypeLabel(workout);
  const whyItMatters = getWorkoutWhyItMatters(workout);
  const accent = getWorkoutAccent(workout?.category);
  const buttonLabel =
    today.state === "completed"
      ? "View Details"
      : today.state === "none"
        ? "Open Plan"
        : today.state === "rest"
          ? "View Recovery"
          : "Start Workout";

  return (
    <View
      style={{
        backgroundColor: "#12243b",
        borderRadius: 34,
        borderWidth: 1,
        borderColor: `${accent}44`,
        padding: 24,
        gap: 20,
        shadowColor: accent,
        shadowOpacity: today.state === "completed" ? 0.1 : 0.18,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
        opacity: today.state === "completed" ? 0.84 : 1,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>TODAY'S WORKOUT</Text>
          <Text style={{ color: "#f8fbff", fontSize: 30, fontWeight: "800", lineHeight: 36, marginTop: 12 }}>
            {typeLabel}
          </Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 10 }}>
            {workout?.title || "No workout scheduled for today"}
          </Text>
          <Text style={{ color: "#b8cae0", fontSize: 15, lineHeight: 23, marginTop: 12 }}>
            {workout?.details || "Take the day as it comes, or open your plan to look ahead at the rest of the week."}
          </Text>
        </View>

        <View
          style={{
            minWidth: 118,
            backgroundColor: "rgba(8, 17, 29, 0.66)",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: `${accent}33`,
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 6,
          }}
        >
          <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "700", textAlign: "center" }}>EFFORT</Text>
          <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800", textAlign: "center" }}>{guidance.effortRange}</Text>
          <Text style={{ color: accent, fontSize: 12, fontWeight: "700", textAlign: "center" }}>{guidance.effortLabel}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <WorkoutTag label={workout?.category?.toUpperCase() || "OPEN"} accent={accent} />
        <WorkoutEffortChip guidance={guidance.effortGuidance} />
        <WorkoutTag label={`Pace: ${guidance.paceGuidance}`} subtle={true} />
        {guidance.heartRateGuidance ? <WorkoutTag label={guidance.heartRateGuidance} /> : null}
      </View>

      <View
        style={{
          backgroundColor: "rgba(8, 17, 29, 0.62)",
          borderRadius: 26,
          borderWidth: 1,
          borderColor: today.state === "completed" ? "rgba(103, 232, 249, 0.28)" : `${accent}2d`,
          padding: 18,
          gap: 14,
        }}
      >
        <InfoLine label="Why it matters" body={whyItMatters} accent={accent} />
        <InfoLine label="How it should feel" body={guidance.shortDescription} />
        <InfoLine label="Beginner tip" body={guidance.beginnerTip} />

        {today.state === "completed" ? (
          <InfoLine
            label="Completed"
            body="Today's session is already logged. Nice work. The rest of the week can stay calm and focused."
          />
        ) : today.state === "rest" ? (
          <InfoLine
            label="Today's focus"
            body="Use the lighter day well. Recovery days are part of the training, not a break from it."
          />
        ) : today.state === "none" ? (
          <InfoLine
            label="Today's focus"
            body="No workout is scheduled for today. Open your plan to review the week or log a run if you trained anyway."
          />
        ) : (
          <InfoLine
            label="Today's focus"
            body="Keep the session simple: follow the purpose, stay controlled early, and let the workout do its job."
          />
        )}

        {today.state === "completed" && today.nextWorkout ? (
          <InfoLine
            label="Next up"
            body={`Next: ${getWorkoutTypeLabel(today.nextWorkout)} ${today.nextWorkout.day.toLowerCase()}.`}
            accent="#67e8f9"
          />
        ) : null}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label={buttonLabel} onPress={() => router.push("/(solo)/explore")} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label={today.state === "completed" ? "View Week" : "View Details"}
              onPress={() => router.push(today.state === "completed" ? "/(solo)/progress" : "/(solo)/explore")}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function WorkoutTag({
  label,
  accent,
  subtle,
}: {
  label: string;
  accent?: string;
  subtle?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: subtle ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.06)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: subtle ? "rgba(255,255,255,0.06)" : "transparent",
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: "100%",
      }}
    >
      <Text style={{ color: accent || "#d9e9ff", fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function InfoLine({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 14, lineHeight: 21 }}>{body}</Text>
    </View>
  );
}

function getWorkoutAccent(category?: PlanDay["category"]) {
  switch (category) {
    case "intervals":
      return "#2563eb";
    case "threshold":
      return "#38bdf8";
    case "long":
      return "#4ade80";
    case "recovery":
      return "#22c55e";
    case "rest":
      return "#94a3b8";
    case "steady":
      return "#67e8f9";
    default:
      return "#93c5fd";
  }
}
