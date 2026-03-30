import type { ProfileType, RaceGoalType } from "@/contexts/profile-context";
import {
  buildAdaptiveWeeklyPlan,
  buildWeeklyPlan,
  type PlanDay,
  type WorkoutPreferenceCategory,
} from "@/lib/training-plan";
import type { PlannedWorkoutOverride, WorkoutType } from "@/contexts/workout-context";
import {
  formatDuration,
  formatPace,
  getAveragePace,
  getAverageEffort,
  getDashboardStats,
  getDayKey,
  getRecentMileageTrend,
  getStreakSummary,
  getWeeklySummary,
  parseDistance,
  parseTimeToSeconds,
  startOfMonth,
  startOfWeek,
} from "@/utils/workout-utils";

export type CalendarPlanDay = PlanDay & {
  date: Date;
  dateKey: string;
  workouts: WorkoutType[];
  completed: boolean;
  skipped: boolean;
  dayNote?: string;
  isToday: boolean;
  isFuture: boolean;
  source: "adaptive" | "generated" | "manual";
};

export type WeeklyGoalProgress = {
  currentMiles: number;
  goalMiles: number;
  progressPercent: number;
  remainingMiles: number;
};

export type DashboardInsight = {
  title: string;
  tone: "up" | "steady" | "caution";
};

export type GoalProgressSummary = {
  status: "on-track" | "needs-work" | "upcoming";
  countdownLabel: string;
  progressLabel: string;
  detail: string;
};

export type CoachRecommendation = {
  title: string;
  detail: string;
};

export type WorkoutFeedback = {
  title: string;
  detail: string;
};

const MANUAL_WORKOUT_LIBRARY: (
  Omit<PlannedWorkoutOverride, "id" | "dateKey"> & { key: string }
)[] = [
  {
    key: "easy",
    title: "Easy Run",
    logType: "Easy Run",
    kind: "easy",
    category: "easy",
    distance: 4,
    details: "Keep this one comfortable and conversational from the first minute.",
  },
  {
    key: "tempo",
    title: "Tempo Workout",
    logType: "Tempo Workout",
    kind: "steady",
    category: "threshold",
    distance: 5,
    details: "Run smooth and controlled at a tempo effort, not an all-out race effort.",
  },
  {
    key: "long",
    title: "Long Run",
    logType: "Long Run",
    kind: "long",
    category: "long",
    distance: 8,
    details: "Settle in aerobically and focus on steady rhythm over hero pacing.",
  },
  {
    key: "recovery",
    title: "Recovery Run",
    logType: "Recovery Run",
    kind: "recovery",
    category: "recovery",
    distance: 3,
    details: "Short, light, and relaxed so your legs absorb the harder work around it.",
  },
  {
    key: "rest",
    title: "Rest Day",
    logType: "Rest",
    kind: "rest",
    category: "rest",
    distance: 0,
    details: "Take the day off or keep movement limited to light mobility.",
  },
];

export function listManualWorkoutLibrary() {
  return MANUAL_WORKOUT_LIBRARY;
}

export function getWeeklyGoalProgress(
  workouts: WorkoutType[],
  weeklyGoalMiles: number,
  referenceDate = new Date()
): WeeklyGoalProgress {
  const summary = getWeeklySummary(workouts, referenceDate);
  const goalMiles = Math.max(weeklyGoalMiles, 1);
  const progressPercent = Math.min((summary.totalMiles / goalMiles) * 100, 100);

  return {
    currentMiles: summary.totalMiles,
    goalMiles,
    progressPercent,
    remainingMiles: Math.max(goalMiles - summary.totalMiles, 0),
  };
}

export function getMonthlyMileage(workouts: WorkoutType[], referenceDate = new Date()) {
  const monthStart = startOfMonth(referenceDate);

  return workouts.reduce((sum, workout) => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= monthStart ? sum + (parseDistance(workout.distance) ?? 0) : sum;
  }, 0);
}

export function getTotalMiles(workouts: WorkoutType[]) {
  return workouts.reduce((sum, workout) => sum + (parseDistance(workout.distance) ?? 0), 0);
}

export function getLongestRun(workouts: WorkoutType[]) {
  return workouts.reduce((longest, workout) => {
    return Math.max(longest, parseDistance(workout.distance) ?? 0);
  }, 0);
}

export function getInsightsSummary(
  workouts: WorkoutType[],
  weeklyGoalMiles: number,
  referenceDate = new Date()
): DashboardInsight[] {
  if (workouts.length === 0) {
    return [
      {
        title: "Log a run to unlock personalized insight.",
        tone: "steady",
      },
    ];
  }

  const weekly = getWeeklySummary(workouts, referenceDate);
  const trend = getRecentMileageTrend(workouts, referenceDate, 4);
  const lastFourAverage =
    trend.reduce((sum, point) => sum + point.miles, 0) / Math.max(trend.length, 1);
  const priorAverage =
    trend.slice(0, -1).reduce((sum, point) => sum + point.miles, 0) /
    Math.max(trend.length - 1, 1);
  const streak = getStreakSummary(workouts.map((workout) => workout.date), referenceDate);
  const insights: DashboardInsight[] = [];

  if (trend.length >= 2 && trend[trend.length - 1].miles > priorAverage) {
    insights.push({
      title: "You're trending upward this month.",
      tone: "up",
    });
  }

  if ((weekly.averageEffort ?? 0) >= 7) {
    insights.push({
      title: "Your effort has been high this week, so a lighter day could help.",
      tone: "caution",
    });
  }

  if (streak.current >= 3 || weekly.workoutsCompleted >= 4) {
    insights.push({
      title: "Nice consistency over the last 7 days.",
      tone: "up",
    });
  }

  if (weekly.totalMiles >= weeklyGoalMiles * 0.8) {
    insights.push({
      title: `${Math.round((weekly.totalMiles / Math.max(weeklyGoalMiles, 1)) * 100)}% of weekly goal already logged.`,
      tone: "up",
    });
  } else if (lastFourAverage < weeklyGoalMiles * 0.7) {
    insights.push({
      title: "Your recent volume is lighter than your goal, so keep the next few runs steady.",
      tone: "steady",
    });
  }

  return insights.slice(0, 3);
}

export function getMonthlyTrend(workouts: WorkoutType[], referenceDate = new Date(), months = 4) {
  const currentMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

  return Array.from({ length: months }, (_, index) => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (months - 1 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const miles = workouts.reduce((sum, workout) => {
      const workoutDate = new Date(workout.date);

      if (workoutDate >= start && workoutDate < end) {
        return sum + (parseDistance(workout.distance) ?? 0);
      }

      return sum;
    }, 0);

    return {
      label: start.toLocaleDateString(undefined, { month: "short" }),
      miles,
      current: index === months - 1,
    };
  });
}

export function buildLongRangePlan(params: {
  profile: Pick<ProfileType, "goalEvent" | "mileage" | "pr5k" | "runnerLevel" | "preferredTrainingDays">;
  workouts: WorkoutType[];
  likedWorkoutCategories: WorkoutPreferenceCategory[];
  completedWorkoutIds: string[];
  skippedWorkoutIds?: string[];
  planDayNotes?: Record<string, string>;
  planCycle: number;
  plannedOverrides: Record<string, PlannedWorkoutOverride>;
  referenceDate?: Date;
  weeksToBuild?: number;
}) {
  const referenceDate = params.referenceDate ?? new Date();
  const todayKey = getDayKey(referenceDate.toISOString());
  const workoutsByDayKey = params.workouts.reduce<Record<string, WorkoutType[]>>((accumulator, workout) => {
    const key = getDayKey(workout.date);
    accumulator[key] = accumulator[key] ? [...accumulator[key], workout] : [workout];
    return accumulator;
  }, {});
  const days: CalendarPlanDay[] = [];

  for (let offset = 0; offset < (params.weeksToBuild ?? 12); offset += 1) {
    const cycle = params.planCycle + offset;
    const weeklyPlan =
      offset === 0
        ? buildAdaptiveWeeklyPlan(
            params.profile.goalEvent || "",
            params.profile.mileage || "30",
            params.profile.pr5k || "",
            params.likedWorkoutCategories,
            cycle,
            {
              runnerLevel: params.profile.runnerLevel,
              preferredTrainingDays: params.profile.preferredTrainingDays,
            },
            {
              workouts: params.workouts.map((workout) => ({
                date: workout.date,
                effort: workout.effort,
                notes: workout.notes,
                distance: workout.distance,
              })),
              completedWorkoutIds: params.completedWorkoutIds,
              referenceDate,
            }
          ).plan
        : buildWeeklyPlan(
            params.profile.goalEvent || "",
            params.profile.mileage || "30",
            params.profile.pr5k || "",
            params.likedWorkoutCategories,
            cycle,
            {
              runnerLevel: params.profile.runnerLevel,
              preferredTrainingDays: params.profile.preferredTrainingDays,
            }
          );

    for (const day of weeklyPlan) {
      const date = getDateForPlanDayName(day.day, referenceDate, cycle);
      const dateKey = getDayKey(date.toISOString());
      const override = params.plannedOverrides[dateKey];
      const baseDay = override
        ? {
            ...day,
            id: override.id,
            title: override.title,
            logType: override.logType,
            kind: override.kind,
            category: override.category,
            distance: override.distance,
            details: override.details,
          }
        : day;

      days.push({
        ...baseDay,
        date,
        dateKey,
        workouts: workoutsByDayKey[dateKey] ?? [],
        completed:
          params.completedWorkoutIds.includes(baseDay.id) ||
          (workoutsByDayKey[dateKey] ?? []).length > 0,
        skipped: params.skippedWorkoutIds?.includes(baseDay.id) ?? false,
        dayNote: params.planDayNotes?.[dateKey],
        isToday: dateKey === todayKey,
        isFuture: date.getTime() > referenceDate.getTime(),
        source: override ? "manual" : offset === 0 ? "adaptive" : "generated",
      });
    }
  }

  return days.sort((left, right) => left.date.getTime() - right.date.getTime());
}

export function buildMonthGrid(planDays: CalendarPlanDay[], visibleMonth: Date) {
  const planMap = planDays.reduce<Record<string, CalendarPlanDay>>((accumulator, day) => {
    accumulator[day.dateKey] = day;
    return accumulator;
  }, {});
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const start = new Date(monthStart);
  const startOffset = (monthStart.getDay() + 6) % 7;
  start.setDate(monthStart.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = getDayKey(date.toISOString());

    return {
      dateKey,
      date,
      planDay: planMap[dateKey] ?? null,
      isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
    };
  });
}

export function summarizeRaceGoal(
  goal: RaceGoalType,
  workouts: WorkoutType[],
  predictedSeconds: number | null,
  referenceDate = new Date()
): GoalProgressSummary {
  const raceDate = new Date(goal.raceDate);
  const daysUntil = Math.ceil((raceDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const predictedLabel = predictedSeconds ? formatDuration(Math.round(predictedSeconds)) : "Need more data";
  const goalSeconds = parseTimeToSeconds(goal.goalTime);

  if (daysUntil > 21) {
    return {
      status:
        goalSeconds !== null && predictedSeconds !== null && predictedSeconds <= goalSeconds
          ? "on-track"
          : "upcoming",
      countdownLabel: `${daysUntil} days to race day`,
      progressLabel: `Current projection: ${predictedLabel}`,
      detail:
        goalSeconds !== null && predictedSeconds !== null
          ? predictedSeconds <= goalSeconds
            ? "Your recent training points toward an on-track build."
            : "You still have time to sharpen toward your goal."
          : "Add more timed efforts or PRs to sharpen goal feedback.",
    };
  }

  if (daysUntil >= 0) {
    return {
      status:
        goalSeconds !== null && predictedSeconds !== null && predictedSeconds <= goalSeconds
          ? "on-track"
          : "needs-work",
      countdownLabel: `${Math.max(daysUntil, 0)} days remaining`,
      progressLabel: `Projection: ${predictedLabel}`,
      detail:
        goalSeconds !== null && predictedSeconds !== null
          ? predictedSeconds <= goalSeconds
            ? "You look on track if consistency holds through race week."
            : "You may need a sharper taper and strong race execution."
          : "Goal tracking will strengthen once more timed running is logged.",
    };
  }

  const lastGoalRace = workouts.find((workout) => {
    const workoutDate = new Date(workout.date);
    return Math.abs(workoutDate.getTime() - raceDate.getTime()) < 1000 * 60 * 60 * 24 * 3;
  });

  return {
    status: "upcoming",
    countdownLabel: "Race date has passed",
    progressLabel: lastGoalRace ? `Logged near race day: ${lastGoalRace.time || "Workout saved"}` : "No race result logged",
    detail: "Update the goal date or add a fresh goal to keep your build focused.",
  };
}

export function getAdaptiveCoachRecommendations(
  workouts: WorkoutType[],
  weeklyGoalMiles: number,
  referenceDate = new Date()
): CoachRecommendation[] {
  if (workouts.length === 0) {
    return [
      {
        title: "Start the block",
        detail: "Log an easy run to begin building feedback, trends, and adaptive coaching.",
      },
    ];
  }

  const latestWorkout = [...workouts].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  )[0];
  const weekly = getWeeklySummary(workouts, referenceDate);
  const trend = getRecentMileageTrend(workouts, referenceDate, 3);
  const recentAverage = trend.reduce((sum, point) => sum + point.miles, 0) / Math.max(trend.length, 1);
  const recommendations: CoachRecommendation[] = [];

  if (latestWorkout.effort >= 8) {
    recommendations.push({
      title: "Protect the next day",
      detail: "Yesterday was high effort, so today should stay easier and controlled.",
    });
  }

  if (weekly.totalMiles < weeklyGoalMiles * 0.6) {
    recommendations.push({
      title: "Close the gap gradually",
      detail: "You are below your goal pace for the week, so the next aerobic run matters more than forcing intensity.",
    });
  }

  if (recentAverage >= weeklyGoalMiles * 0.85 && weekly.workoutsCompleted >= 4) {
    recommendations.push({
      title: "Build slightly",
      detail: "Nice consistency lately. Next week can nudge up a little if recovery stays solid.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Hold steady",
      detail: "Training is balanced right now. Keep easy days easy and let the structure do the work.",
    });
  }

  return recommendations.slice(0, 3);
}

export function getAverageValidPace(workouts: WorkoutType[]) {
  return getAveragePace(workouts);
}

export function getWorkoutFeedback(input: {
  workoutType: string;
  effort: number;
  distance?: string;
}) : WorkoutFeedback {
  const normalizedType = input.workoutType.trim().toLowerCase();

  if (input.effort >= 8) {
    return {
      title: "That was a high effort day.",
      detail: "You may want a lighter day tomorrow so the hard work actually sinks in.",
    };
  }

  if (
    normalizedType.includes("easy") ||
    normalizedType.includes("recovery") ||
    input.effort <= 4
  ) {
    return {
      title: "Nice easy aerobic work.",
      detail: "That kind of controlled volume is what keeps good weeks stacking up.",
    };
  }

  if (normalizedType.includes("tempo") || normalizedType.includes("threshold")) {
    return {
      title: "Solid controlled quality.",
      detail: "Tempo days work best when the next day stays calm enough to recover well.",
    };
  }

  if (normalizedType.includes("long")) {
    return {
      title: "Good long-run work.",
      detail: "Refuel well and keep the next run relaxed if the effort drifted up.",
    };
  }

  return {
    title: "Workout saved.",
    detail: "Keep building with steady effort and clear recovery between quality days.",
  };
}

export function getStatsSummary(workouts: WorkoutType[], referenceDate = new Date()) {
  const dashboard = getDashboardStats(workouts, referenceDate);
  return {
    ...dashboard,
    totalMiles: getTotalMiles(workouts),
    streak: getStreakSummary(workouts.map((workout) => workout.date), referenceDate),
    insights: getInsightsSummary(workouts, dashboard.weeklyMiles || 1, referenceDate),
    monthlyTrend: getMonthlyTrend(workouts, referenceDate, 4),
    weeklyTrend: getRecentMileageTrend(workouts, referenceDate, 6),
    averageEffort: getAverageEffort(workouts),
    averagePace: getAverageValidPace(workouts),
    longestRun: getLongestRun(workouts),
  };
}

function getDateForPlanDayName(dayName: string, referenceDate: Date, planCycle: number) {
  const weekStart = startOfWeek(referenceDate);
  weekStart.setDate(weekStart.getDate() + planCycle * 7);
  const offsets: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + (offsets[dayName] ?? 0));
  return date;
}

export function getGoalEventBaseline(profile: ProfileType) {
  return profile.raceGoals[0] ?? null;
}

export function getPaceSignal(workouts: WorkoutType[]) {
  const timedRuns = workouts
    .map((workout) => {
      const miles = parseDistance(workout.distance);
      const seconds = parseTimeToSeconds(workout.time);

      if (!miles || !seconds) {
        return null;
      }

      return seconds / miles;
    })
    .filter((value): value is number => value !== null);

  if (timedRuns.length === 0) {
    return null;
  }

  return formatPace(timedRuns.reduce((sum, value) => sum + value, 0) / timedRuns.length);
}
