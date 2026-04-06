import type { WorkoutType } from "@/contexts/workout-context";
import type { ProfileType } from "@/contexts/profile-context";
import type { PlanDay } from "@/lib/training-plan";
import { parseDistance, parseTimeToSeconds, startOfWeek } from "@/utils/workout-utils";

export type AdaptiveTrainingStatus = "increase" | "hold" | "reduce";

export type AdaptiveTrainingResult = {
  status: AdaptiveTrainingStatus;
  summary: string;
  reason: string;
  suggestion: string;
};

export type AdaptiveTrainingInput = {
  profile: Pick<ProfileType, "pr5k">;
  workouts: WorkoutType[];
  plannedWorkouts: PlanDay[];
  completedWorkoutIds: string[];
  skippedWorkoutIds: string[];
  referenceDate?: Date;
};

export function evaluateAdaptiveTraining(input: AdaptiveTrainingInput): AdaptiveTrainingResult {
  const referenceDate = input.referenceDate ?? new Date();
  const weekStart = startOfWeek(referenceDate);
  const plannedWorkouts = input.plannedWorkouts.filter((day) => day.kind !== "rest");
  const plannedCount = plannedWorkouts.length;
  const completedCount = input.completedWorkoutIds.filter((id) => plannedWorkouts.some((day) => day.id === id)).length;
  const skippedCount = input.skippedWorkoutIds.filter((id) => plannedWorkouts.some((day) => day.id === id)).length;
  const thisWeekWorkouts = input.workouts.filter((workout) => new Date(workout.date).getTime() >= weekStart.getTime());
  const completionRate = plannedCount > 0 ? completedCount / plannedCount : 0;
  const paceChecks = thisWeekWorkouts
    .map((workout) => buildPaceCheck(workout, input.profile.pr5k))
    .filter((value): value is { hit: boolean } => value !== null);
  const paceHitRate =
    paceChecks.length > 0 ? paceChecks.filter((check) => check.hit).length / paceChecks.length : 0.5;
  const averageEffort =
    thisWeekWorkouts.length > 0
      ? thisWeekWorkouts.reduce((sum, workout) => sum + (Number.isFinite(workout.effort) ? workout.effort : 0), 0) /
        thisWeekWorkouts.length
      : null;
  const fatigueSignals = thisWeekWorkouts.filter((workout) => {
    const note = workout.notes.trim().toLowerCase();
    return note.includes("tired") || note.includes("fatigue") || note.includes("heavy");
  }).length;

  if (
    plannedCount > 0 &&
    completionRate >= 0.75 &&
    skippedCount === 0 &&
    paceHitRate >= 0.6 &&
    (averageEffort === null || averageEffort <= 7.5)
  ) {
    return {
      status: "increase",
      summary: "You handled this week well. Slightly increasing next week's workload.",
      reason: "Most planned sessions were completed and your recent pace execution stayed at or ahead of target.",
      suggestion: "Keep the next block controlled and let the extra work show up as a small progression, not a jump.",
    };
  }

  if (
    skippedCount >= 2 ||
    completionRate < 0.5 ||
    (paceChecks.length >= 2 && paceHitRate < 0.35) ||
    (averageEffort !== null && averageEffort >= 8 && fatigueSignals > 0)
  ) {
    return {
      status: "reduce",
      summary: "Recent fatigue detected. Easing next week's intensity slightly.",
      reason: "Multiple missed or slower sessions suggest recovery and consistency need a little more room right now.",
      suggestion: "Back off the next quality session a touch, protect the easy days, and rebuild rhythm before progressing again.",
    };
  }

  return {
    status: "hold",
    summary: "Consistency is solid. Keeping your training progression steady.",
    reason: "The week showed enough good work to stay on course, but not enough clean signals to push the load higher yet.",
    suggestion: "Aim for one more complete, controlled week and let consistency earn the next increase.",
  };
}

function buildPaceCheck(workout: WorkoutType, pr5k: string) {
  const distance = parseDistance(workout.distance);
  const totalSeconds = parseTimeToSeconds(workout.time);

  if (!distance || !totalSeconds || distance <= 0) {
    return null;
  }

  const actualSecondsPerMile = totalSeconds / distance;
  const targetSecondsPerMile = estimateTargetSecondsPerMile(workout, pr5k);
  const tolerance =
    workout.type.toLowerCase().includes("easy") || workout.type.toLowerCase().includes("recovery") ? 20 : 12;

  return {
    hit: actualSecondsPerMile <= targetSecondsPerMile + tolerance,
  };
}

function estimateTargetSecondsPerMile(workout: WorkoutType, pr5k: string) {
  const fiveKPace = getFiveKPacePerMile(pr5k);
  const context = `${workout.type} ${workout.notes}`.toLowerCase();

  if (context.includes("track") || context.includes("interval")) {
    return fiveKPace - 8;
  }

  if (context.includes("tempo") || context.includes("threshold")) {
    return fiveKPace + 18;
  }

  if (context.includes("long")) {
    return fiveKPace + 60;
  }

  if (context.includes("steady") || context.includes("aerobic")) {
    return fiveKPace + 40;
  }

  return fiveKPace + 85;
}

function getFiveKPacePerMile(pr5k: string) {
  const prSeconds = parseTimeToSeconds(pr5k);

  if (!prSeconds) {
    return 8 * 60;
  }

  return prSeconds / 3.10686;
}
