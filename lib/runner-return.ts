import type { ProfileType } from "@/contexts/profile-context";
import type { WorkoutType } from "@/contexts/workout-context";
import type { PlanDay } from "@/lib/training-plan";
import { getRaceCountdownSummary, getRetentionStreakSummary } from "@/lib/runner-retention";
import { getTodayWorkout, getWorkoutTypeLabel } from "@/lib/today-workout";
import { parseDistance } from "@/utils/workout-utils";

export type MiniAchievement = {
  title: string;
  detail: string;
  tone: "progress" | "milestone" | "consistency";
};

export type CoachInsightCard = {
  eyebrow: string;
  title: string;
  detail: string;
};

export function getTomorrowPreview(plan: PlanDay[], completedWorkoutIds: string[], referenceDate = new Date()) {
  return getTodayWorkout(plan, completedWorkoutIds, referenceDate).nextWorkout;
}

export function getMiniAchievements(workouts: WorkoutType[], referenceDate = new Date()): MiniAchievement[] {
  if (workouts.length === 0) {
    return [];
  }

  const sorted = [...workouts].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  const newest = sorted[sorted.length - 1];
  const first = sorted[0];
  const longestRun = sorted.reduce(
    (best, workout) => {
      const miles = parseDistance(workout.distance) ?? 0;
      return miles > best.miles ? { miles, workout } : best;
    },
    { miles: 0, workout: null as WorkoutType | null }
  );
  const streak = getRetentionStreakSummary(workouts, referenceDate);

  const achievements: MiniAchievement[] = [];

  if (sorted.length === 1) {
    achievements.push({
      title: "First run logged",
      detail: `${first.type || "Run"} saved. That is enough to start building momentum here.`,
      tone: "milestone",
    });
  }

  if (streak.current >= 2) {
    achievements.push({
      title: `${streak.current}-day streak started`,
      detail: streak.current >= 5 ? "Consistency is turning into real rhythm." : "A simple next run keeps the streak alive.",
      tone: "consistency",
    });
  }

  if (longestRun.workout && longestRun.miles > 0) {
    const isRecentLongest = newest.id === longestRun.workout.id;
    achievements.push({
      title: isRecentLongest ? "Longest run yet" : "Longest recent run",
      detail: `${longestRun.miles.toFixed(longestRun.miles % 1 === 0 ? 0 : 1)} miles${isRecentLongest ? " on your latest save." : " is already in the bank."}`,
      tone: "progress",
    });
  }

  if (achievements.length === 0) {
    achievements.push({
      title: "Progress is starting to build",
      detail: "A few more saved runs will unlock stronger streak, pace, and goal signals.",
      tone: "progress",
    });
  }

  return achievements.slice(0, 3);
}

export function getCoachInsightOfTheDay(
  profile: ProfileType,
  workouts: WorkoutType[],
  plan: PlanDay[],
  completedWorkoutIds: string[],
  referenceDate = new Date()
): CoachInsightCard {
  const latestWorkout = [...workouts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0] ?? null;
  const tomorrowWorkout = getTomorrowPreview(plan, completedWorkoutIds, referenceDate);
  const race = getRaceCountdownSummary(profile, workouts, referenceDate);
  const streak = getRetentionStreakSummary(workouts, referenceDate);

  if (latestWorkout?.reflectionFeel === "rough" || latestWorkout?.expectation === "harder") {
    return {
      eyebrow: "Coach insight",
      title: "Recent effort ran high",
      detail: "Keep the next run controlled and trust effort more than pace if your legs still feel flat.",
    };
  }

  if (tomorrowWorkout) {
    return {
      eyebrow: "Tomorrow",
      title: `${getWorkoutTypeLabel(tomorrowWorkout)} is next`,
      detail: `${tomorrowWorkout.details} Keep tomorrow pointed at the purpose, not at extra pace.`,
    };
  }

  if (race.status !== "none") {
    return {
      eyebrow: "Goal watch",
      title: race.countdownLabel,
      detail: race.progressLabel,
    };
  }

  if (streak.current >= 3) {
    return {
      eyebrow: "Momentum",
      title: "Consistency is helping more than intensity",
      detail: "The best next move is another controlled run that keeps the week building.",
    };
  }

  return {
    eyebrow: "Coach insight",
    title: "Simple training usually wins",
    detail: "Stay close to the plan, keep easy days easy, and let the next few runs create the signal.",
  };
}

export function getRacePredictorHighlight(profile: ProfileType, workouts: WorkoutType[], referenceDate = new Date()) {
  const race = getRaceCountdownSummary(profile, workouts, referenceDate);

  if (race.status === "none") {
    return {
      title: "See what your current fitness points to",
      detail: "Use the race predictor to turn your recent running into a realistic target.",
      cta: "Open predictor",
    };
  }

  return {
    title: race.countdownLabel,
    detail: `${race.event}${race.goalTime ? ` · Goal ${race.goalTime}` : ""}. ${race.progressLabel}`,
    cta: "Check predictor",
  };
}

export function getReflectionSummary(workout: WorkoutType | null) {
  if (!workout?.reflectionFeel && !workout?.expectation) {
    return null;
  }

  const feel =
    workout.reflectionFeel === "great"
      ? "felt strong"
      : workout.reflectionFeel === "solid"
        ? "felt controlled"
        : workout.reflectionFeel === "flat"
          ? "felt a little flat"
          : workout.reflectionFeel === "rough"
            ? "felt rough"
            : null;
  const expectation =
    workout.expectation === "easier"
      ? "was easier than expected"
      : workout.expectation === "harder"
        ? "was harder than expected"
        : workout.expectation === "as_expected"
          ? "felt about as expected"
          : null;

  return [feel, expectation].filter(Boolean).join(" and ");
}
