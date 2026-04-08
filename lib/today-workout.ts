import type { HeartRateZone } from "@/contexts/profile-context";
import type { PlanDay } from "@/lib/training-plan";
import { getPlanDayEffortGuidance, getWorkoutPurpose, type WorkoutEffortGuidance } from "@/lib/workout-effort";

export type TodayWorkoutState = {
  state: "planned" | "completed" | "rest" | "none";
  workout: PlanDay | null;
  isComplete: boolean;
  nextWorkout: PlanDay | null;
};

type WorkoutGuidance = {
  effortGuidance: WorkoutEffortGuidance;
  effortLabel: string;
  effortRange: string;
  paceGuidance: string;
  beginnerTip: string;
  shortDescription: string;
  heartRateGuidance?: string;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function getTodayWorkout(
  plan: PlanDay[],
  completedWorkoutIds: string[],
  referenceDate = new Date()
): TodayWorkoutState {
  const todayName = DAY_NAMES[referenceDate.getDay()];
  const workout = plan.find((day) => day.day === todayName) ?? null;

  if (!workout) {
    return {
      state: "none",
      workout: null,
      isComplete: false,
      nextWorkout: null,
    };
  }

  const isComplete = completedWorkoutIds.includes(workout.id);
  const nextWorkout = getNextWorkoutPreview(plan, todayName);

  if (isComplete) {
    return {
      state: "completed",
      workout,
      isComplete: true,
      nextWorkout,
    };
  }

  if (workout.kind === "rest" || workout.kind === "recovery") {
    return {
      state: "rest",
      workout,
      isComplete: false,
      nextWorkout,
    };
  }

  return {
    state: "planned",
    workout,
    isComplete: false,
    nextWorkout,
  };
}

export function getWorkoutTypeLabel(workout: PlanDay | null) {
  if (!workout) {
    return "No workout";
  }

  switch (workout.category) {
    case "intervals":
      return "Track Session";
    case "threshold":
      return "Tempo Run";
    case "long":
      return "Long Run";
    case "recovery":
      return "Recovery Run";
    case "rest":
      return "Rest Day";
    case "steady":
      return "Aerobic Run";
    default:
      return "Easy Run";
  }
}

export function getWorkoutWhyItMatters(workout: PlanDay | null) {
  if (!workout) {
    return "Keeps your training week simple and easy to follow.";
  }

  return getWorkoutPurpose({
    category: workout.category,
    title: workout.title,
    type: workout.logType,
  });
}

export function getWorkoutGuidance(
  workout: PlanDay | null,
  heartRateZones: HeartRateZone[] = []
): WorkoutGuidance {
  if (!workout) {
    const effortGuidance = getPlanDayEffortGuidance(null);
    return {
      effortGuidance,
      effortLabel: effortGuidance.label,
      effortRange: effortGuidance.effortRange,
      paceGuidance: "No workout scheduled for today.",
      beginnerTip: "Open your weekly plan to look ahead or log a run if you trained anyway.",
      shortDescription: "Open training day",
    };
  }

  const effortGuidance = getPlanDayEffortGuidance(workout);
  const zone2 = heartRateZones.find((zone) => zone.name === "Zone 2");
  const zone3 = heartRateZones.find((zone) => zone.name === "Zone 3");
  const zone4 = heartRateZones.find((zone) => zone.name === "Zone 4");

  switch (workout.category) {
    case "intervals":
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Run the fast work controlled early, then hold rhythm instead of forcing the final reps.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
        heartRateGuidance: zone4 ? `${zone4.name} ${zone4.min}-${zone4.max} bpm` : undefined,
      };
    case "threshold":
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Comfortably hard and controlled. You should feel strong, not all-out.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
        heartRateGuidance: zone3 ? `${zone3.name} ${zone3.min}-${zone3.max} bpm` : undefined,
      };
    case "long":
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Keep it relaxed enough to finish strong rather than chasing pace early.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
        heartRateGuidance: zone2 ? `${zone2.name} ${zone2.min}-${zone2.max} bpm` : undefined,
      };
    case "recovery":
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Easy enough that your breathing stays calm and your legs loosen up.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
        heartRateGuidance: zone2 ? `${zone2.name} ${zone2.min}-${zone2.max} bpm` : undefined,
      };
    case "rest":
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Rest, walk, or do light mobility only if it helps you feel better tomorrow.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
      };
    case "steady":
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Smooth aerobic rhythm with enough control to stay relaxed throughout.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
        heartRateGuidance: zone3 ? `${zone3.name} ${zone3.min}-${zone3.max} bpm` : undefined,
      };
    default:
      return {
        effortGuidance,
        effortLabel: effortGuidance.label,
        effortRange: effortGuidance.effortRange,
        paceGuidance: "Keep it conversational and let the pace stay secondary to effort.",
        beginnerTip: effortGuidance.beginnerTip,
        shortDescription: effortGuidance.shortDescription,
        heartRateGuidance: zone2 ? `${zone2.name} ${zone2.min}-${zone2.max} bpm` : undefined,
      };
  }
}

function getNextWorkoutPreview(plan: PlanDay[], todayName: string) {
  const todayIndex = plan.findIndex((day) => day.day === todayName);

  if (todayIndex === -1 || plan.length === 0) {
    return null;
  }

  return plan[(todayIndex + 1) % plan.length] ?? null;
}
