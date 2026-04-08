import type { EngineRecord, FoodLogEntry, MealSlot } from "@/contexts/engine-context";
import type { WorkoutType } from "@/contexts/workout-context";
import { parseDistance, parseTimeToSeconds } from "@/utils/workout-utils";

export const MEAL_SLOTS: readonly MealSlot[] = ["breakfast", "lunch", "dinner", "snacks"] as const;

export type FuelingTrackerStatus = "underfueled" | "balanced" | "well_fueled";
export type TrainingLoad = "light" | "moderate" | "high";

export type DailyFuelingSummary = {
  dateKey: string;
  eatenCalories: number;
  burnedCalories: number;
  netCalories: number;
  status: FuelingTrackerStatus;
  statusLabel: string;
  insight: string;
  trainingLoad: TrainingLoad;
  workoutLabel: string;
  hasAnyEntries: boolean;
};

export type WeeklyFuelingSummary = {
  averageIntake: number;
  averageBurn: number;
  underfueledDays: number;
  balancedDays: number;
  wellFueledDays: number;
  summary: string;
  days: DailyFuelingSummary[];
};

export type MealGroup = {
  meal: MealSlot;
  title: string;
  entries: FoodLogEntry[];
  calories: number;
};

export function getFoodEntriesForDate(engine: EngineRecord, dateKey: string) {
  return engine.foodLogsByDate[dateKey] ?? [];
}

export function getMealGroups(entries: FoodLogEntry[]): MealGroup[] {
  return MEAL_SLOTS.map((meal) => {
    const mealEntries = entries.filter((entry) => entry.meal === meal);

    return {
      meal,
      title: getMealTitle(meal),
      entries: mealEntries,
      calories: mealEntries.reduce((sum, entry) => sum + entry.calories, 0),
    };
  });
}

export function getDailyFuelingSummary(
  engine: EngineRecord,
  workouts: WorkoutType[],
  dateKey: string
): DailyFuelingSummary {
  const entries = getFoodEntriesForDate(engine, dateKey);
  const eatenCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const workoutsForDay = workouts.filter((workout) => getDateKey(workout.date) === dateKey);
  const burnedCalories = Math.round(
    workoutsForDay.reduce((sum, workout) => sum + estimateWorkoutBurn(workout), 0)
  );
  const netCalories = eatenCalories - burnedCalories;
  const workoutLabel = describeTrainingLoad(workoutsForDay);
  const trainingLoad: TrainingLoad =
    burnedCalories >= 700 || workoutsForDay.some((workout) => workout.effort >= 8)
      ? "high"
      : burnedCalories >= 300 || workoutsForDay.some((workout) => workout.effort >= 6)
        ? "moderate"
        : "light";

  const status = getFuelingTrackerStatus(eatenCalories, burnedCalories, trainingLoad);

  return {
    dateKey,
    eatenCalories,
    burnedCalories,
    netCalories,
    status,
    statusLabel:
      status === "underfueled" ? "Underfueled" : status === "balanced" ? "Balanced" : "Well fueled",
    insight: buildFuelingInsight(status, trainingLoad, workoutsForDay),
    trainingLoad,
    workoutLabel,
    hasAnyEntries: entries.length > 0 || workoutsForDay.length > 0,
  };
}

export function buildWeeklyFuelingTrackerSummary(
  engine: EngineRecord,
  workouts: WorkoutType[],
  referenceDate = new Date()
): WeeklyFuelingSummary {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - (6 - index));
    return getDailyFuelingSummary(engine, workouts, getDateKey(date.toISOString()));
  });

  const averageIntake = Math.round(days.reduce((sum, day) => sum + day.eatenCalories, 0) / days.length);
  const averageBurn = Math.round(days.reduce((sum, day) => sum + day.burnedCalories, 0) / days.length);
  const underfueledDays = days.filter((day) => day.status === "underfueled").length;
  const balancedDays = days.filter((day) => day.status === "balanced").length;
  const wellFueledDays = days.filter((day) => day.status === "well_fueled").length;

  return {
    averageIntake,
    averageBurn,
    underfueledDays,
    balancedDays,
    wellFueledDays,
    summary:
      underfueledDays >= 3
        ? "This week looks a little light for your training. A steadier recovery meal rhythm would help."
        : balancedDays >= 4
          ? "Fueling has matched the training load well most days this week."
          : "Fueling is mixed this week. A couple more solid support days would improve recovery.",
    days,
  };
}

export function getFuelingStatusForRecovery(engine: EngineRecord, workouts: WorkoutType[]) {
  const today = getDailyFuelingSummary(engine, workouts, getDateKey(new Date().toISOString()));

  if (today.hasAnyEntries) {
    return today.status === "well_fueled" ? "solid" : today.status === "balanced" ? "mixed" : "low";
  }

  return engine.fuelingStatus;
}

function getFuelingTrackerStatus(
  eatenCalories: number,
  burnedCalories: number,
  trainingLoad: TrainingLoad
): FuelingTrackerStatus {
  const minimumTarget =
    trainingLoad === "high" ? 2200 : trainingLoad === "moderate" ? 1800 : 1450;
  const strongTarget = trainingLoad === "high" ? 2800 : trainingLoad === "moderate" ? 2300 : 1800;
  const lowNetFloor =
    trainingLoad === "high" ? 1300 : trainingLoad === "moderate" ? 950 : 700;
  const netCalories = eatenCalories - burnedCalories;

  if (eatenCalories === 0) {
    return "underfueled";
  }

  if (eatenCalories < minimumTarget || netCalories < lowNetFloor) {
    return "underfueled";
  }

  if (eatenCalories >= strongTarget && netCalories >= lowNetFloor + 500) {
    return "well_fueled";
  }

  return "balanced";
}

function buildFuelingInsight(
  status: FuelingTrackerStatus,
  trainingLoad: TrainingLoad,
  workoutsForDay: WorkoutType[]
) {
  const hadHardWorkout = workoutsForDay.some((workout) => workout.effort >= 7);

  if (status === "underfueled") {
    return trainingLoad === "high"
      ? "Today's intake looks low for your training load. Recovery and pace control may suffer if you stay here."
      : "Fueling looks a little light today. A simple carb-plus-protein meal would support the next run better.";
  }

  if (status === "well_fueled") {
    return hadHardWorkout
      ? "Good recovery fueling after a harder workout. This should help the work actually land."
      : "Fuel stores look topped up, which gives you more room for tomorrow's quality or long run.";
  }

  return hadHardWorkout
    ? "Fueling is in a workable range for today's session. Keep recovery food and fluids steady tonight."
    : "Fueling looks balanced for a normal training day. Stay consistent rather than chasing perfect numbers.";
}

function describeTrainingLoad(workoutsForDay: WorkoutType[]) {
  if (workoutsForDay.length === 0) {
    return "No workout burn logged yet";
  }

  const hardestWorkout = [...workoutsForDay].sort((left, right) => right.effort - left.effort)[0];
  const distance = parseDistance(hardestWorkout.distance);

  if (hardestWorkout.effort >= 8) {
    return "Hard training day";
  }

  if (distance !== null && distance >= 9) {
    return "Long-run demand";
  }

  if (hardestWorkout.effort >= 6) {
    return "Moderate session";
  }

  return "Easy training day";
}

function estimateWorkoutBurn(workout: WorkoutType) {
  const distanceMiles = parseDistance(workout.distance);
  const timeSeconds = parseTimeToSeconds(workout.time);

  if (distanceMiles !== null && distanceMiles > 0) {
    const effortMultiplier = 0.88 + Math.max(0, workout.effort - 4) * 0.05;
    return Math.max(120, distanceMiles * 100 * effortMultiplier);
  }

  if (timeSeconds !== null && timeSeconds > 0) {
    const minutes = timeSeconds / 60;
    const effortMultiplier = 7.8 + Math.max(0, workout.effort - 4) * 0.5;
    return Math.max(100, minutes * effortMultiplier);
  }

  return workout.effort >= 7 ? 450 : workout.effort >= 5 ? 280 : 180;
}

function getDateKey(dateValue: string) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

function getMealTitle(meal: MealSlot) {
  switch (meal) {
    case "breakfast":
      return "Breakfast";
    case "lunch":
      return "Lunch";
    case "dinner":
      return "Dinner";
    default:
      return "Snacks";
  }
}
