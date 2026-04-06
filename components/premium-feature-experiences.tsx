import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import {
  buildAdaptivePlanPreview,
  buildAdvancedTrainingInsight,
  buildBasicRacePrediction,
  buildDynamicRacePrediction,
  buildFuelingSuggestion,
  buildGoalPacingCalculator,
  buildGoalTrackStatus,
  buildHeartRateGuidance,
  buildProgressTrackingInsight,
  buildWeeklyPerformanceSummary,
  buildWorkoutMetricsInsight,
  generatePostRunFeedback,
} from "@/lib/premium-coach";
import { buildAdaptiveWeeklyPlan } from "@/lib/training-plan";
import { buildUpgradePath, normalizeUpgradePlan } from "@/lib/upgrade-route";
import { type PremiumFeatureKey, type PremiumTier } from "@/lib/premium-products";

export function PremiumFeatureExperiences() {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { workouts, completedWorkoutIds, likedWorkoutCategories, planCycle } = useWorkouts();
  const { tier, selectedBillingCycle, hasAccess, getFeatureGate } = usePremium();
  const isWide = width >= 960;
  const mileageGoal = Number.parseFloat(profile.mileage) || 24;
  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workouts]
  );
  const latestWorkout = sortedWorkouts[0] ?? null;
  const recentWorkouts = sortedWorkouts.slice(1, 6);
  const weeklyPlan = useMemo(
    () =>
      buildAdaptiveWeeklyPlan(
        profile.goalEvent || "",
        String(mileageGoal),
        profile.pr5k || "",
        likedWorkoutCategories,
        planCycle,
        { runnerLevel: profile.runnerLevel, preferredTrainingDays: profile.preferredTrainingDays },
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
    [completedWorkoutIds, likedWorkoutCategories, mileageGoal, planCycle, profile.goalEvent, profile.preferredTrainingDays, profile.pr5k, profile.runnerLevel, workouts]
  );
  const adaptivePlan = useMemo(
    () =>
      buildAdaptivePlanPreview({
        plan: weeklyPlan,
        workouts: sortedWorkouts,
        completedWorkoutIds,
      }),
    [completedWorkoutIds, sortedWorkouts, weeklyPlan]
  );
  const heartRate = useMemo(() => buildHeartRateGuidance(profile, weeklyPlan[0]?.title), [profile, weeklyPlan]);
  const fueling = useMemo(() => buildFuelingSuggestion(profile, sortedWorkouts), [profile, sortedWorkouts]);
  const progress = useMemo(() => buildProgressTrackingInsight(sortedWorkouts), [sortedWorkouts]);
  const basicPrediction = useMemo(() => buildBasicRacePrediction(profile, sortedWorkouts), [profile, sortedWorkouts]);
  const workoutMetrics = useMemo(() => buildWorkoutMetricsInsight(sortedWorkouts), [sortedWorkouts]);
  const advancedPrediction = useMemo(() => buildDynamicRacePrediction(profile, sortedWorkouts), [profile, sortedWorkouts]);
  const weeklySummary = useMemo(() => buildWeeklyPerformanceSummary({ profile, workouts: sortedWorkouts }), [profile, sortedWorkouts]);
  const goalTrack = useMemo(() => buildGoalTrackStatus({ profile, workouts: sortedWorkouts }), [profile, sortedWorkouts]);
  const advancedInsight = useMemo(() => buildAdvancedTrainingInsight({ profile, workouts: sortedWorkouts }), [profile, sortedWorkouts]);
  const goalTime = profile.raceGoals[0]?.goalTime || profile.onboardingAnswers.goalTime || "";
  const goalPacing = useMemo(() => buildGoalPacingCalculator(goalTime, getGoalDistanceMiles(profile.raceGoals[0]?.event || profile.goalEvent)), [goalTime, profile.goalEvent, profile.raceGoals]);
  const postRunFeedback = useMemo(
    () => (latestWorkout ? generatePostRunFeedback({ workout: latestWorkout, previousWorkouts: recentWorkouts }) : null),
    [latestWorkout, recentWorkouts]
  );

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>See what Pro and Elite actually unlock</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, maxWidth: 780 }}>
          Pro adds smarter training tools you can use right away. Elite layers on adaptive planning, coach-style feedback, and deeper performance reads that feel much closer to real coaching.
        </Text>
      </View>

      <FeatureTierSection
        title="Pro experiences"
        subtitle="Smarter tools for runners who want clearer guidance without turning every screen into a coaching report."
        tierLabel="PRO"
        accent="#2563eb"
      >
        <FeatureGrid wide={isWide}>
          <FeatureCard
            title="Heart rate zones"
            tierLabel="PRO"
            featureKey="heart_rate_guidance"
            cardTier="pro"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
          >
            <Text style={bodyText}>Target {heartRate.targetZone?.name || "Zone 2"} for {weeklyPlan[0]?.title?.toLowerCase() || "most easy days"}.</Text>
            <Text style={mutedText}>{heartRate.sourceLabel}</Text>
            <ZoneRow zones={heartRate.zones.slice(0, 3)} highlight={heartRate.targetZone?.name} />
            <Text style={mutedText}>{heartRate.targetZone?.purpose || "Add age or max heart rate to personalize this guidance."}</Text>
          </FeatureCard>

          <FeatureCard
            title="Fueling suggestions"
            tierLabel="PRO"
            featureKey="fueling_suggestions"
            cardTier="pro"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
          >
            <Text style={bodyText}>{fueling.headline}</Text>
            <Text style={mutedText}>{fueling.timingLabel}</Text>
            {fueling.suggestions.slice(0, 3).map((item) => (
              <BulletLine key={item} text={item} accent="#93c5fd" />
            ))}
          </FeatureCard>

          <FeatureCard
            title="Enhanced progress tracking"
            tierLabel="PRO"
            featureKey="progress_insights"
            cardTier="pro"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
          >
            <Text style={bodyText}>{progress.headline}</Text>
            <MetricRow label="This week" value={`${progress.currentWeekMiles.toFixed(1)} mi`} />
            <MetricRow label="Last week" value={`${progress.previousWeekMiles.toFixed(1)} mi`} />
            <MetricRow label="Change" value={progress.changeLabel} accent="#93c5fd" />
            <Text style={mutedText}>{progress.summary}</Text>
          </FeatureCard>

          <FeatureCard
            title="Basic race predictor"
            tierLabel="PRO"
            featureKey="race_prediction_basic"
            cardTier="pro"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
          >
            <MetricHero value={basicPrediction.predictedTime || "--"} label={basicPrediction.eventLabel} accent="#93c5fd" />
            <Text style={mutedText}>{basicPrediction.summary}</Text>
          </FeatureCard>

          <FeatureCard
            title="Workout metrics"
            tierLabel="PRO"
            featureKey="training_metrics_enhanced"
            cardTier="pro"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
          >
            <Text style={bodyText}>{workoutMetrics.workoutLabel}</Text>
            <MetricRow label="Avg pace" value={workoutMetrics.averagePace || "--"} />
            <MetricRow label="Consistency" value={workoutMetrics.splitConsistency} accent="#93c5fd" />
            <Text style={mutedText}>
              {workoutMetrics.splits.length > 0 ? `Recent splits: ${workoutMetrics.splits.join("  •  ")}` : workoutMetrics.summary}
            </Text>
          </FeatureCard>
        </FeatureGrid>
      </FeatureTierSection>

      <FeatureTierSection
        title="Elite experiences"
        subtitle="Everything in Pro, plus a coaching-style system that responds to your training, goal, and execution."
        tierLabel="ELITE"
        accent="#67e8f9"
        premium={true}
      >
        <FeatureGrid wide={isWide}>
          <FeatureCard
            title="Adaptive training"
            tierLabel="ELITE"
            featureKey="adaptive_training"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <Text style={bodyText}>{adaptivePlan.summary}</Text>
            {adaptivePlan.adjustments.slice(0, 3).map((item) => (
              <BulletLine key={item} text={item} accent="#67e8f9" />
            ))}
            {adaptivePlan.adjustments.length === 0 ? <Text style={mutedText}>The current signals support keeping the plan intact.</Text> : null}
          </FeatureCard>

          <FeatureCard
            title="Post-run feedback"
            tierLabel="ELITE"
            featureKey="post_run_feedback"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <Text style={bodyText}>{postRunFeedback?.title || "Log a workout to unlock coach notes."}</Text>
            <Text style={mutedText}>{postRunFeedback?.summary || "Elite turns every finished session into a quick coaching read."}</Text>
            {postRunFeedback ? (
              <>
                <BulletLine text={postRunFeedback.pacingNote} accent="#67e8f9" />
                <BulletLine text={postRunFeedback.effortNote} accent="#67e8f9" />
                <BulletLine text={postRunFeedback.nextStep} accent="#67e8f9" />
              </>
            ) : null}
          </FeatureCard>

          <FeatureCard
            title="Advanced race predictor"
            tierLabel="ELITE"
            featureKey="race_prediction_advanced"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <MetricHero value={advancedPrediction.predictedTime || "--"} label={advancedPrediction.eventLabel} accent="#67e8f9" />
            <MetricRow label="Confidence" value={advancedPrediction.confidenceLabel} accent="#67e8f9" />
            <MetricRow label="Trend" value={advancedPrediction.trendLabel} accent={advancedPrediction.trendDirection === "up" ? "#4ade80" : advancedPrediction.trendDirection === "steady" ? "#67e8f9" : "#fbbf24"} />
            <Text style={mutedText}>{advancedPrediction.summary}</Text>
            <BulletLine text={advancedPrediction.explanation} accent="#67e8f9" />
          </FeatureCard>

          <FeatureCard
            title="Goal pacing calculator"
            tierLabel="ELITE"
            featureKey="goal_pacing_calculator"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <Text style={bodyText}>{goalPacing ? `Built from your ${goalTime} goal.` : "Add a goal time to unlock pacing targets."}</Text>
            <MetricRow label="Per mile" value={goalPacing?.perMile || "--"} />
            <MetricRow label="Per km" value={goalPacing?.perKilometer || "--"} />
            <MetricRow label="Per 400m" value={goalPacing?.per400m || "--"} accent="#67e8f9" />
          </FeatureCard>

          <FeatureCard
            title="Weekly performance summary"
            tierLabel="ELITE"
            featureKey="weekly_performance_summaries"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <Text style={bodyText}>{weeklySummary.headline}</Text>
            <Text style={mutedText}>{weeklySummary.summary}</Text>
            <MetricRow label="Runs" value={String(weeklySummary.totalRuns)} />
            <MetricRow label="Mileage" value={`${weeklySummary.totalMiles.toFixed(1)} mi`} />
            <MetricRow label="Consistency" value={weeklySummary.consistencyLabel} accent="#67e8f9" />
            <BulletLine text={weeklySummary.takeaway} accent="#67e8f9" />
          </FeatureCard>

          <FeatureCard
            title="On track system"
            tierLabel="ELITE"
            featureKey="goal_on_track"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <MetricHero
              value={`${goalTrack.progressPercent}%`}
              label={goalTrack.statusLabel}
              accent={
                goalTrack.state === "on_track"
                  ? "#4ade80"
                  : goalTrack.state === "trending_up"
                    ? "#67e8f9"
                    : goalTrack.state === "slightly_behind"
                      ? "#fbbf24"
                      : "#f97316"
              }
            />
            <Text style={mutedText}>{goalTrack.summary}</Text>
            <BulletLine text={goalTrack.suggestion} accent="#67e8f9" />
          </FeatureCard>

          <FeatureCard
            title="Advanced insights"
            tierLabel="ELITE"
            featureKey="personalized_insights_advanced"
            cardTier="elite"
            hasAccess={hasAccess}
            getFeatureGate={getFeatureGate}
            selectedBillingCycle={selectedBillingCycle}
            onUpgrade={(plan, billing) => router.push(buildUpgradePath({ plan: normalizeUpgradePlan(plan), billing }))}
            premium={true}
          >
            <Text style={bodyText}>{advancedInsight.headline}</Text>
            <Text style={mutedText}>{advancedInsight.summary}</Text>
            {advancedInsight.bullets.map((item) => (
              <BulletLine key={item} text={item} accent="#67e8f9" />
            ))}
          </FeatureCard>
        </FeatureGrid>
      </FeatureTierSection>
    </View>
  );
}

function FeatureTierSection({
  title,
  subtitle,
  tierLabel,
  accent,
  premium,
  children,
}: {
  title: string;
  subtitle: string;
  tierLabel: string;
  accent: string;
  premium?: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        gap: 16,
        backgroundColor: premium ? "#132438" : colors.card,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: premium ? "rgba(103, 232, 249, 0.16)" : colors.border,
        padding: 20,
      }}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>{tierLabel}</Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{title}</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, maxWidth: 760 }}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function FeatureGrid({
  wide,
  children,
}: {
  wide: boolean;
  children: React.ReactNode;
}) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, alignItems: wide ? "stretch" : "flex-start" }}>{children}</View>;
}

function FeatureCard({
  title,
  tierLabel,
  featureKey,
  cardTier,
  premium,
  hasAccess,
  getFeatureGate,
  selectedBillingCycle,
  onUpgrade,
  children,
}: {
  title: string;
  tierLabel: string;
  featureKey: PremiumFeatureKey;
  cardTier: "pro" | "elite";
  premium?: boolean;
  hasAccess: (featureKey: PremiumFeatureKey) => boolean;
  getFeatureGate: (featureKey: PremiumFeatureKey) => { locked: boolean; requiredTier: PremiumTier; preview: string; upgradeCopy: string };
  selectedBillingCycle: "monthly" | "yearly";
  onUpgrade: (tier: PremiumTier, billingCycle?: "monthly" | "yearly") => void;
  children: React.ReactNode;
}) {
  const { colors } = useThemeColors();
  const gate = getFeatureGate(featureKey);
  const unlocked = hasAccess(featureKey);

  return (
    <View
      style={{
        flex: 1,
        minWidth: 280,
        backgroundColor: premium ? "rgba(8, 17, 29, 0.78)" : colors.cardAlt,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: premium ? "rgba(103, 232, 249, 0.18)" : colors.border,
        padding: 18,
        gap: 12,
        overflow: "hidden",
        position: "relative",
        minHeight: cardTier === "elite" ? 230 : 205,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: cardTier === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{tierLabel}</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 8 }}>{title}</Text>
        </View>
        {!unlocked ? (
          <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800" }}>LOCKED</Text>
          </View>
        ) : null}
      </View>

      <View style={{ gap: 10, opacity: unlocked ? 1 : 0.42 }}>{children}</View>

      {!unlocked ? (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(4, 10, 18, 0.78)",
            borderRadius: 24,
            padding: 18,
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{gate.requiredTier === "elite" ? "Elite coaching preview" : "Pro tools preview"}</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{gate.preview}</Text>
          <Text style={{ color: cardTier === "elite" ? "#67e8f9" : "#93c5fd", fontSize: 13, lineHeight: 20 }}>{gate.upgradeCopy}</Text>
          <Pressable
            onPress={() => onUpgrade(gate.requiredTier, selectedBillingCycle)}
            style={{
              minHeight: 44,
              borderRadius: 16,
              backgroundColor: cardTier === "elite" ? "#2563eb" : "#163154",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
              {gate.requiredTier === "elite" ? "Unlock Elite" : "Unlock Pro"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ZoneRow({
  zones,
  highlight,
}: {
  zones: { name: string; label: string; range: string }[];
  highlight?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {zones.map((zone) => (
        <View
          key={zone.name}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
            backgroundColor: highlight === zone.name ? "rgba(37, 99, 235, 0.14)" : "rgba(255,255,255,0.03)",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#dcecff", fontSize: 13, fontWeight: "700" }}>{zone.name}</Text>
          <Text style={{ color: "#9db2ca", fontSize: 13 }}>{zone.range}</Text>
        </View>
      ))}
    </View>
  );
}

function MetricHero({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: accent, fontSize: 28, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "#dcecff", fontSize: 14, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function MetricRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: "#9db2ca", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: accent || "#f8fbff", fontSize: 13, fontWeight: "700", textAlign: "right", flexShrink: 1 }}>{value}</Text>
    </View>
  );
}

function BulletLine({
  text,
  accent,
}: {
  text: string;
  accent: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <Text style={{ color: accent, fontSize: 14, fontWeight: "800" }}>•</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19, flex: 1 }}>{text}</Text>
    </View>
  );
}

function getGoalDistanceMiles(event: string) {
  const normalized = event.trim().toLowerCase();

  if (normalized.includes("800")) {
    return 0.4971;
  }

  if (normalized.includes("1600") || normalized.includes("mile")) {
    return 1;
  }

  if (normalized.includes("10k")) {
    return 6.2137;
  }

  if (normalized.includes("half")) {
    return 13.1094;
  }

  if (normalized.includes("marathon")) {
    return 26.2188;
  }

  return 3.1069;
}

const bodyText = {
  color: "#f8fbff",
  fontSize: 15,
  fontWeight: "700" as const,
  lineHeight: 21,
};

const mutedText = {
  color: "#9db2ca",
  fontSize: 13,
  lineHeight: 20,
};
