import type { PRsType, ProfileType } from "./profile-context";
import type { WorkoutType } from "./workout-context";
import { formatDuration, getRecentMileageTrend, parseDistance, parseTimeToSeconds } from "./workout-utils";

export type PredictorEventKey = keyof PRsType;

export type PredictionConfidence = "Low" | "Medium" | "High";

export type RacePrediction = {
  eventKey: PredictorEventKey;
  label: string;
  predictedSeconds: number | null;
  predictedTime: string | null;
  confidence: PredictionConfidence;
  confidenceScore: number;
  explanation: string[];
  influences: string[];
};

type EventConfig = {
  key: PredictorEventKey;
  label: string;
  miles: number;
  aliases: string[];
  category: "speed" | "middle" | "road";
  recommendedWeeklyMiles: number;
};

type ParsedWorkout = {
  distanceMiles: number;
  timeSeconds: number;
  effort: number;
  type: string;
  daysAgo: number;
};

const EVENT_CONFIGS: EventConfig[] = [
  { key: "400", label: "400m", miles: 0.2485, aliases: ["400", "400m"], category: "speed", recommendedWeeklyMiles: 15 },
  { key: "800", label: "800m", miles: 0.4971, aliases: ["800", "800m"], category: "speed", recommendedWeeklyMiles: 18 },
  { key: "1600", label: "1600m / Mile", miles: 0.9942, aliases: ["1600", "mile", "1600m", "1600/mile"], category: "middle", recommendedWeeklyMiles: 22 },
  { key: "3200", label: "3200m / 2 Mile", miles: 1.9884, aliases: ["3200", "2 mile", "3200m", "two mile"], category: "middle", recommendedWeeklyMiles: 25 },
  { key: "5k", label: "5K", miles: 3.1069, aliases: ["5k"], category: "road", recommendedWeeklyMiles: 28 },
  { key: "10k", label: "10K", miles: 6.2137, aliases: ["10k"], category: "road", recommendedWeeklyMiles: 34 },
  { key: "half", label: "Half Marathon", miles: 13.1094, aliases: ["half", "half marathon"], category: "road", recommendedWeeklyMiles: 40 },
  { key: "marathon", label: "Marathon", miles: 26.2188, aliases: ["marathon"], category: "road", recommendedWeeklyMiles: 48 },
];

export function listPredictorEvents() {
  return EVENT_CONFIGS;
}

export function normalizePredictorEvent(input: string) {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return EVENT_CONFIGS.find((event) => event.aliases.some((alias) => normalized.includes(alias)))?.key ?? null;
}

export function getRacePredictions(workouts: WorkoutType[], profile: ProfileType) {
  return EVENT_CONFIGS.map((event) => getPredictionForEvent(event.key, workouts, profile));
}

export function getPredictionForEvent(
  eventKey: PredictorEventKey,
  workouts: WorkoutType[],
  profile: ProfileType
): RacePrediction {
  const event = EVENT_CONFIGS.find((item) => item.key === eventKey);

  if (!event) {
    throw new Error(`Unsupported prediction event: ${eventKey}`);
  }

  const parsedWorkouts = parseRecentTimedWorkouts(workouts);
  const recentMileageAverage = getRecentMileageAverage(workouts);
  const goalEventKey = normalizePredictorEvent(profile.goalEvent || "");
  const workoutCandidates = parsedWorkouts.map((workout) => {
    const predictedSeconds = projectRaceTime(
      workout.timeSeconds,
      workout.distanceMiles,
      event.miles,
      getProjectionExponent(workout.distanceMiles, event.miles, event.category)
    );
    const weight =
      getRecencyWeight(workout.daysAgo) *
      getEffortWeight(workout.effort) *
      getSpecificityWeight(workout.distanceMiles, event.miles) *
      getWorkoutTypeWeight(workout.type, event.category);

    return {
      predictedSeconds,
      weight,
      exactish: Math.abs(workout.distanceMiles - event.miles) <= event.miles * 0.08 + 0.03,
      type: workout.type,
    };
  });
  const prCandidates = getProfilePrCandidates(profile).map((candidate) => ({
    predictedSeconds: projectRaceTime(
      candidate.seconds,
      candidate.miles,
      event.miles,
      getProjectionExponent(candidate.miles, event.miles, event.category)
    ),
    weight: candidate.key === event.key ? 0.95 : 0.55,
    exactish: candidate.key === event.key,
    type: candidate.label,
  }));
  const allCandidates = [...workoutCandidates, ...prCandidates].filter(
    (candidate) => Number.isFinite(candidate.predictedSeconds) && candidate.weight > 0
  );

  if (allCandidates.length < 2 && parsedWorkouts.length < 2 && prCandidates.length === 0) {
    return {
      eventKey: event.key,
      label: event.label,
      predictedSeconds: null,
      predictedTime: null,
      confidence: "Low",
      confidenceScore: 24,
      explanation: ["Log more workouts to improve your race prediction."],
      influences: ["Not enough timed training data yet"],
    };
  }

  const weightedSeconds =
    allCandidates.reduce((sum, candidate) => sum + candidate.predictedSeconds * candidate.weight, 0) /
    allCandidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  const adjustedSeconds = applyMileageAdjustment(weightedSeconds, recentMileageAverage, event);
  const confidenceScore = getConfidenceScore({
    parsedWorkouts,
    prCandidates,
    recentMileageAverage,
    event,
    hasGoalMatch: goalEventKey === event.key,
    hasExactRecentWorkout: workoutCandidates.some((candidate) => candidate.exactish),
  });
  const confidence = confidenceScore >= 72 ? "High" : confidenceScore >= 45 ? "Medium" : "Low";

  return {
    eventKey: event.key,
    label: event.label,
    predictedSeconds: adjustedSeconds,
    predictedTime: formatDuration(Math.round(adjustedSeconds)),
    confidence,
    confidenceScore,
    explanation: buildExplanation({
      parsedWorkouts,
      profile,
      recentMileageAverage,
      event,
      confidence,
      usedProfilePr: prCandidates.some((candidate) => candidate.exactish),
    }),
    influences: buildInfluences(parsedWorkouts, event.category),
  };
}

function parseRecentTimedWorkouts(workouts: WorkoutType[]) {
  const now = Date.now();

  return workouts
    .map<ParsedWorkout | null>((workout) => {
      const distanceMiles = parseDistance(workout.distance);
      const timeSeconds = parseTimeToSeconds(workout.time);
      const workoutTime = new Date(workout.date).getTime();

      if (!distanceMiles || !timeSeconds || !Number.isFinite(workoutTime)) {
        return null;
      }

      const daysAgo = Math.max(0, Math.floor((now - workoutTime) / (1000 * 60 * 60 * 24)));

      if (daysAgo > 84) {
        return null;
      }

      return {
        distanceMiles,
        timeSeconds,
        effort: workout.effort,
        type: workout.type || "",
        daysAgo,
      };
    })
    .filter((workout): workout is ParsedWorkout => workout !== null);
}

function getProfilePrCandidates(profile: ProfileType) {
  return EVENT_CONFIGS.flatMap((event) => {
    const value = event.key === "5k" ? profile.pr5k || profile.prs["5k"] : profile.prs[event.key];
    const seconds = value ? parseTimeToSeconds(value) : null;

    if (!seconds) {
      return [];
    }

    return [
      {
        key: event.key,
        label: event.label,
        seconds,
        miles: event.miles,
      },
    ];
  });
}

function getRecentMileageAverage(workouts: WorkoutType[]) {
  const trend = getRecentMileageTrend(workouts, new Date(), 4);

  if (trend.length === 0) {
    return 0;
  }

  return trend.reduce((sum, point) => sum + point.miles, 0) / trend.length;
}

function projectRaceTime(sourceSeconds: number, sourceMiles: number, targetMiles: number, exponent: number) {
  return sourceSeconds * Math.pow(targetMiles / sourceMiles, exponent);
}

function getProjectionExponent(sourceMiles: number, targetMiles: number, category: EventConfig["category"]) {
  const ratio = Math.max(sourceMiles, targetMiles) / Math.min(sourceMiles, targetMiles);

  if (category === "speed") {
    return ratio > 4 ? 1.09 : 1.05;
  }

  if (category === "middle") {
    return ratio > 4 ? 1.08 : 1.06;
  }

  return ratio > 4 ? 1.09 : 1.07;
}

function getRecencyWeight(daysAgo: number) {
  if (daysAgo <= 14) {
    return 1.15;
  }

  if (daysAgo <= 35) {
    return 1;
  }

  if (daysAgo <= 56) {
    return 0.82;
  }

  return 0.66;
}

function getEffortWeight(effort: number) {
  if (!Number.isFinite(effort)) {
    return 0.85;
  }

  return Math.min(Math.max(0.72 + effort / 12, 0.72), 1.45);
}

function getSpecificityWeight(sourceMiles: number, targetMiles: number) {
  const ratio = Math.max(sourceMiles, targetMiles) / Math.min(sourceMiles, targetMiles);

  if (ratio <= 1.15) {
    return 1.25;
  }

  if (ratio <= 1.75) {
    return 1.08;
  }

  if (ratio <= 3) {
    return 0.92;
  }

  return 0.75;
}

function getWorkoutTypeWeight(type: string, category: EventConfig["category"]) {
  const normalized = type.toLowerCase();

  if (category === "speed") {
    if (normalized.includes("track") || normalized.includes("interval")) {
      return 1.2;
    }

    if (normalized.includes("tempo")) {
      return 0.96;
    }
  }

  if (category === "middle") {
    if (normalized.includes("tempo") || normalized.includes("track") || normalized.includes("interval")) {
      return 1.12;
    }
  }

  if (category === "road") {
    if (normalized.includes("long") || normalized.includes("tempo") || normalized.includes("aerobic")) {
      return 1.14;
    }

    if (normalized.includes("track") || normalized.includes("interval")) {
      return 0.96;
    }
  }

  return 1;
}

function applyMileageAdjustment(seconds: number, averageWeeklyMiles: number, event: EventConfig) {
  const mileageDelta = (averageWeeklyMiles - event.recommendedWeeklyMiles) / event.recommendedWeeklyMiles;

  if (event.category === "speed") {
    return seconds * (1 - clamp(mileageDelta * 0.012, -0.015, 0.015));
  }

  if (event.category === "middle") {
    return seconds * (1 - clamp(mileageDelta * 0.02, -0.025, 0.02));
  }

  return seconds * (1 - clamp(mileageDelta * 0.035, -0.045, 0.03));
}

function getConfidenceScore({
  parsedWorkouts,
  prCandidates,
  recentMileageAverage,
  event,
  hasGoalMatch,
  hasExactRecentWorkout,
}: {
  parsedWorkouts: ParsedWorkout[];
  prCandidates: { exactish: boolean }[];
  recentMileageAverage: number;
  event: EventConfig;
  hasGoalMatch: boolean;
  hasExactRecentWorkout: boolean;
}) {
  const dataScore = Math.min(parsedWorkouts.length / 6, 1) * 50;
  const prScore = prCandidates.length > 0 ? 14 : 0;
  const exactScore = hasExactRecentWorkout ? 18 : 0;
  const mileageScore = Math.min(recentMileageAverage / event.recommendedWeeklyMiles, 1) * 12;
  const goalScore = hasGoalMatch ? 8 : 0;

  return Math.round(Math.min(dataScore + prScore + exactScore + mileageScore + goalScore, 95));
}

function buildExplanation({
  parsedWorkouts,
  profile,
  recentMileageAverage,
  event,
  confidence,
  usedProfilePr,
}: {
  parsedWorkouts: ParsedWorkout[];
  profile: ProfileType;
  recentMileageAverage: number;
  event: EventConfig;
  confidence: PredictionConfidence;
  usedProfilePr: boolean;
}) {
  const lines = [
    `Based on ${parsedWorkouts.length} timed workouts from the last 12 weeks, recent mileage averaging ${recentMileageAverage.toFixed(1)} mi/week, and logged effort levels.`,
  ];

  if (event.category === "speed") {
    lines.push("Shorter events weigh faster, higher-effort sessions and track-style work more heavily.");
  } else if (event.category === "middle") {
    lines.push("Middle-distance predictions balance faster workouts with sustained aerobic sessions.");
  } else {
    lines.push("Longer events weigh recent mileage, tempo work, and aerobic sessions more heavily.");
  }

  if (usedProfilePr) {
    lines.push("Your saved PRs are used as a baseline anchor when recent data supports them.");
  } else if (profile.goalEvent) {
    lines.push(`Your current goal event (${profile.goalEvent}) adds a small context signal to the prediction.`);
  }

  if (confidence === "Low") {
    lines.push("Log more timed workouts to raise confidence and sharpen the estimate.");
  }

  return lines;
}

function buildInfluences(parsedWorkouts: ParsedWorkout[], category: EventConfig["category"]) {
  const topWorkoutTypes = parsedWorkouts
    .map((workout) => workout.type.trim())
    .filter(Boolean)
    .slice(0, 3);

  const influences = [
    `Recent mileage and ${parsedWorkouts.length} timed workouts`,
  ];

  if (category === "speed") {
    influences.push("Speed sessions and higher-effort running");
  } else if (category === "middle") {
    influences.push("Tempo work plus speed support");
  } else {
    influences.push("Tempo, long runs, and aerobic consistency");
  }

  if (topWorkoutTypes.length > 0) {
    influences.push(`Recent sessions like ${topWorkoutTypes.join(", ")}`);
  }

  return influences.slice(0, 3);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
