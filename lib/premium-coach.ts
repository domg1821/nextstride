import type { ProfileType } from "@/contexts/profile-context";
import type { PlanDay } from "@/lib/training-plan";
import type { WorkoutType } from "@/contexts/workout-context";
import {
  PREMIUM_FEATURES,
  PREMIUM_PLANS,
  type PremiumFeatureKey,
  type PremiumTier,
  getTierRank,
  isTierAtLeast,
} from "@/lib/premium-products";
import { getPredictionForEvent, normalizePredictorEvent } from "@/utils/race-predictor-engine";
import {
  formatDuration,
  getAveragePace,
  getRecentMileageTrend,
  getWorkoutPace,
  parseDistance,
  parseTimeToSeconds,
} from "@/utils/workout-utils";

export type PremiumGate = {
  locked: boolean;
  requiredTier: PremiumTier;
  title: string;
  preview: string;
  upgradeCopy: string;
};

export type PostRunFeedback = {
  title: string;
  summary: string;
  pacingNote: string;
  effortNote: string;
  nextStep: string;
  fatigueFlag: boolean;
};

export type AdaptivePlanResult = {
  plan: PlanDay[];
  summary: string;
  adjustments: string[];
  fatigueFlag: boolean;
};

export type DynamicRacePrediction = {
  eventLabel: string;
  predictedTime: string | null;
  confidenceLabel: string;
  trendLabel: string;
  trendDirection: "up" | "steady" | "caution";
  summary: string;
  explanation: string;
};

export type GoalPacingBreakdown = {
  goalTime: string;
  perMile: string;
  perKilometer: string;
  per400m: string;
};

export type WeeklyPerformanceSummary = {
  headline: string;
  summary: string;
  onTrack: boolean;
  focus: string;
  totalRuns: number;
  totalMiles: number;
  keyWorkoutsCompleted: number;
  consistencyLabel: string;
  takeaway: string;
  nextWeekSuggestion: string;
};

export type HeartRateGuidance = {
  maxHeartRate: number | null;
  sourceLabel: string;
  targetZone: { name: string; label: string; range: string; purpose: string } | null;
  zones: { name: string; label: string; range: string }[];
};

export type FuelingSuggestion = {
  headline: string;
  timingLabel: string;
  summary: string;
  suggestions: string[];
};

export type ProgressTrackingInsight = {
  headline: string;
  summary: string;
  currentWeekMiles: number;
  previousWeekMiles: number;
  changeLabel: string;
  trend: { label: string; miles: number; current: boolean }[];
};

export type BasicRacePrediction = {
  eventLabel: string;
  predictedTime: string | null;
  summary: string;
};

export type WorkoutMetricsInsight = {
  workoutLabel: string;
  averagePace: string | null;
  splitConsistency: string;
  splits: string[];
  summary: string;
};

export type GoalTrackStatus = {
  state: "on_track" | "slightly_behind" | "trending_up" | "needs_more_consistency";
  statusLabel: string;
  progressPercent: number;
  headline: string;
  summary: string;
  suggestion: string;
  trendNote: string;
  confidenceLabel: string;
};

export type AdvancedTrainingInsight = {
  headline: string;
  summary: string;
  bullets: string[];
};

function getFeatureDefinition(featureKey: PremiumFeatureKey) {
  return PREMIUM_FEATURES.find((feature) => feature.key === featureKey);
}

export function hasPremiumFeature(tier: PremiumTier, featureKey: PremiumFeatureKey) {
  const feature = getFeatureDefinition(featureKey);
  return feature ? isTierAtLeast(tier, feature.minimumTier) : false;
}

export function getPremiumGate(tier: PremiumTier, featureKey: PremiumFeatureKey): PremiumGate {
  const feature = getFeatureDefinition(featureKey);

  if (!feature) {
    return {
      locked: false,
      requiredTier: "free",
      title: "Unavailable feature",
      preview: "",
      upgradeCopy: "",
    };
  }

  return {
    locked: !hasPremiumFeature(tier, featureKey),
    requiredTier: feature.minimumTier,
    title: feature.title,
    preview: feature.preview,
    upgradeCopy:
      feature.minimumTier === "pro"
        ? "Upgrade to Pro to unlock this training tool."
        : "Upgrade to Elite to unlock coach-level guidance.",
  };
}

export function getUpgradePrompt(currentTier: PremiumTier, requiredTier: PremiumTier) {
  if (getTierRank(currentTier) >= getTierRank(requiredTier)) {
    return "";
  }

  return requiredTier === "elite"
    ? "Elite turns the app into a real running coach with adaptive training and post-run analysis."
    : "Pro unlocks the first layer of smarter coaching with heart rate, fueling, and prediction tools.";
}

export function generatePostRunFeedback({
  workout,
  previousWorkouts,
}: {
  workout: WorkoutType;
  previousWorkouts: WorkoutType[];
}): PostRunFeedback {
  const distance = parseDistance(workout.distance) ?? 0;
  const seconds = parseTimeToSeconds(workout.time);
  const pace = seconds && distance > 0 ? seconds / distance : null;
  const recentPaceValues = previousWorkouts
    .map((previousWorkout) => {
      const previousDistance = parseDistance(previousWorkout.distance);
      const previousSeconds = parseTimeToSeconds(previousWorkout.time);

      if (!previousDistance || !previousSeconds || previousDistance <= 0) {
        return null;
      }

      return previousSeconds / previousDistance;
    })
    .filter((value): value is number => value !== null);
  const recentAveragePace =
    recentPaceValues.length > 0
      ? recentPaceValues.reduce((sum, value) => sum + value, 0) / recentPaceValues.length
      : null;
  const effort = Number.isFinite(workout.effort) ? workout.effort : 0;
  const paceImproved = pace !== null && recentAveragePace !== null ? pace < recentAveragePace : null;
  const fatigueFlag = effort >= 8 || workout.type.toLowerCase().includes("long");

  return {
    title:
      effort >= 8
        ? "Strong effort, now absorb it well."
        : paceImproved
          ? "Good execution today."
          : "Solid work logged.",
    summary:
      paceImproved === true
        ? "You moved a little quicker than your recent average while still finishing the session."
        : effort >= 8
          ? "This looked like a demanding session, which makes recovery and the next easy day more important."
          : "The run adds useful volume and keeps the block moving in the right direction.",
    pacingNote:
      pace !== null
        ? recentAveragePace !== null
          ? paceImproved
            ? `Average pace beat your recent trend by ${formatDuration(Math.round(recentAveragePace - pace))} per mile.`
            : "Pacing sat close to your recent trend, which is fine if the goal was controlled work."
          : `Average pace landed at ${formatDuration(Math.round(pace))} per mile.`
        : "Add time and distance consistently to sharpen pacing feedback.",
    effortNote:
      effort >= 8
        ? "Effort was high enough that tomorrow should probably stay easy."
        : effort <= 4
          ? "Effort stayed controlled, which is exactly what easier aerobic work should feel like."
          : "Effort looked moderate and sustainable, a good sign for steady progression.",
    nextStep:
      fatigueFlag
        ? "Refuel, recover, and protect the next run from turning harder than planned."
        : "Keep stacking the week and let the next key session arrive with fresher legs.",
    fatigueFlag,
  };
}

export function buildDynamicRacePrediction(profile: ProfileType, workouts: WorkoutType[]): DynamicRacePrediction {
  const eventKey = normalizePredictorEvent(profile.goalEvent || "") ?? "5k";
  const prediction = getPredictionForEvent(eventKey, workouts, profile);
  const recentTrend = getRecentMileageTrend(workouts, new Date(), 4);
  const currentMiles = recentTrend[recentTrend.length - 1]?.miles ?? 0;
  const previousMiles = recentTrend[recentTrend.length - 2]?.miles ?? 0;
  const mileageDelta = currentMiles - previousMiles;
  const recentCompleted = workouts
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6).length;
  const trendDirection: DynamicRacePrediction["trendDirection"] =
    prediction.confidence === "High" && mileageDelta >= 1
      ? "up"
      : prediction.confidence === "Low" || recentCompleted < 3
        ? "caution"
        : "steady";
  const trendLabel =
    trendDirection === "up"
      ? "Trending up"
      : trendDirection === "steady"
        ? "Holding steady"
        : "Needs steadier input";

  return {
    eventLabel: prediction.label,
    predictedTime: prediction.predictedTime,
    confidenceLabel: `${prediction.confidence} confidence`,
    trendLabel,
    trendDirection,
    summary: prediction.predictedTime
      ? `Your ${prediction.label} projection updates from recent workouts, PR anchors, and training context.`
      : "Log more timed running to unlock a stronger race estimate.",
    explanation: prediction.predictedTime
      ? trendDirection === "up"
        ? "Recent workouts and consistency suggest your race readiness is moving in the right direction."
        : trendDirection === "steady"
          ? "Your recent training supports a stable projection, with room to improve through steadier execution."
          : "There is enough data for a projection, but the trend still needs more consistent training support."
      : "Timed workouts, recent mileage, and stronger completion history will sharpen this projection.",
  };
}

export function buildAdaptivePlanPreview({
  plan,
  workouts,
  completedWorkoutIds,
}: {
  plan: PlanDay[];
  workouts: WorkoutType[];
  completedWorkoutIds: string[];
}): AdaptivePlanResult {
  const latestWorkout = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const fatigueFlag = Boolean(latestWorkout && latestWorkout.effort >= 8);
  const missedCount = Math.max(plan.slice(0, 3).filter((day) => !completedWorkoutIds.includes(day.id)).length - 1, 0);
  const adjustments: string[] = [];

  const nextPlan = plan.map((day, index) => {
    if (index > 2) {
      return day;
    }

    if (fatigueFlag && (day.kind === "easy" || day.kind === "steady")) {
      adjustments.push(`${day.day}: keep it lighter because recent effort was high.`);
      return {
        ...day,
        details: `${day.details} Auto-adjusted lighter after a harder recent workout.`,
      };
    }

    if (missedCount > 0 && day.kind === "quality") {
      adjustments.push(`${day.day}: keep quality controlled because earlier sessions were missed.`);
      return {
        ...day,
        details: `${day.details} Auto-adjusted to protect the week after missed work.`,
      };
    }

    return day;
  });

  return {
    plan: nextPlan,
    summary:
      adjustments.length > 0
        ? "The next few days shift slightly based on completion, pace pressure, and fatigue signals."
        : "The current week stays on track because recent signals still support the plan.",
    adjustments,
    fatigueFlag,
  };
}

export function buildGoalPacingCalculator(goalTime: string, distanceMiles: number): GoalPacingBreakdown | null {
  const totalSeconds = parseTimeToSeconds(goalTime);

  if (!totalSeconds || distanceMiles <= 0) {
    return null;
  }

  const perMileSeconds = totalSeconds / distanceMiles;
  const perKilometerSeconds = totalSeconds / (distanceMiles * 1.60934);
  const per400Seconds = totalSeconds / (distanceMiles / 0.248548);

  return {
    goalTime,
    perMile: formatDuration(Math.round(perMileSeconds)),
    perKilometer: formatDuration(Math.round(perKilometerSeconds)),
    per400m: formatDuration(Math.round(per400Seconds)),
  };
}

export function buildWeeklyPerformanceSummary({
  profile,
  workouts,
  weeklyPlan,
  completedWorkoutIds,
}: {
  profile: ProfileType;
  workouts: WorkoutType[];
  weeklyPlan?: PlanDay[];
  completedWorkoutIds?: string[];
}): WeeklyPerformanceSummary {
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const thisWeekWorkouts = workouts.filter((workout) => {
    const workoutTime = new Date(workout.date).getTime();
    return workoutTime >= weekStart.getTime() && workoutTime < weekEnd.getTime();
  });
  const totalRuns = thisWeekWorkouts.length;
  const totalMiles = thisWeekWorkouts.reduce((sum, workout) => sum + (parseDistance(workout.distance) ?? 0), 0);
  const avgEffort =
    thisWeekWorkouts.length > 0
      ? thisWeekWorkouts.reduce((sum, workout) => sum + (Number.isFinite(workout.effort) ? workout.effort : 0), 0) / thisWeekWorkouts.length
      : 0;
  const targetMiles = Number.parseFloat(profile.mileage) || 20;
  const expectedRuns = Math.max(profile.preferredTrainingDays || 4, 1);
  const consistencyRatio = totalRuns / expectedRuns;
  const plannedKeyWorkouts = (weeklyPlan ?? []).filter((day) => day.kind === "quality" || day.kind === "steady" || day.kind === "long");
  const completedKeyWorkouts = plannedKeyWorkouts.length > 0
    ? plannedKeyWorkouts.filter((day) => completedWorkoutIds?.includes(day.id)).length
    : thisWeekWorkouts.filter((workout) => {
        const type = workout.type.toLowerCase();
        return type.includes("tempo") || type.includes("track") || type.includes("interval") || type.includes("long");
      }).length;
  const onTrack = totalMiles >= targetMiles * 0.65 && consistencyRatio >= 0.75 && avgEffort <= 7.8;
  const longRunCompleted = thisWeekWorkouts.some((workout) => {
    const type = workout.type.toLowerCase();
    const distance = parseDistance(workout.distance) ?? 0;
    return type.includes("long") || distance >= Math.max(targetMiles * 0.24, 7);
  });
  const consistencyLabel =
    consistencyRatio >= 0.9
      ? "Strong consistency"
      : consistencyRatio >= 0.65
        ? "Mostly consistent"
        : "Needs more rhythm";
  const keyWorkTarget = Math.max(plannedKeyWorkouts.length, longRunCompleted ? 1 : 0, 1);

  return {
    headline: onTrack ? "A strong week to build on." : consistencyRatio >= 0.75 ? "The week had useful work, but more polish would help." : "The week needs more rhythm.",
    summary: onTrack
      ? "You stayed consistent, got through the important work, and kept the week moving in a direction that supports your goal."
      : consistencyRatio >= 0.75
        ? "Mileage or key-session quality was decent, but the week still left room for a cleaner training rhythm."
        : "Missed training or uneven volume made it harder for the week to build real momentum.",
    onTrack,
    focus: onTrack
      ? "Keep easy days controlled so the next key workout lands well."
      : "Prioritize consistency and one well-executed quality day instead of chasing extra intensity.",
    totalRuns,
    totalMiles,
    keyWorkoutsCompleted: completedKeyWorkouts,
    consistencyLabel,
    takeaway: onTrack
      ? completedKeyWorkouts >= keyWorkTarget
        ? "You stayed consistent this week and completed your key work. That's a strong foundation to build on."
        : "The week still moved forward because consistency stayed solid even if every key session did not land perfectly."
      : consistencyRatio >= 0.75
        ? "Mileage was useful, but cleaner execution on the important sessions would raise the quality of the week."
        : "Missed workouts lowered consistency, so the main goal next week is getting back into a steadier rhythm.",
    nextWeekSuggestion: onTrack
      ? longRunCompleted
        ? "Let next week build from this by protecting recovery days and arriving fresher for the next quality workout."
        : "Carry this momentum forward by locking in the long run and one strong quality day next week."
      : completedKeyWorkouts === 0
        ? "Focus on completing one key workout and one longer aerobic run next week before worrying about extra volume."
        : "Aim for steadier day-to-day rhythm next week so the quality work has a stronger base underneath it.",
  };
}

export function getPlanNameForTier(tier: PremiumTier) {
  return PREMIUM_PLANS[tier].name;
}

export function buildHeartRateGuidance(profile: ProfileType, workoutLabel?: string): HeartRateGuidance {
  const parsedMax = Number.parseInt(profile.maxHeartRate, 10);
  const parsedAge = Number.parseInt(profile.age, 10);
  const maxHeartRate =
    Number.isFinite(parsedMax) && parsedMax > 0
      ? parsedMax
      : Number.isFinite(parsedAge) && parsedAge > 0
        ? 220 - parsedAge
        : null;
  const zones = maxHeartRate
    ? [
        { name: "Zone 1", label: "50-60%", range: `${Math.round(maxHeartRate * 0.5)}-${Math.round(maxHeartRate * 0.6)} bpm` },
        { name: "Zone 2", label: "60-70%", range: `${Math.round(maxHeartRate * 0.6)}-${Math.round(maxHeartRate * 0.7)} bpm` },
        { name: "Zone 3", label: "70-80%", range: `${Math.round(maxHeartRate * 0.7)}-${Math.round(maxHeartRate * 0.8)} bpm` },
        { name: "Zone 4", label: "80-90%", range: `${Math.round(maxHeartRate * 0.8)}-${Math.round(maxHeartRate * 0.9)} bpm` },
        { name: "Zone 5", label: "90-100%", range: `${Math.round(maxHeartRate * 0.9)}-${maxHeartRate} bpm` },
      ]
    : [];
  const normalizedWorkout = (workoutLabel || "").toLowerCase();
  const targetZone = zones.length === 0
    ? null
    : normalizedWorkout.includes("interval") || normalizedWorkout.includes("speed")
      ? { ...zones[3], purpose: "Push the quality without turning the full session into a race." }
      : normalizedWorkout.includes("threshold") || normalizedWorkout.includes("tempo") || normalizedWorkout.includes("steady")
        ? { ...zones[2], purpose: "Sit near controlled discomfort and keep the work repeatable." }
        : normalizedWorkout.includes("long")
          ? { ...zones[1], purpose: "Let the long run stay aerobic enough to support the rest of the week." }
          : { ...zones[1], purpose: "Keep easier work honest so recovery days actually recover you." };

  return {
    maxHeartRate,
    sourceLabel:
      Number.isFinite(parsedMax) && parsedMax > 0
        ? "Using your entered max heart rate"
        : Number.isFinite(parsedAge) && parsedAge > 0
          ? "Estimated from your age"
          : "Add age or max heart rate to personalize zones",
    targetZone,
    zones,
  };
}

export function buildFuelingSuggestion(profile: ProfileType, workouts: WorkoutType[]): FuelingSuggestion {
  const longestRecentRun = workouts.slice(0, 6).reduce((longest, workout) => {
    return Math.max(longest, parseDistance(workout.distance) ?? 0);
  }, 0);
  const nextRace = profile.raceGoals[0];
  const daysToRace = nextRace?.raceDate
    ? Math.floor((new Date(nextRace.raceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (daysToRace !== null && daysToRace >= 0 && daysToRace <= 10) {
    return {
      headline: "Race week fueling focus",
      timingLabel: `${daysToRace} day${daysToRace === 1 ? "" : "s"} to race`,
      summary: "Keep race week simple: arrive topped off, hydrated, and avoid last-minute nutrition experiments.",
      suggestions: [
        "Bias meals toward familiar carbs and keep hydration steady instead of overdoing it the night before.",
        "Use the same pre-race breakfast timing you trust in training.",
        "Dial back fiber and heavy fats in the final 24 hours if your stomach tends to be sensitive.",
      ],
    };
  }

  if (longestRecentRun >= 8) {
    return {
      headline: "Long-run fueling guidance",
      timingLabel: "For longer aerobic work",
      summary: "Support long runs with simple carbs before the run and steady fuel if the session stretches out.",
      suggestions: [
        "Aim for a carb-focused snack or meal 60-150 minutes before you head out.",
        "For runs near or beyond 90 minutes, start taking in fuel early rather than waiting for the late fade.",
        "Recover with carbs plus protein soon after finishing so the next quality day lands better.",
      ],
    };
  }

  return {
    headline: "Workout day fueling basics",
    timingLabel: "For quality sessions",
    summary: "Even shorter workouts go better when you stop treating fuel like an afterthought.",
    suggestions: [
      "Show up lightly fueled if the session is harder than easy mileage.",
      "Use fluids and electrolytes consistently on warmer days.",
      "Refuel after the session so effort stays productive instead of draining the next day too.",
    ],
  };
}

export function buildProgressTrackingInsight(workouts: WorkoutType[]): ProgressTrackingInsight {
  const trend = getRecentMileageTrend(workouts, new Date(), 4);
  const currentWeekMiles = trend[trend.length - 1]?.miles ?? 0;
  const previousWeekMiles = trend[trend.length - 2]?.miles ?? 0;
  const delta = currentWeekMiles - previousWeekMiles;

  return {
    headline:
      delta >= 2
        ? "Mileage is trending up."
        : delta <= -2
          ? "Mileage dipped from last week."
          : "Mileage is staying fairly steady.",
    summary:
      delta >= 2
        ? "You are stacking a little more volume than the week before, which is usually a good sign if effort is still under control."
        : delta <= -2
          ? "Volume backed off versus the previous week, so the next few runs matter if you want the block to keep moving."
          : "The training load is stable enough to judge fitness without overreacting to one run.",
    currentWeekMiles,
    previousWeekMiles,
    changeLabel:
      delta === 0
        ? "No change"
        : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} mi vs last week`,
    trend,
  };
}

export function buildBasicRacePrediction(profile: ProfileType, workouts: WorkoutType[]): BasicRacePrediction {
  const eventKey = normalizePredictorEvent(profile.goalEvent || "") ?? "5k";
  const prediction = getPredictionForEvent(eventKey, workouts, profile);

  return {
    eventLabel: prediction.label,
    predictedTime: prediction.predictedTime,
    summary: prediction.predictedTime
      ? `A simple baseline built from your recent running and best marks. It is meant to guide expectations, not over-coach every workout.`
      : "Log a few more timed runs to unlock a useful baseline estimate.",
  };
}

export function buildWorkoutMetricsInsight(workouts: WorkoutType[]): WorkoutMetricsInsight {
  const latestWorkout = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!latestWorkout) {
    return {
      workoutLabel: "Latest workout",
      averagePace: null,
      splitConsistency: "Waiting for more data",
      splits: [],
      summary: "Complete and log workouts with time and splits to unlock a better breakdown.",
    };
  }

  const splitValues = latestWorkout.splits
    .split(/[,\n]+/)
    .map((split) => split.trim())
    .filter(Boolean);
  const splitSeconds = splitValues
    .map((split) => parseTimeToSeconds(split))
    .filter((value): value is number => value !== null);
  const averageSplit = splitSeconds.length > 0
    ? splitSeconds.reduce((sum, value) => sum + value, 0) / splitSeconds.length
    : null;
  const maxDeviation = averageSplit === null
    ? null
    : Math.max(...splitSeconds.map((value) => Math.abs(value - averageSplit)));
  const splitConsistency =
    maxDeviation === null
      ? "Add splits for consistency analysis"
      : maxDeviation <= 4
        ? "Very steady"
        : maxDeviation <= 8
          ? "Controlled"
          : "Variable";

  return {
    workoutLabel: latestWorkout.type || "Latest run",
    averagePace: getWorkoutPace(latestWorkout.distance, latestWorkout.time),
    splitConsistency,
    splits: splitValues.slice(0, 4),
    summary:
      splitValues.length > 0
        ? "Use splits, average pace, and consistency together to tell whether the session was controlled or sloppy."
        : "Log split details to unlock stronger execution feedback on harder workouts.",
  };
}

export function buildGoalTrackStatus({
  profile,
  workouts,
}: {
  profile: ProfileType;
  workouts: WorkoutType[];
}): GoalTrackStatus {
  const raceGoal = profile.raceGoals[0];
  const eventKey = normalizePredictorEvent(raceGoal?.event || profile.goalEvent || "") ?? "5k";
  const prediction = getPredictionForEvent(eventKey, workouts, profile);
  const goalSeconds = raceGoal?.goalTime ? parseTimeToSeconds(raceGoal.goalTime) : null;
  const now = Date.now();
  const recent14DayWorkouts = workouts.filter((workout) => now - new Date(workout.date).getTime() <= 14 * 24 * 60 * 60 * 1000);
  const recent28DayWorkouts = workouts.filter((workout) => now - new Date(workout.date).getTime() <= 28 * 24 * 60 * 60 * 1000);
  const preferredDays = Math.max(profile.preferredTrainingDays || 4, 1);
  const consistencyRatio = Math.min(recent14DayWorkouts.length / Math.max(preferredDays * 2, 1), 1.2);
  const trend = getRecentMileageTrend(workouts, new Date(), 4);
  const currentWeekMiles = trend[trend.length - 1]?.miles ?? 0;
  const previousWeekMiles = trend[trend.length - 2]?.miles ?? 0;
  const mileageDelta = currentWeekMiles - previousWeekMiles;
  const daysToRace = raceGoal?.raceDate
    ? Math.floor((new Date(raceGoal.raceDate).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;
  const confidenceScore =
    (goalSeconds ? 1 : 0) +
    (prediction.predictedSeconds ? 1 : 0) +
    (recent28DayWorkouts.length >= 6 ? 1 : 0);
  const confidenceLabel = confidenceScore >= 3 ? "High confidence" : confidenceScore === 2 ? "Medium confidence" : "Low confidence";

  if (!goalSeconds || !prediction.predictedSeconds) {
    return {
      state: "needs_more_consistency",
      statusLabel: "Needs More Consistency",
      progressPercent: 54,
      headline: "Goal tracking is still warming up.",
      summary: "Add a goal time and a little more consistent training to sharpen the on-track read.",
      suggestion: "Keep logging workouts and add a goal time so Elite can give a more specific target read.",
      trendNote: recent14DayWorkouts.length > 0 ? `${recent14DayWorkouts.length} recent workouts are helping the system learn.` : "Recent training data is still thin.",
      confidenceLabel,
    };
  }

  const ratio = goalSeconds / prediction.predictedSeconds;
  const progressPercent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const strongConsistency = consistencyRatio >= 0.75;
  const moderateConsistency = consistencyRatio >= 0.55;
  const improvingTrend = mileageDelta >= 1.5 || (ratio >= 0.94 && consistencyRatio >= 0.65);
  const raceWindowTight = daysToRace !== null && daysToRace <= 28;

  if (!moderateConsistency) {
    return {
      state: "needs_more_consistency",
      statusLabel: "Needs More Consistency",
      progressPercent,
      headline: `Your ${prediction.label} goal still needs a steadier rhythm.`,
      summary: "The fitness picture is not far off, but recent consistency is too uneven to call you fully on track yet.",
      suggestion: "String together the next 10 to 14 days of planned running before worrying about chasing extra intensity.",
      trendNote: `${recent14DayWorkouts.length} workouts logged in the last 2 weeks against a ${preferredDays}-day routine.`,
      confidenceLabel,
    };
  }

  if (ratio >= 0.98 && strongConsistency) {
    return {
      state: "on_track",
      statusLabel: "On Track",
      progressPercent,
      headline: `On Track for your ${prediction.label} goal`,
      summary: "Your recent consistency and race-readiness signals are supporting steady progress toward the current target.",
      suggestion: raceWindowTight
        ? "Protect the next few key sessions and avoid turning easy days into extra work."
        : "Keep the week controlled so the next quality session lands with fresh enough legs.",
      trendNote:
        mileageDelta >= 1
          ? `Volume is still moving in the right direction at +${mileageDelta.toFixed(1)} miles versus last week.`
          : "Training load is staying steady enough to support the goal.",
      confidenceLabel,
    };
  }

  if (improvingTrend) {
    return {
      state: "trending_up",
      statusLabel: "Trending Up",
      progressPercent,
      headline: `Trending up toward your ${prediction.label} goal`,
      summary: "Recent workouts suggest improving race readiness, even if you are not fully at goal level yet.",
      suggestion: "Keep the next two weeks consistent and let the fitness rise before forcing the pace.",
      trendNote:
        mileageDelta >= 1.5
          ? `Recent mileage is up ${mileageDelta.toFixed(1)} miles from last week.`
          : "Execution is improving enough to keep the goal in play.",
      confidenceLabel,
    };
  }

  if (ratio >= 0.91) {
    return {
      state: "slightly_behind",
      statusLabel: "Slightly Behind",
      progressPercent,
      headline: `Slightly behind your ${prediction.label} target`,
      summary: "You are close enough that better consistency over the next couple of weeks can still move the trend back toward goal.",
      suggestion: "Prioritize completion and even pacing before trying to squeeze in more work.",
      trendNote:
        daysToRace !== null && daysToRace > 0
          ? `${daysToRace} days until race day, so the next 1 to 2 weeks matter more than any single workout.`
          : "The trend is close enough that small improvements can still shift the picture.",
      confidenceLabel,
    };
  }

  return {
    state: "needs_more_consistency",
    statusLabel: "Needs More Consistency",
    progressPercent,
    headline: `Your ${prediction.label} goal needs more support`,
    summary: "Right now the trend suggests the goal is ambitious unless the next block becomes more consistent and better controlled.",
    suggestion: "Stack easier wins first: complete the week, keep effort honest, and rebuild momentum before pushing harder.",
    trendNote:
      mileageDelta < 0
        ? `Mileage is down ${Math.abs(mileageDelta).toFixed(1)} miles from last week.`
        : "Recent training has not been consistent enough to support the current target pace yet.",
    confidenceLabel,
  };
}

export function buildAdvancedTrainingInsight({
  profile,
  workouts,
}: {
  profile: ProfileType;
  workouts: WorkoutType[];
}): AdvancedTrainingInsight {
  const trend = getRecentMileageTrend(workouts, new Date(), 4);
  const avgPace = getAveragePace(workouts.slice(0, 6));
  const recentEffort = workouts
    .slice(0, 4)
    .map((workout) => workout.effort)
    .filter((effort) => Number.isFinite(effort));
  const averageRecentEffort =
    recentEffort.length > 0 ? recentEffort.reduce((sum, effort) => sum + effort, 0) / recentEffort.length : null;
  const latestMiles = trend[trend.length - 1]?.miles ?? 0;
  const goalMiles = Number.parseFloat(profile.mileage) || 20;

  return {
    headline: "The coaching layer is looking at more than one signal.",
    summary: "Elite combines workload, effort, pace trend, and goal context so the guidance feels more like a coach reading the whole block.",
    bullets: [
      `Recent weekly load is ${latestMiles.toFixed(1)} miles against a ${goalMiles.toFixed(0)} mile target.`,
      avgPace ? `Recent average pace is sitting around ${avgPace}.` : "Log more timed runs to strengthen pace trend analysis.",
      averageRecentEffort !== null
        ? `Recent effort is averaging ${averageRecentEffort.toFixed(1)} out of 10, which shapes how aggressively the next week should progress.`
        : "Add effort ratings consistently so adaptive guidance can read fatigue better.",
    ],
  };
}
