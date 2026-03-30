import { router } from "expo-router";
import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { InfoCard, PageHeader, SecondaryButton, StatCard } from "@/components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getStatsSummary, getWeeklyGoalProgress } from "@/utils/training-insights";

export default function Progress() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const mileageGoal = parseFloat(profile.mileage) || 30;
  const goalProgress = getWeeklyGoalProgress(workouts, mileageGoal);
  const stats = getStatsSummary(workouts);

  return (
    <AnimatedTabScene tabKey="progress">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={profile.name} onAvatarPress={openDrawer} />

        <PageHeader
          eyebrow="Insights"
          title="Your running dashboard"
          subtitle="Weekly and monthly mileage, trend charts, effort, pace, and simple rule-based insight from the work you log."
        />

        {workouts.length === 0 ? (
          <EmptyDashboard colors={colors} />
        ) : (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
              <DashboardStatCard label="This Week" value={`${stats.weeklyMiles.toFixed(1)} mi`} helper="Current week total" />
              <DashboardStatCard label="This Month" value={`${stats.monthlyMiles.toFixed(1)} mi`} helper="Current month total" />
              <DashboardStatCard label="Workouts Logged" value={`${stats.totalWorkouts}`} helper="Saved sessions" />
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
            </View>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Weekly Goal"
                subtitle="Mileage progress for the current training week."
              />

              <View
                style={{
                  marginTop: 18,
                  backgroundColor: colors.cardAlt,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
                  {goalProgress.currentMiles.toFixed(1)} / {goalProgress.goalMiles.toFixed(0)} mi
                </Text>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
                  {Math.round(goalProgress.progressPercent)}% of weekly goal
                </Text>
                <View style={{ height: 12, borderRadius: 999, backgroundColor: colors.border, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${goalProgress.progressPercent}%`,
                      height: "100%",
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
                <Text style={{ color: colors.subtext, fontSize: 13 }}>
                  {goalProgress.remainingMiles.toFixed(1)} miles remaining this week
                </Text>
              </View>
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Weekly Mileage Trend"
                subtitle="A six-week look at volume so consistency is easy to spot."
              />
              <BarChart colors={colors} points={stats.weeklyTrend} />
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Monthly Mileage"
                subtitle="A simple month-over-month view of your recent running volume."
              />
              <BarChart colors={colors} points={stats.monthlyTrend} />
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Insights Summary"
                subtitle="Short rule-based reads on how training is trending."
              />
              <View style={{ marginTop: 16, gap: 10 }}>
                {stats.insights.map((insight) => (
                  <View
                    key={insight.title}
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor:
                        insight.tone === "up" ? colors.success : insight.tone === "caution" ? colors.primary : colors.border,
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{insight.title}</Text>
                  </View>
                ))}
              </View>
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="More tools"
                subtitle="Jump to the planning and prediction features that connect to this data."
              />
              <View style={{ marginTop: 16, flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="Goals" onPress={() => router.push("/goals")} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="Predictor" onPress={() => router.push("/race-predictor")} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="Gear" onPress={() => router.push("/gear")} />
                </View>
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

function BarChart({
  colors,
  points,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  points: { label: string; miles: number; current: boolean }[];
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
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, height: 200 }}>
        {points.map((point) => (
          <View key={point.label} style={{ flex: 1, alignItems: "center", gap: 8 }}>
            <Text style={{ color: point.current ? colors.text : colors.subtext, fontSize: 12, fontWeight: "700" }}>
              {point.miles.toFixed(1)}
            </Text>
            <View
              style={{
                width: "100%",
                height: `${Math.max((point.miles / maxMiles) * 100, 10)}%`,
                minHeight: 16,
                borderRadius: 14,
                backgroundColor: point.current ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: point.current ? colors.primary : colors.border,
              }}
            />
            <Text style={{ color: colors.subtext, fontSize: 12 }}>{point.label}</Text>
          </View>
        ))}
      </View>
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
        subtitle="Log your first workout to unlock mileage totals, pace trends, effort averages, streaks, and insight summaries."
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
          Once you start saving workouts, NextStride will populate your weekly mileage, monthly total, longest run, average effort, average pace, total sessions, and trend charts automatically.
        </Text>
      </View>
    </InfoCard>
  );
}
