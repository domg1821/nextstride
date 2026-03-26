import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { InfoCard, PageHeader, StatCard } from "./components/ui-kit";
import { ScreenScroll, SectionTitle } from "./components/ui-shell";
import { useProfile } from "./profile-context";
import { useThemeColors } from "./theme-context";
import { useWorkouts } from "./workout-context";

type WorkoutLike = {
  distance: string;
  time: string;
  effort: number;
};

type EventTarget = {
  label: string;
  miles: number;
  fallback?: string;
};

const EVENT_TARGETS: EventTarget[] = [
  { label: "400m", miles: 0.2485 },
  { label: "800m", miles: 0.4971 },
  { label: "1600m", miles: 0.9942 },
  { label: "5K", miles: 3.1069 },
  { label: "10K", miles: 6.2137 },
  { label: "Half Marathon", miles: 13.1094 },
  { label: "Marathon", miles: 26.2188 },
];

export default function Statistics() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();

  const parsedWorkouts = workouts
    .map((workout) => ({
      distance: parseDistance(workout.distance),
      timeSeconds: parseTimeToSeconds(workout.time),
      effort: Number.isFinite(workout.effort) ? workout.effort : null,
    }))
    .filter((workout) => workout.distance !== null);

  const totalMiles = parsedWorkouts.reduce(
    (sum, workout) => sum + (workout.distance ?? 0),
    0
  );

  const workoutsLogged = workouts.length;

  const effortValues = parsedWorkouts
    .map((workout) => workout.effort)
    .filter((effort): effort is number => effort !== null);

  const averageEffort =
    effortValues.length > 0
      ? (effortValues.reduce((sum, effort) => sum + effort, 0) / effortValues.length).toFixed(1)
      : "0.0";

  const longestRun = parsedWorkouts.reduce((longest, workout) => {
    return Math.max(longest, workout.distance ?? 0);
  }, 0);

  const prCards = EVENT_TARGETS.map((event) => ({
    label: event.label,
    value:
      event.label === "5K" && profile.pr5k
        ? profile.pr5k
        : findBestTimeForDistance(workouts, event.miles) ?? "Not added",
  }));

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>
          Back
        </Text>
      </Pressable>

      <PageHeader
        eyebrow="Statistics"
        title="Your training numbers"
        subtitle="A clean snapshot of the volume, effort, and benchmarks you have logged so far."
      />

      <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
        <View style={{ width: "47.8%" }}>
          <StatCard
            label="Total Miles Logged"
            value={`${totalMiles.toFixed(1)} mi`}
            helper="Across all saved workouts"
          />
        </View>
        <View style={{ width: "47.8%" }}>
          <StatCard
            label="Workouts Logged"
            value={`${workoutsLogged}`}
            helper="Sessions saved"
          />
        </View>
        <View style={{ width: "47.8%" }}>
          <StatCard
            label="Average Effort"
            value={`${averageEffort}/10`}
            helper="Based on logged effort"
          />
        </View>
        <View style={{ width: "47.8%" }}>
          <StatCard
            label="Longest Run"
            value={`${longestRun.toFixed(1)} mi`}
            helper="Single longest distance"
          />
        </View>
      </View>

      <InfoCard
        title="Performance Snapshot"
        subtitle="Quick summary of your current logged running profile."
      >
        <DataRow label="Goal Event" value={profile.goalEvent || "Not set"} />
        <DataRow label="Weekly Mileage Goal" value={`${profile.mileage || "0"} mi`} />
        <DataRow label="Saved 5K PR" value={profile.pr5k || "Not added"} />
      </InfoCard>

      <SectionTitle
        colors={colors}
        title="Personal Records"
        subtitle="Best marks read from your current profile and matching logged workout distances."
      />

      <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
        {prCards.map((card) => (
          <View key={card.label} style={{ width: "47.8%" }}>
            <InfoCard title={card.label}>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>
                {card.value}
              </Text>
            </InfoCard>
          </View>
        ))}
      </View>
    </ScreenScroll>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function parseDistance(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimeToSeconds(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(":").map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

function formatSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function findBestTimeForDistance(workouts: WorkoutLike[], targetMiles: number) {
  const tolerance = Math.max(0.05, targetMiles * 0.04);

  const matchingTimes = workouts
    .map((workout) => ({
      distance: parseDistance(workout.distance),
      timeSeconds: parseTimeToSeconds(workout.time),
    }))
    .filter(
      (workout) =>
        workout.distance !== null &&
        workout.timeSeconds !== null &&
        Math.abs(workout.distance - targetMiles) <= tolerance
    )
    .map((workout) => workout.timeSeconds as number);

  if (matchingTimes.length === 0) {
    return null;
  }

  return formatSeconds(Math.min(...matchingTimes));
}
