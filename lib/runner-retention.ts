import type { PRsType, ProfileType } from "@/contexts/profile-context";
import type { WorkoutType } from "@/contexts/workout-context";
import { summarizeRaceGoal } from "@/utils/training-insights";
import {
  getStreakSummary,
  parseDistance,
  parseTimeToSeconds,
} from "@/utils/workout-utils";

type RetentionTone = "up" | "steady" | "focus";

export type RetentionHighlight = {
  title: string;
  detail: string;
  tone: RetentionTone;
};

export type RetentionStreakSummary = {
  current: number;
  best: number;
  label: string;
  detail: string;
};

export type PersonalRecordSnapshot = {
  eventKey: keyof PRsType;
  label: string;
  time: string;
  recentDate?: string;
  badge?: string;
};

export type RaceCountdownSummary = {
  event: string;
  goalTime: string;
  raceDate: string;
  countdownLabel: string;
  progressLabel: string;
  detail: string;
  status: "on-track" | "needs-work" | "upcoming" | "none";
};

const PR_EVENT_RULES: { key: keyof PRsType; label: string; miles: number; tolerance: number }[] = [
  { key: "400", label: "400m", miles: 0.2485, tolerance: 0.02 },
  { key: "800", label: "800m", miles: 0.4971, tolerance: 0.03 },
  { key: "1600", label: "1600m / Mile", miles: 0.9942, tolerance: 0.04 },
  { key: "3200", label: "3200m / 2 Mile", miles: 1.9884, tolerance: 0.06 },
  { key: "5k", label: "5K", miles: 3.1069, tolerance: 0.08 },
  { key: "10k", label: "10K", miles: 6.2137, tolerance: 0.12 },
  { key: "half", label: "Half Marathon", miles: 13.1094, tolerance: 0.2 },
  { key: "marathon", label: "Marathon", miles: 26.2188, tolerance: 0.35 },
];

export function getRetentionStreakSummary(workouts: WorkoutType[], referenceDate = new Date()): RetentionStreakSummary {
  const streak = getStreakSummary(workouts.map((workout) => workout.date), referenceDate);

  if (streak.current >= 5) {
    return {
      ...streak,
      label: `${streak.current}-day streak`,
      detail: `Best streak: ${streak.best} days. You have real momentum right now.`,
    };
  }

  if (streak.current >= 2) {
    return {
      ...streak,
      label: `${streak.current}-day streak`,
      detail: `Best streak: ${streak.best} days. Keep the next run simple and let the week keep building.`,
    };
  }

  if (streak.best >= 3) {
    return {
      ...streak,
      label: streak.current > 0 ? `${streak.current}-day streak` : "Streak paused",
      detail: `Best streak: ${streak.best} days. A single run gets the rhythm going again.`,
    };
  }

  return {
    ...streak,
    label: streak.current > 0 ? `${streak.current}-day streak` : "Fresh week",
    detail: streak.current > 0 ? "Nice start. A steady next run keeps the habit moving." : "Log a run to start building your first consistency streak.",
  };
}

export function getPersonalRecordSnapshots(profile: ProfileType, workouts: WorkoutType[], referenceDate = new Date()) {
  const savedPrs = PR_EVENT_RULES.filter((rule) => Boolean(profile.prs[rule.key]))
    .map((rule) => buildPersonalRecordSnapshot(rule.key, rule.label, profile.prs[rule.key], workouts, referenceDate))
    .filter((snapshot): snapshot is PersonalRecordSnapshot => snapshot !== null);

  return savedPrs.slice(0, 4);
}

export function getRaceCountdownSummary(profile: ProfileType, workouts: WorkoutType[], referenceDate = new Date()): RaceCountdownSummary {
  const primaryGoal = profile.raceGoals[0];

  if (!primaryGoal?.event || !primaryGoal.raceDate) {
    return {
      event: profile.goalEvent || "Goal race",
      goalTime: "",
      raceDate: "",
      countdownLabel: "No goal date saved",
      progressLabel: "Add a race date to unlock countdown feedback",
      detail: "Save a goal race and date to keep your build pointed at something concrete.",
      status: "none",
    };
  }

  const summary = summarizeRaceGoal(primaryGoal, workouts, null, referenceDate);

  return {
    event: primaryGoal.event,
    goalTime: primaryGoal.goalTime,
    raceDate: primaryGoal.raceDate,
    countdownLabel: summary.countdownLabel,
    progressLabel: summary.progressLabel,
    detail: summary.detail,
    status: summary.status,
  };
}

export function getGoalProgressHighlights(profile: ProfileType, workouts: WorkoutType[], referenceDate = new Date()) {
  const streak = getRetentionStreakSummary(workouts, referenceDate);
  const recentWorkouts = [...workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 4);
  const recentMiles = recentWorkouts.reduce((sum, workout) => sum + (parseDistance(workout.distance) ?? 0), 0);
  const longestRecentRun = recentWorkouts.reduce((longest, workout) => Math.max(longest, parseDistance(workout.distance) ?? 0), 0);
  const prSnapshots = getPersonalRecordSnapshots(profile, workouts, referenceDate);
  const countdown = getRaceCountdownSummary(profile, workouts, referenceDate);

  const highlights: RetentionHighlight[] = [];

  if (streak.current >= 3) {
    highlights.push({
      title: "Consistency is showing up",
      detail: `You are on a ${streak.current}-day streak. Keep the next run controlled and let the week keep stacking.`,
      tone: "up",
    });
  } else if (recentWorkouts.length >= 3) {
    highlights.push({
      title: "Recent momentum is solid",
      detail: `${recentWorkouts.length} recent workouts are giving the plan something to build on.`,
      tone: "steady",
    });
  }

  if (longestRecentRun >= 8) {
    highlights.push({
      title: "Endurance marker building",
      detail: `Your recent longest run is ${longestRecentRun.toFixed(1)} miles, which is a solid anchor for the next block.`,
      tone: "up",
    });
  } else if (recentMiles > 0) {
    highlights.push({
      title: "Recent work is adding up",
      detail: `${recentMiles.toFixed(1)} miles across your latest saved runs keeps the fitness picture moving.`,
      tone: "steady",
    });
  }

  if (prSnapshots[0]) {
    highlights.push({
      title: "Best marks stay visible",
      detail: `${prSnapshots[0].label} best: ${prSnapshots[0].time}${prSnapshots[0].badge ? ` (${prSnapshots[0].badge})` : ""}.`,
      tone: "focus",
    });
  }

  if (countdown.status !== "none") {
    highlights.push({
      title: "Goal race stays in view",
      detail: `${countdown.countdownLabel}. ${countdown.detail}`,
      tone: countdown.status === "on-track" ? "up" : "focus",
    });
  }

  if (highlights.length === 0) {
    highlights.push({
      title: "Your progress will get clearer quickly",
      detail: "A few logged runs are enough to unlock streaks, best marks, and more useful goal feedback.",
      tone: "steady",
    });
  }

  return highlights.slice(0, 3);
}

function buildPersonalRecordSnapshot(
  eventKey: keyof PRsType,
  label: string,
  time: string,
  workouts: WorkoutType[],
  referenceDate: Date
) {
  if (!time) {
    return null;
  }

  const prSeconds = parseTimeToSeconds(time);
  const rule = PR_EVENT_RULES.find((entry) => entry.key === eventKey);

  if (!prSeconds || !rule) {
    return {
      eventKey,
      label,
      time,
    };
  }

  const recentMatchingWorkout = [...workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .find((workout) => {
      const workoutMiles = parseDistance(workout.distance);
      const workoutSeconds = parseTimeToSeconds(workout.time);

      if (!workoutMiles || !workoutSeconds) {
        return false;
      }

      return Math.abs(workoutMiles - rule.miles) <= rule.tolerance && workoutSeconds === prSeconds;
    });

  const recentDate = recentMatchingWorkout?.date;
  const isRecent =
    recentDate !== undefined &&
    Math.abs(referenceDate.getTime() - new Date(recentDate).getTime()) <= 1000 * 60 * 60 * 24 * 45;

  return {
    eventKey,
    label,
    time,
    recentDate,
    badge: isRecent ? "Recent best" : undefined,
  };
}

export function formatPersonalRecordDate(dateValue?: string) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getRetentionToneColor(tone: RetentionTone) {
  switch (tone) {
    case "up":
      return "#4ade80";
    case "focus":
      return "#67e8f9";
    default:
      return "#93c5fd";
  }
}
