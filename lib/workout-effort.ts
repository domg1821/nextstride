import type { PlanDay, WorkoutPreferenceCategory } from "@/lib/training-plan";

export type WorkoutEffortGuidance = {
  label: string;
  effortRange: string;
  shortDescription: string;
  beginnerTip: string;
  workoutPurpose: string;
  accent: string;
  defaultScore: number;
};

const GUIDANCE_BY_CATEGORY: Record<WorkoutPreferenceCategory, WorkoutEffortGuidance> = {
  easy: {
    label: "Easy",
    effortRange: "3-4/10",
    shortDescription: "Comfortable conversational effort",
    beginnerTip: "You should feel relaxed and able to talk easily the whole time.",
    workoutPurpose: "Builds aerobic base and makes everyday running feel more sustainable.",
    accent: "#93c5fd",
    defaultScore: 4,
  },
  steady: {
    label: "Steady",
    effortRange: "5/10",
    shortDescription: "Controlled aerobic effort",
    beginnerTip: "You should feel focused but still in control, not like you are racing.",
    workoutPurpose: "Builds aerobic strength without tipping the run into hard racing effort.",
    accent: "#67e8f9",
    defaultScore: 5,
  },
  threshold: {
    label: "Tempo",
    effortRange: "6-7/10",
    shortDescription: "Comfortably hard effort",
    beginnerTip: "Breathing should be stronger, but you should still feel smooth and controlled.",
    workoutPurpose: "Improves stamina at faster effort so you can hold strong running longer.",
    accent: "#38bdf8",
    defaultScore: 7,
  },
  intervals: {
    label: "Intervals",
    effortRange: "8-9/10",
    shortDescription: "Fast but controlled work",
    beginnerTip: "The hard parts should feel tough, but you should not sprint the first rep and fade badly.",
    workoutPurpose: "Builds speed, pacing control, and confidence at hard race-like effort.",
    accent: "#2563eb",
    defaultScore: 8,
  },
  long: {
    label: "Long Run",
    effortRange: "4-5/10",
    shortDescription: "Steady relaxed endurance effort",
    beginnerTip: "You should stay patient early and finish feeling worked, not cooked.",
    workoutPurpose: "Builds endurance so longer runs and race efforts feel more manageable.",
    accent: "#4ade80",
    defaultScore: 5,
  },
  recovery: {
    label: "Recovery",
    effortRange: "1-2/10",
    shortDescription: "Very light recovery effort",
    beginnerTip: "This should feel almost too easy and leave you fresher when you finish.",
    workoutPurpose: "Helps your body absorb harder training while keeping your routine consistent.",
    accent: "#22c55e",
    defaultScore: 2,
  },
  rest: {
    label: "Rest",
    effortRange: "1/10",
    shortDescription: "Full recovery or very light movement",
    beginnerTip: "A rest day still helps your training by letting your body absorb the work.",
    workoutPurpose: "Lets your body recover so future workouts land better.",
    accent: "#94a3b8",
    defaultScore: 1,
  },
};

function inferWorkoutCategory(input?: string | null): WorkoutPreferenceCategory {
  const normalized = input?.trim().toLowerCase() || "";

  if (normalized.includes("interval") || normalized.includes("track") || normalized.includes("speed")) {
    return "intervals";
  }

  if (normalized.includes("tempo") || normalized.includes("threshold")) {
    return "threshold";
  }

  if (normalized.includes("long")) {
    return "long";
  }

  if (normalized.includes("recovery")) {
    return "recovery";
  }

  if (normalized.includes("rest")) {
    return "rest";
  }

  if (normalized.includes("steady") || normalized.includes("aerobic")) {
    return "steady";
  }

  return "easy";
}

export function getWorkoutEffortGuidanceForCategory(category?: WorkoutPreferenceCategory | null): WorkoutEffortGuidance {
  return GUIDANCE_BY_CATEGORY[category ?? "easy"] ?? GUIDANCE_BY_CATEGORY.easy;
}

export function getWorkoutEffortGuidance(input?: {
  category?: WorkoutPreferenceCategory | null;
  title?: string | null;
  type?: string | null;
} | null): WorkoutEffortGuidance {
  if (input?.category) {
    return getWorkoutEffortGuidanceForCategory(input.category);
  }

  return GUIDANCE_BY_CATEGORY[inferWorkoutCategory(input?.title || input?.type)] ?? GUIDANCE_BY_CATEGORY.easy;
}

export function getPlanDayEffortGuidance(workout: Pick<PlanDay, "category" | "title" | "logType"> | null | undefined) {
  return getWorkoutEffortGuidance({
    category: workout?.category,
    title: workout?.title,
    type: workout?.logType,
  });
}

export function getLoggedWorkoutEffortGuidance(input: {
  type?: string | null;
  effort?: number | null;
}): WorkoutEffortGuidance {
  const effort = input.effort;

  if (Number.isFinite(effort)) {
    if (effort! <= 1.5) {
      return GUIDANCE_BY_CATEGORY.rest;
    }

    if (effort! <= 2.5) {
      return GUIDANCE_BY_CATEGORY.recovery;
    }

    if (effort! <= 4.5) {
      return GUIDANCE_BY_CATEGORY.easy;
    }

    if (effort! <= 5.5) {
      return GUIDANCE_BY_CATEGORY.steady;
    }

    if (effort! <= 7.5) {
      return GUIDANCE_BY_CATEGORY.threshold;
    }

    return GUIDANCE_BY_CATEGORY.intervals;
  }

  return getWorkoutEffortGuidance({ type: input.type });
}

export function getDefaultEffortScore(category?: WorkoutPreferenceCategory | null) {
  return getWorkoutEffortGuidanceForCategory(category).defaultScore;
}

export function getWorkoutPurpose(input?: {
  category?: WorkoutPreferenceCategory | null;
  title?: string | null;
  type?: string | null;
} | null) {
  return getWorkoutEffortGuidance(input).workoutPurpose;
}
