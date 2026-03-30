import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { InfoCard, PageHeader, StatCard } from "@/components/ui-kit";
import { ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import {
  getAverageEffort,
  getAveragePace,
  getDashboardStats,
  getRecentMileageTrend,
  parseDistance,
} from "@/utils/workout-utils";

type EventTarget = {
  label: string;
  key: keyof ReturnType<typeof useProfile>["profile"]["prs"];
};

const EVENT_TARGETS: EventTarget[] = [
  { label: "400m", key: "400" },
  { label: "800m", key: "800" },
  { label: "1600m / Mile", key: "1600" },
  { label: "3200m / 2 Mile", key: "3200" },
  { label: "5K", key: "5k" },
  { label: "10K", key: "10k" },
  { label: "Half Marathon", key: "half" },
  { label: "Marathon", key: "marathon" },
];

export default function Statistics() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const stats = getDashboardStats(workouts);
  const trend = getRecentMileageTrend(workouts);
  const totalMiles = workouts.reduce((sum, workout) => sum + (parseDistance(workout.distance) ?? 0), 0);
  const averageEffort = getAverageEffort(workouts);
  const averagePace = getAveragePace(workouts);

  const prCards = EVENT_TARGETS.map((event) => ({
    label: event.label,
    value: event.key === "5k" ? profile.pr5k || profile.prs["5k"] || "Not added" : profile.prs[event.key] || "Not added",
  }));

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Statistics"
        title="Detailed training numbers"
        subtitle="A more complete view of lifetime totals, average training quality, and benchmark performances."
      />

      <Pressable
        onPress={() => router.push("/race-predictor")}
        style={{
          backgroundColor: colors.cardAlt,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>Open Race Predictor</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
          See current race predictions across events using your recent workouts and profile data.
        </Text>
      </Pressable>

      {workouts.length === 0 ? (
        <InfoCard
          title="No statistics yet"
          subtitle="Log workouts to unlock mileage totals, pace averages, effort trends, and record tracking."
        />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
            <StatWrap>
              <StatCard label="Total Miles" value={`${totalMiles.toFixed(1)} mi`} helper="Lifetime logged volume" />
            </StatWrap>
            <StatWrap>
              <StatCard label="Total Workouts" value={`${stats.totalWorkouts}`} helper="All saved sessions" />
            </StatWrap>
            <StatWrap>
              <StatCard
                label="Average Effort"
                value={averageEffort === null ? "N/A" : `${averageEffort.toFixed(1)}/10`}
                helper="Across all workouts"
              />
            </StatWrap>
            <StatWrap>
              <StatCard label="Average Pace" value={averagePace ?? "N/A"} helper="Valid timed runs only" />
            </StatWrap>
          </View>

          <InfoCard>
            <SectionTitle
              colors={colors}
              title="Recent Volume"
              subtitle="A compact four-week mileage trend to complement the main dashboard."
            />
            <MiniTrendRow colors={colors} points={trend} />
          </InfoCard>

          <InfoCard title="Performance Snapshot" subtitle="A quick summary of your current running profile.">
            <DataRow label="Goal Event" value={profile.goalEvent || "Not set"} />
            <DataRow label="Weekly Mileage Goal" value={`${profile.mileage || "0"} mi`} />
            <DataRow label="Longest Run" value={`${stats.longestRun.toFixed(1)} mi`} />
            <DataRow label="Miles This Month" value={`${stats.monthlyMiles.toFixed(1)} mi`} />
          </InfoCard>

          <SectionTitle
            colors={colors}
            title="Personal Records"
            subtitle="Manual profile PRs stay editable, and qualifying logged efforts can now update these automatically."
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
        </>
      )}
    </ScreenScroll>
  );
}

function StatWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ width: "47.8%" }}>{children}</View>;
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

function MiniTrendRow({
  colors,
  points,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  points: ReturnType<typeof getRecentMileageTrend>;
}) {
  const maxMiles = Math.max(...points.map((point) => point.miles), 1);

  return (
    <View style={{ marginTop: 18, flexDirection: "row", gap: 10, alignItems: "flex-end", height: 150 }}>
      {points.map((point) => (
        <View key={point.label} style={{ flex: 1, alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: "100%",
              height: `${Math.max((point.miles / maxMiles) * 100, 10)}%`,
              minHeight: 16,
              borderRadius: 14,
              backgroundColor: point.current ? colors.primary : colors.cardAlt,
              borderWidth: 1,
              borderColor: point.current ? colors.primary : colors.border,
            }}
          />
          <Text style={{ color: colors.subtext, fontSize: 12 }}>{point.label}</Text>
        </View>
      ))}
    </View>
  );
}
