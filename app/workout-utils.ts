export function parseDistance(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseTimeToSeconds(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(":").map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

export function formatDuration(totalSeconds: number) {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatPace(secondsPerMile: number) {
  const rounded = Math.round(secondsPerMile);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`;
}

export function getWorkoutPace(distance: string, time: string) {
  const miles = parseDistance(distance);
  const seconds = parseTimeToSeconds(time);

  if (!miles || !seconds || miles <= 0) {
    return null;
  }

  return formatPace(seconds / miles);
}

export function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfMonth(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isOnOrAfter(dateValue: string, boundary: Date) {
  return new Date(dateValue).getTime() >= boundary.getTime();
}

export function formatFeedDate(dateValue: string) {
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDayKey(dateValue: string) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

const DAY_INDEX: Record<DayName, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

export type WeeklySummary = {
  totalMiles: number;
  workoutsCompleted: number;
  averageEffort: number | null;
  longestRun: number;
};

export type StreakSummary = {
  current: number;
  best: number;
};

export type DashboardStats = {
  weeklyMiles: number;
  monthlyMiles: number;
  longestRun: number;
  averageEffort: number | null;
  averagePace: string | null;
  totalWorkouts: number;
};

export type MileageTrendPoint = {
  label: string;
  miles: number;
  current: boolean;
};

export function getUniqueWorkoutDayKeys(dateValues: string[]) {
  return [...new Set(dateValues.map((dateValue) => getDayKey(dateValue)))].sort();
}

export function getStreakSummary(dateValues: string[], today = new Date()): StreakSummary {
  const dayKeys = getUniqueWorkoutDayKeys(dateValues);

  if (dayKeys.length === 0) {
    return { current: 0, best: 0 };
  }

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);
  const todayKey = normalizedToday.toISOString().slice(0, 10);
  const yesterday = new Date(normalizedToday);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const latestKey = dayKeys[dayKeys.length - 1];

  let current = 0;

  if (latestKey === todayKey || latestKey === yesterdayKey) {
    current = 1;

    for (let index = dayKeys.length - 1; index > 0; index -= 1) {
      const currentDate = new Date(`${dayKeys[index]}T00:00:00`);
      const previousDate = new Date(`${dayKeys[index - 1]}T00:00:00`);
      const dayDifference =
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDifference === 1) {
        current += 1;
        continue;
      }

      break;
    }
  }

  let best = 1;
  let running = 1;

  for (let index = 1; index < dayKeys.length; index += 1) {
    const currentDate = new Date(`${dayKeys[index]}T00:00:00`);
    const previousDate = new Date(`${dayKeys[index - 1]}T00:00:00`);
    const dayDifference =
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDifference === 1) {
      running += 1;
      best = Math.max(best, running);
      continue;
    }

    running = 1;
  }

  return {
    current,
    best,
  };
}

export function getWeeklySummary<
  T extends {
    date: string;
    distance: string;
    effort: number;
  },
>(workouts: T[], referenceDate = new Date()): WeeklySummary {
  const weekStart = startOfWeek(referenceDate);
  const thisWeekWorkouts = workouts.filter((workout) => isOnOrAfter(workout.date, weekStart));
  const totalMiles = thisWeekWorkouts.reduce((sum, workout) => {
    return sum + (parseDistance(workout.distance) ?? 0);
  }, 0);
  const longestRun = thisWeekWorkouts.reduce((longest, workout) => {
    return Math.max(longest, parseDistance(workout.distance) ?? 0);
  }, 0);
  const validEfforts = thisWeekWorkouts
    .map((workout) => workout.effort)
    .filter((effort) => Number.isFinite(effort));

  return {
    totalMiles,
    workoutsCompleted: thisWeekWorkouts.length,
    averageEffort:
      validEfforts.length > 0
        ? validEfforts.reduce((sum, effort) => sum + effort, 0) / validEfforts.length
        : null,
    longestRun,
  };
}

export function getAverageEffort<
  T extends {
    effort: number;
  },
>(workouts: T[]) {
  const validEfforts = workouts
    .map((workout) => workout.effort)
    .filter((effort) => Number.isFinite(effort));

  if (validEfforts.length === 0) {
    return null;
  }

  return validEfforts.reduce((sum, effort) => sum + effort, 0) / validEfforts.length;
}

export function getAveragePace<
  T extends {
    distance: string;
    time: string;
  },
>(workouts: T[]) {
  const paceValues = workouts
    .map((workout) => {
      const distance = parseDistance(workout.distance);
      const seconds = parseTimeToSeconds(workout.time);

      if (!distance || !seconds || distance <= 0) {
        return null;
      }

      return seconds / distance;
    })
    .filter((value): value is number => value !== null);

  if (paceValues.length === 0) {
    return null;
  }

  return formatPace(paceValues.reduce((sum, value) => sum + value, 0) / paceValues.length);
}

export function getDashboardStats<
  T extends {
    date: string;
    distance: string;
    time: string;
    effort: number;
  },
>(workouts: T[], referenceDate = new Date()): DashboardStats {
  const monthlyStart = startOfMonth(referenceDate);
  const weeklySummary = getWeeklySummary(workouts, referenceDate);
  const monthlyMiles = workouts.reduce((sum, workout) => {
    if (!isOnOrAfter(workout.date, monthlyStart)) {
      return sum;
    }

    return sum + (parseDistance(workout.distance) ?? 0);
  }, 0);
  const longestRun = workouts.reduce((longest, workout) => {
    return Math.max(longest, parseDistance(workout.distance) ?? 0);
  }, 0);

  return {
    weeklyMiles: weeklySummary.totalMiles,
    monthlyMiles,
    longestRun,
    averageEffort: getAverageEffort(workouts),
    averagePace: getAveragePace(workouts),
    totalWorkouts: workouts.length,
  };
}

export function getRecentMileageTrend<
  T extends {
    date: string;
    distance: string;
  },
>(workouts: T[], referenceDate = new Date(), weeks = 4): MileageTrendPoint[] {
  const currentWeekStart = startOfWeek(referenceDate);

  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - (weeks - 1 - index) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const miles = workouts.reduce((sum, workout) => {
      const workoutDate = new Date(workout.date).getTime();

      if (workoutDate >= start.getTime() && workoutDate < end.getTime()) {
        return sum + (parseDistance(workout.distance) ?? 0);
      }

      return sum;
    }, 0);

    return {
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      miles,
      current: index === weeks - 1,
    };
  });
}

export function getPlanWeekStart(referenceDate = new Date(), planCycle = 0) {
  const start = startOfWeek(referenceDate);
  start.setDate(start.getDate() + planCycle * 7);
  return start;
}

export function getDateForPlanDay(day: DayName, referenceDate = new Date(), planCycle = 0) {
  const weekStart = getPlanWeekStart(referenceDate, planCycle);
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + DAY_INDEX[day]);
  return date;
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
