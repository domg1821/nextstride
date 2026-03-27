import { Text, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, StatCard } from "../components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";
import {
  formatFeedDate,
  getDashboardStats,
  getRecentMileageTrend,
  getWeeklySummary,
  getWorkoutPace,
} from "../workout-utils";

export default function Progress() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const stats = getDashboardStats(workouts);
  const weeklySummary = getWeeklySummary(workouts);
  const mileageTrend = getRecentMileageTrend(workouts);

  return (
    <AnimatedTabScene tabKey="progress">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={profile.name} />

        <PageHeader
          eyebrow="Performance"
          title="Your running dashboard"
          subtitle="A clearer read on volume, consistency, effort, and the shape of your recent training."
        />

        {workouts.length === 0 ? (
          <EmptyDashboard colors={colors} />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
              <DashboardStatCard label="This Week" value={`${stats.weeklyMiles.toFixed(1)} mi`} helper="Current week total" />
              <DashboardStatCard label="This Month" value={`${stats.monthlyMiles.toFixed(1)} mi`} helper="Current month total" />
              <DashboardStatCard label="Longest Run" value={`${stats.longestRun.toFixed(1)} mi`} helper="Best single distance" />
              <DashboardStatCard
                label="Average Effort"
                value={stats.averageEffort === null ? "N/A" : `${stats.averageEffort.toFixed(1)}/10`}
                helper="Across all logged workouts"
              />
              <DashboardStatCard
                label="Average Pace"
                value={stats.averagePace ?? "N/A"}
                helper="Valid timed runs only"
              />
              <DashboardStatCard
                label="Workouts Logged"
                value={`${stats.totalWorkouts}`}
                helper="Saved sessions"
              />
            </View>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Recent Mileage Trend"
                subtitle="A four-week view of your running volume so momentum is easy to spot."
              />
              <MileageTrendChart colors={colors} points={mileageTrend} />
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="This Week"
                subtitle="A compact weekly summary pulled from your actual logged workouts."
              />

              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
                <SummaryTile colors={colors} label="Miles" value={`${weeklySummary.totalMiles.toFixed(1)} mi`} />
                <SummaryTile colors={colors} label="Workouts" value={`${weeklySummary.workoutsCompleted}`} />
                <SummaryTile
                  colors={colors}
                  label="Avg effort"
                  value={
                    weeklySummary.averageEffort === null
                      ? "N/A"
                      : `${weeklySummary.averageEffort.toFixed(1)}/10`
                  }
                />
                <SummaryTile colors={colors} label="Longest" value={`${weeklySummary.longestRun.toFixed(1)} mi`} />
              </View>
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Training Snapshot"
                subtitle="Goal context and recent activity in one calmer view."
              />

              <View style={{ marginTop: 14, gap: 14 }}>
                <SnapshotRow colors={colors} label="Goal Event" value={profile.goalEvent || "Not set"} />
                <SnapshotRow colors={colors} label="Weekly Goal" value={`${profile.mileage || "0"} mi`} />
                <SnapshotRow colors={colors} label="Saved 5K PR" value={profile.pr5k || "Not added yet"} />
              </View>

              <View style={{ marginTop: 18, gap: 14 }}>
                {workouts.slice(0, 3).map((workout, index) => (
                  <View
                    key={workout.id}
                    style={{
                      paddingTop: index === 0 ? 0 : 14,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                      {workout.type || "Workout"}
                    </Text>
                    <Text style={{ color: colors.subtext, marginTop: 6, fontSize: 14, lineHeight: 20 }}>
                      {formatFeedDate(workout.date)} {"\u2022"} {workout.distance} mi {"\u2022"}{" "}
                      {getWorkoutPace(workout.distance, workout.time) ?? workout.time}
                    </Text>
                  </View>
                ))}
              </View>
            </InfoCard>
          </>
        )}
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function DashboardStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={{ width: "47.8%" }}>
      <StatCard label={label} value={value} helper={helper} />
    </View>
  );
}

function MileageTrendChart({
  colors,
  points,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  points: ReturnType<typeof getRecentMileageTrend>;
}) {
  const maxMiles = Math.max(...points.map((point) => point.miles), 1);

  return (
    <View
      style={{
        marginTop: 18,
        backgroundColor: colors.cardAlt,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          height: 190,
        }}
      >
        {points.map((point) => (
          <View key={point.label} style={{ flex: 1, alignItems: "center", gap: 10 }}>
            <Text style={{ color: point.current ? colors.text : colors.subtext, fontSize: 12, fontWeight: "700" }}>
              {point.miles.toFixed(1)}
            </Text>
            <View
              style={{
                width: "100%",
                height: `${Math.max((point.miles / maxMiles) * 100, 10)}%`,
                minHeight: 18,
                borderRadius: 16,
                backgroundColor: point.current ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: point.current ? colors.primary : colors.border,
              }}
            />
            <Text style={{ color: colors.subtext, fontSize: 12, textAlign: "center" }}>{point.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SummaryTile({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        width: "47.8%",
        backgroundColor: colors.cardAlt,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function SnapshotRow({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
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

function EmptyDashboard({
  colors,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
}) {
  return (
    <InfoCard>
      <SectionTitle
        colors={colors}
        title="No training data yet"
        subtitle="Log your first workout to unlock mileage totals, pace trends, effort averages, and recent performance charts."
      />
      <View
        style={{
          marginTop: 16,
          backgroundColor: colors.cardAlt,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
          Once you start saving workouts, NextStride will populate your weekly mileage, monthly total, longest run, average effort, average pace, total sessions, and recent mileage trend automatically.
        </Text>
      </View>
    </InfoCard>
  );
}
