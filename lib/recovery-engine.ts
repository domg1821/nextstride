import type { FatigueLevel, EngineRecord } from "@/contexts/engine-context";
import type { WorkoutType } from "@/contexts/workout-context";
import { getFuelingStatusForRecovery } from "@/lib/fueling-tracker";
import type { PlanDay } from "@/lib/training-plan";
import { getFuelingStrategyForWorkout } from "@/lib/fueling-guidance";
import { getSleepScoreValue } from "@/lib/engine-insights";

export type RecoveryStatus = "high" | "moderate" | "low";
export type RecoveryAdjustmentLevel = "push" | "maintain" | "ease_off";
export type RecoveryMetricKey = "sleep" | "heart-rate" | "fueling" | "fatigue";

export type RecoveryMetric = {
  key: RecoveryMetricKey;
  label: string;
  shortLabel: string;
  score: number;
  status: string;
  value: string;
  detail: string;
};

export type RecoveryState = {
  status: RecoveryStatus;
  title: string;
  score: number;
  percent: number;
  explanation: string;
  factors: string[];
  recommendation: string;
  adjustment: {
    level: RecoveryAdjustmentLevel;
    title: string;
    explanation: string;
  };
  metrics: RecoveryMetric[];
  trend: number[];
};

export type WorkoutAdjustment = {
  adjustmentRecommended: boolean;
  title: string;
  reason: string;
  paceAdjustment: string;
  effortAdjustment: string;
  sessionRecommendation: string;
  skipExtras: boolean;
};

export type WorkoutStructure = {
  warmup: string[];
  main: string[];
  cooldown: string[];
  postRun: string[];
};

const RECOVERY_WEIGHTS = {
  sleep: 0.4,
  heartRate: 0.3,
  fueling: 0.2,
  fatigue: 0.1,
} as const;

export function getUnifiedRecoveryState(engine: EngineRecord, workouts: WorkoutType[]): RecoveryState {
  const latestWorkout = [...workouts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0] ?? null;
  const sleepScore = getSleepScoreValue(engine);
  const fuelingStatus = getFuelingStatusForRecovery(engine, workouts);
  const sleepPercent = sleepScore ?? 62;
  const heartRatePercent = getHeartRatePercent(engine);
  const fuelingPercent = getFuelingPercent(fuelingStatus);
  const fatiguePercent = getFatiguePercent(engine.fatigueLevel);
  const weightedPercent = Math.round(
    sleepPercent * RECOVERY_WEIGHTS.sleep +
      heartRatePercent * RECOVERY_WEIGHTS.heartRate +
      fuelingPercent * RECOVERY_WEIGHTS.fueling +
      fatiguePercent * RECOVERY_WEIGHTS.fatigue
  );
  const strainModifier = getRecentStrainModifier(latestWorkout);
  const percent = clamp(Math.round(weightedPercent + strainModifier), 0, 100);
  const score = Number((percent / 10).toFixed(1));
  const status: RecoveryStatus = percent >= 75 ? "high" : percent >= 50 ? "moderate" : "low";

  const metrics: RecoveryMetric[] = [
    {
      key: "sleep",
      label: "Sleep",
      shortLabel: getSleepStatusLabel(sleepPercent),
      score: sleepPercent,
      status: getSleepStatusLabel(sleepPercent),
      value: sleepScore !== null ? `${sleepScore}/100` : "Not logged",
      detail: sleepScore !== null ? `${sleepScore}/100 sleep score` : "Add sleep for a sharper read",
    },
    {
      key: "heart-rate",
      label: "Heart Rate",
      shortLabel: engine.heartRateTrend === "stable" ? "Normal" : engine.heartRateTrend === "slightly_up" ? "Elevated" : "High",
      score: heartRatePercent,
      status: engine.heartRateTrend === "stable" ? "normal" : engine.heartRateTrend === "slightly_up" ? "elevated" : "high",
      value: engine.restingHr ? `${engine.restingHr} bpm` : "Trend only",
      detail:
        engine.heartRateTrend === "stable"
          ? "Resting HR looks normal"
          : engine.heartRateTrend === "slightly_up"
            ? "Resting HR is slightly elevated"
            : "Resting HR is elevated",
    },
    {
      key: "fueling",
      label: "Fueling",
      shortLabel: fuelingStatus === "solid" ? "Good" : fuelingStatus === "mixed" ? "Okay" : "Low",
      score: fuelingPercent,
      status: fuelingStatus === "solid" ? "good" : fuelingStatus === "mixed" ? "okay" : "low",
      value: fuelingStatus === "solid" ? "Supporting" : fuelingStatus === "mixed" ? "Mixed" : "Behind",
      detail:
        fuelingStatus === "solid"
          ? "Fueling is supporting recovery"
          : fuelingStatus === "mixed"
            ? "Fueling is workable but uneven"
            : "Fueling is limiting recovery",
    },
    {
      key: "fatigue",
      label: "Fatigue",
      shortLabel: engine.fatigueLevel === "fresh" ? "Fresh" : engine.fatigueLevel === "steady" ? "Manageable" : "Heavy",
      score: fatiguePercent,
      status: engine.fatigueLevel === "fresh" ? "fresh" : engine.fatigueLevel === "steady" ? "steady" : "heavy",
      value: engine.fatigueLevel === "fresh" ? "Fresh" : engine.fatigueLevel === "steady" ? "Manageable" : "Heavy",
      detail:
        engine.fatigueLevel === "fresh"
          ? "You feel fresh"
          : engine.fatigueLevel === "steady"
            ? "Fatigue is manageable"
            : "Fatigue is noticeable",
    },
  ];

  const factors = [
    `Sleep: ${metrics[0].shortLabel.toLowerCase()}`,
    `Heart Rate: ${metrics[1].shortLabel.toLowerCase()}`,
    `Fueling: ${metrics[2].shortLabel.toLowerCase()}`,
  ];

  const adjustment =
    status === "high"
      ? {
          level: "push" as const,
          title: "Push",
          explanation:
            strainModifier < 0
              ? "The core signals are strong, but keep the first part of the workout measured because recent strain is still present."
              : "Your recovery signals are supportive. You can train normally and let the planned session be specific.",
        }
      : status === "moderate"
        ? {
            level: "maintain" as const,
            title: "Maintain",
            explanation:
              "Readiness is workable, but not perfect. Hold the planned session together by starting controlled and resisting unnecessary pressure.",
          }
        : {
            level: "ease_off" as const,
            title: "Ease Off",
            explanation:
              "Recovery is not giving a strong green light today. Favor effort over pace and give the body a better chance to absorb the week.",
          };

  const recommendation =
    adjustment.level === "push"
      ? "Recovery is supporting the full session today."
      : adjustment.level === "maintain"
        ? "Recovery is decent, but the smarter move is to keep the early part of the workout controlled."
        : "Recovery is limiting the day, so effort-based running and a lighter session are the better call.";

  return {
    status,
    title: status === "high" ? "High" : status === "moderate" ? "Moderate" : "Low",
    score,
    percent,
    explanation: factors.join(", "),
    factors,
    recommendation,
    adjustment,
    metrics,
    trend: buildRecoveryTrend(percent, workouts),
  };
}

export function getWorkoutAdjustment(workout: PlanDay | null, recovery: RecoveryState): WorkoutAdjustment {
  if (!workout) {
    return {
      adjustmentRecommended: false,
      title: "No workout loaded",
      reason: "There is no scheduled session to adjust.",
      paceAdjustment: "No pace adjustment needed.",
      effortAdjustment: "No effort adjustment needed.",
      sessionRecommendation: "Use the day normally or open the weekly plan.",
      skipExtras: false,
    };
  }

  if (recovery.adjustment.level === "push") {
    return {
      adjustmentRecommended: false,
      title: "Push",
      reason: `${recovery.explanation}. Your recovery signals support the planned session.`,
      paceAdjustment: "Use the planned pace guidance.",
      effortAdjustment: "Use the planned effort target.",
      sessionRecommendation: "Complete the full session including post-run support work if time allows.",
      skipExtras: false,
    };
  }

  if (recovery.adjustment.level === "maintain") {
    return {
      adjustmentRecommended: true,
      title: "Maintain",
      reason: `${recovery.explanation}. Recovery is decent, but the day should start more conservatively.`,
      paceAdjustment:
        workout.category === "intervals" || workout.category === "threshold"
          ? "Back off the opening reps or first block slightly and build into rhythm."
          : "Run the easier side of the suggested pace range.",
      effortAdjustment: "Stay about one notch more controlled than the normal target if the body feels heavy.",
      sessionRecommendation:
        workout.category === "long"
          ? "Keep the long run steady and skip any planned fast finish if it does not come naturally."
          : "Complete the session, but keep it smoother than aggressive.",
      skipExtras: true,
    };
  }

  return {
    adjustmentRecommended: true,
    title: "Ease off",
    reason: `${recovery.explanation}. The body is not giving a strong enough green light for full pressure today.`,
    paceAdjustment:
      workout.category === "recovery" || workout.category === "easy" || workout.category === "rest"
        ? "Ignore pace and keep the run fully conversational."
        : "Run by effort instead of pace and be willing to shorten the quality portion.",
    effortAdjustment: "Treat the day like a lower-pressure effort and stop chasing the normal top-end target.",
    sessionRecommendation:
      workout.category === "intervals" || workout.category === "threshold"
        ? "Consider converting the session to a controlled aerobic run if the body does not improve after the warm-up."
        : "Keep the run short, relaxed, and focused on getting through the day well.",
    skipExtras: true,
  };
}

export function getWorkoutStructure(workout: PlanDay | null, recovery: RecoveryState): WorkoutStructure {
  if (!workout) {
    return {
      warmup: ["Easy movement only if it helps you feel better."],
      main: ["No scheduled session today."],
      cooldown: ["Move on with the day normally."],
      postRun: ["Optional mobility if it helps."],
    };
  }

  const baseWarmup =
    workout.category === "intervals" || workout.category === "threshold"
      ? ["10-15 min easy running", "Light drills or strides if legs feel good"]
      : ["5-10 min relaxed start", "Let effort settle before judging the day"];
  const baseCooldown =
    workout.category === "rest"
      ? ["No formal cooldown needed"]
      : ["5-10 min easy cooldown", "Easy breathing and relaxed stride on the finish"];
  const basePostRun =
    recovery.adjustment.level === "ease_off"
      ? ["Skip extra work and focus on food, fluids, and easy mobility only"]
      : recovery.adjustment.level === "maintain"
        ? ["Short mobility only if time allows", "Keep any extra core work brief"]
        : ["5-10 min mobility", "Optional short core routine if you still feel good"];

  if (workout.category === "long") {
    return {
      warmup: baseWarmup,
      main: [
        `${workout.distance} mi long run at steady aerobic effort`,
        recovery.adjustment.level === "ease_off"
          ? "Keep the whole run smooth and shorten it if the body stays flat"
          : "Settle in early and only progress if the body feels good",
      ],
      cooldown: baseCooldown,
      postRun: basePostRun,
    };
  }

  if (workout.category === "intervals" || workout.category === "threshold") {
    return {
      warmup: baseWarmup,
      main: [
        workout.title,
        recovery.adjustment.level === "ease_off"
          ? "Reduce the main set or turn it into steady aerobic running if rhythm never arrives"
          : recovery.adjustment.level === "maintain"
            ? "Keep the first reps smooth and cut the session short if strain rises early"
            : "Complete the planned main set",
      ],
      cooldown: baseCooldown,
      postRun: basePostRun,
    };
  }

  return {
    warmup: baseWarmup,
    main: [
      `${workout.distance > 0 ? `${workout.distance} mi` : "Easy"} ${workout.logType.toLowerCase()}`,
      recovery.adjustment.level === "ease_off"
        ? "Keep it relaxed and finish feeling better than you started"
        : "Follow the planned purpose of the run",
    ],
    cooldown: baseCooldown,
    postRun: basePostRun,
  };
}

export function getRecoveryFuelingConnection(workout: PlanDay | null, recovery: RecoveryState) {
  const fueling = getFuelingStrategyForWorkout(workout);

  if (recovery.adjustment.level === "push") {
    return `Fueling is supporting recovery well. ${fueling.after}`;
  }

  if (recovery.adjustment.level === "maintain") {
    return `A cleaner pre-run or post-run carb choice could help recovery. ${fueling.before}`;
  }

  return `Recovery would benefit from simpler fueling support. ${fueling.after}`;
}

function getHeartRatePercent(engine: EngineRecord) {
  if (!engine.restingHr) {
    return engine.heartRateTrend === "stable" ? 74 : engine.heartRateTrend === "slightly_up" ? 58 : 38;
  }

  return engine.heartRateTrend === "stable" ? 88 : engine.heartRateTrend === "slightly_up" ? 62 : 34;
}

function getFuelingPercent(status: "solid" | "mixed" | "low") {
  return status === "solid" ? 86 : status === "mixed" ? 62 : 30;
}

function getFatiguePercent(level: FatigueLevel) {
  return level === "fresh" ? 88 : level === "steady" ? 64 : 28;
}

function getSleepStatusLabel(score: number) {
  if (score >= 80) {
    return "Good";
  }

  if (score >= 60) {
    return "Okay";
  }

  return "Low";
}

function getRecentStrainModifier(workout: WorkoutType | null) {
  if (!workout) {
    return 0;
  }

  const daysSince = Math.floor((Date.now() - new Date(workout.date).getTime()) / 86400000);

  if (daysSince > 3) {
    return 0;
  }

  if (workout.reflectionFeel === "rough" || workout.expectation === "harder") {
    return -6;
  }

  if (workout.reflectionFeel === "great" || workout.expectation === "easier") {
    return 4;
  }

  return 0;
}

function buildRecoveryTrend(currentPercent: number, workouts: WorkoutType[]) {
  const trend = Array.from({ length: 7 }, () => currentPercent);
  const recentWorkouts = [...workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 7);

  for (let dayIndex = 0; dayIndex < trend.length; dayIndex += 1) {
    const drift = (dayIndex - 3) * 2;
    let nextValue = currentPercent + drift;

    recentWorkouts.forEach((workout) => {
      const workoutDayIndex = 6 - Math.min(6, Math.max(0, Math.floor((Date.now() - new Date(workout.date).getTime()) / 86400000)));

      if (workoutDayIndex !== dayIndex) {
        return;
      }

      if (workout.reflectionFeel === "rough" || workout.expectation === "harder") {
        nextValue -= 8;
      } else if (workout.reflectionFeel === "great" || workout.expectation === "easier") {
        nextValue += 4;
      } else {
        nextValue -= 2;
      }
    });

    trend[dayIndex] = clamp(Math.round(nextValue), 24, 96);
  }

  return trend;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
