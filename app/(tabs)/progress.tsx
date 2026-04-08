import { router } from "expo-router";
import { Text, View } from "react-native";
import { AdvancedRacePredictorCard } from "@/components/advanced-race-predictor-card";
import { PersonalRecordsCard } from "@/components/personal-records-card";
import { AmbientTrackBackdrop, RunnerEmptyState, RunningSurfaceAccent } from "@/components/running-visuals";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { WorkoutEffortChip } from "@/components/workout-effort-chip";
import { getSurfaceCardStyle, InfoCard, PageHeader, SecondaryButton, StatCard } from "@/components/ui-kit";
import { AnimatedProgressBar, FadeInView } from "@/components/ui-polish";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useResponsiveLayout } from "@/lib/responsive";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getLoggedWorkoutEffortGuidance, getWorkoutPurpose } from "@/lib/workout-effort";
import { getStatsSummary, getWeeklyGoalProgress } from "@/utils/training-insights";

export default function Progress() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const layout = useResponsiveLayout();
  const mileageGoal = parseFloat(profile.mileage) || 30;
  const goalProgress = getWeeklyGoalProgress(workouts, mileageGoal);
  const stats = getStatsSummary(workouts);
  const recentWorkouts = [...workouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <AnimatedTabScene tabKey="progress">
      <ScreenScroll colors={colors}>
        <AmbientTrackBackdrop variant="road" style={{ top: 74, height: 980 }} />
        <TopProfileBar imageUri={profile.image} name={profile.name} onAvatarPress={openDrawer} />

        <PageHeader
          eyebrow="Progress"
          title="The work you have already put in"
          subtitle="Use this page to check volume, momentum, recent sessions, and the progress signals that help training feel real."
        />

        {workouts.length === 0 ? (
          <EmptyDashboard colors={colors} />
        ) : (
          <>
            <FadeInView delay={40}>
              <View
                style={{
                  backgroundColor: "#0f1b2d",
                  borderRadius: 32,
                  borderWidth: 1,
                  borderColor: "rgba(103, 232, 249, 0.16)",
                  padding: 22,
                  gap: 16,
                  shadowColor: "#38bdf8",
                  shadowOpacity: 0.12,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 10 },
                  overflow: "hidden",
                }}
              >
                <RunningSurfaceAccent variant="road" />
                <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                  PERFORMANCE SNAPSHOT
                </Text>
                <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", lineHeight: 34 }}>
                  {goalProgress.currentMiles.toFixed(1)} miles logged toward this week&apos;s goal
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                  The main read here is simple: volume, consistency, and recent work should feel easy to trust at a glance.
                </Text>
                <AnimatedProgressBar
                  progress={goalProgress.progressPercent}
                  fillColor="#2563eb"
                  trackColor="rgba(255,255,255,0.08)"
                  height={10}
                />
                <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10 }}>
                  <ProgressHeroPill
                    label="Weekly goal"
                    value={`${goalProgress.goalMiles.toFixed(0)} mi target`}
                  />
                  <ProgressHeroPill
                    label="Remaining"
                    value={`${Math.max(goalProgress.remainingMiles, 0).toFixed(1)} mi left`}
                  />
                  <ProgressHeroPill
                    label="Logged runs"
                    value={`${stats.totalWorkouts} saved`}
                  />
                </View>
              </View>
            </FadeInView>

            <View
              style={[
                getSurfaceCardStyle(colors, { tone: "contrast", padding: 16 }),
                { gap: 12, overflow: "hidden" },
              ]}
            >
              <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10 }}>
                <RewardSignalCard
                  label="Momentum"
                  value={stats.totalWorkouts >= 4 ? "Steady build" : "Base in progress"}
                  detail={stats.totalWorkouts >= 4 ? "You have enough recent work logged to trust the trend." : "A few more runs will make the signal much stronger."}
                  accent
                />
                <RewardSignalCard
                  label="Best marker"
                  value={`${stats.longestRun.toFixed(1)} mi long run`}
                  detail="Your longest recent effort is a simple confidence marker."
                />
                <RewardSignalCard
                  label="Next read"
                  value={stats.averagePace ?? "Pace building"}
                  detail="Recent pacing starts to matter more as timed runs accumulate."
                />
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>CORE STATS</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>See the work behind the progress</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                Mileage, pace, and effort should feel quick to read here, not buried under extra noise.
              </Text>
            </View>

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
                subtitle="Mileage progress for the current training week, with the main number and remaining work kept clear."
              />

              <View
                style={{
                  marginTop: 18,
                  backgroundColor: "#101b2d",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "rgba(103, 232, 249, 0.12)",
                  padding: 18,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: layout.isPhone ? "column" : "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>
                      {goalProgress.currentMiles.toFixed(1)} / {goalProgress.goalMiles.toFixed(0)} mi
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
                      {Math.round(goalProgress.progressPercent)}% of weekly goal
                    </Text>
                  </View>
                  <View
                    style={{
                      alignSelf: layout.isPhone ? "flex-start" : "center",
                      backgroundColor: "rgba(15, 23, 42, 0.72)",
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minWidth: 108,
                    }}
                  >
                    <Text style={{ color: colors.subtext, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>
                      NEXT STEP
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                      {goalProgress.remainingMiles <= 0
                        ? "Goal covered"
                        : `${goalProgress.remainingMiles.toFixed(1)} mi left`}
                    </Text>
                  </View>
                </View>
                <View style={{ height: 12, borderRadius: 999, backgroundColor: colors.border, overflow: "hidden" }}>
                  <AnimatedProgressBar
                    progress={goalProgress.progressPercent}
                    fillColor={colors.primary}
                    trackColor={colors.border}
                    height={12}
                  />
                </View>
                <Text style={{ color: colors.subtext, fontSize: 13 }}>
                  {goalProgress.remainingMiles.toFixed(1)} miles remaining this week
                </Text>
              </View>
            </InfoCard>

            <PersonalRecordsCard />

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Weekly Mileage Trend"
                subtitle="A six-week look at volume so consistency feels visible, not hidden."
              />
              <BarChart colors={colors} points={stats.weeklyTrend} />
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Monthly Mileage"
                subtitle="A simple month-over-month view that is ready to become more valuable as more data builds up."
              />
              <BarChart colors={colors} points={stats.monthlyTrend} />
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Recent Completed Workouts"
                subtitle="Your latest logged sessions stay visible here so progress feels grounded in real work, not just charts."
              />
              <View style={{ marginTop: 16, gap: 10 }}>
                {recentWorkouts.map((workout) => {
                  const effortGuidance = getLoggedWorkoutEffortGuidance({ type: workout.type, effort: workout.effort });

                  return (
                    <View
                      key={workout.id}
                      style={{
                        backgroundColor: colors.cardAlt,
                        borderRadius: 22,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 16,
                        gap: 8,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", flex: 1 }}>{workout.type}</Text>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{formatWorkoutDate(workout.date)}</Text>
                      </View>
                      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
                        {formatWorkoutSummary(workout.distance, workout.time, workout.notes)}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        <WorkoutEffortChip guidance={effortGuidance} compact={true} />
                      </View>
                      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                        {effortGuidance.shortDescription}. Purpose: {getWorkoutPurpose({ type: workout.type })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </InfoCard>

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="Insights Summary"
                subtitle="Short reads that help explain the pattern behind the raw numbers."
              />
              <View style={{ marginTop: 16, gap: 10 }}>
                {stats.insights.map((insight) => (
                  <View
                    key={insight.title}
                    style={{
                      backgroundColor: "#101b2d",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor:
                        insight.tone === "up" ? colors.success : insight.tone === "caution" ? colors.primary : colors.border,
                      padding: 15,
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: insight.tone === "up" ? colors.success : insight.tone === "caution" ? colors.primary : colors.subtext,
                        fontSize: 11,
                        fontWeight: "800",
                        letterSpacing: 0.8,
                      }}
                    >
                      {insight.tone === "up" ? "POSITIVE SIGNAL" : insight.tone === "caution" ? "WATCH THIS" : "STEADY READ"}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{insight.title}</Text>
                  </View>
                ))}
              </View>
            </InfoCard>

            <AdvancedRacePredictorCard />

            <InfoCard>
              <SectionTitle
                colors={colors}
                title="More tools"
                subtitle="Jump to the planning and prediction features that connect to this data."
              />
              <View style={{ marginTop: 16, flexDirection: layout.isPhone ? "column" : "row", gap: 10 }}>
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

function formatWorkoutDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWorkoutSummary(distance: string, time: string, notes: string) {
  const summaryParts = [distance ? `${distance} mi` : "", time || "", notes || ""].filter(Boolean);
  return summaryParts.join(" • ") || "Completed workout";
}

function buildWorkoutSummary(distance: string, time: string, notes: string) {
  const summaryParts = [distance ? `${distance} mi` : "", time || "", notes || ""].filter(Boolean);
  return summaryParts.join(" • ") || "Completed workout";
}

void buildWorkoutSummary;

function DashboardStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ width: layout.isPhone ? "100%" : layout.isDesktop ? "31.8%" : "47.8%" }}>
      <StatCard label={label} value={value} helper={helper} />
    </View>
  );
}

function ProgressHeroPill({
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
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: "rgba(226, 232, 240, 0.7)", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function RewardSignalCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? "rgba(37, 99, 235, 0.16)" : "rgba(8, 17, 29, 0.54)",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: accent ? "rgba(103, 232, 249, 0.16)" : "rgba(148, 163, 184, 0.1)",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: accent ? "#67e8f9" : "rgba(226, 232, 240, 0.7)", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "800", lineHeight: 21 }}>{value}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 12, lineHeight: 17 }}>{detail}</Text>
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
        subtitle="Log your first workouts and this page will turn them into momentum, volume, and trend signals that are actually worth checking."
      />
      <View style={{ marginTop: 16, gap: 14 }}>
        <RunnerEmptyState
          title="Your progress screen will get useful quickly"
          body="A few saved runs are enough to start showing weekly volume, longest-run reads, effort patterns, streaks, and simple trend summaries."
          icon="analytics-outline"
        />
        <View
          style={{
            backgroundColor: "#101b2d",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.12)",
            padding: 18,
            gap: 14,
          }}
        >
          <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>WHAT UNLOCKS NEXT</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
            A few logged runs are enough to start showing weekly rhythm, recent momentum, race-progress context, and cleaner recent-workout reads automatically.
          </Text>
          <View style={{ gap: 10 }}>
            {[
              "Weekly mileage progress and clearer volume totals",
              "Recent-workout summaries with effort and purpose",
              "Momentum signals like streaks, countdowns, and best marks",
            ].map((item) => (
              <View key={item} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    marginTop: 6,
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={{ paddingTop: 4 }}>
            <SecondaryButton label="Log your first run" onPress={() => router.push("/log-run")} />
          </View>
        </View>
      </View>
    </InfoCard>
  );
}
