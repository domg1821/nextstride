import type { ProfileType } from "@/contexts/profile-context";
import type { EngineRecord } from "@/contexts/engine-context";
import type { WorkoutType } from "@/contexts/workout-context";
import { getDailyFuelingSummary, getFuelingStatusForRecovery } from "@/lib/fueling-tracker";
import { getUnifiedRecoveryState } from "@/lib/recovery-engine";

export type EngineLevel = "good" | "moderate" | "attention";
export type EngineCategoryKey = "sleep" | "heart-rate" | "fueling" | "recovery";

export type EngineCard = {
  key: EngineCategoryKey;
  title: string;
  value: string;
  label: string;
  impact: string;
  status: EngineLevel;
  secondaryValue?: string;
};

export type EngineOverview = {
  status: EngineLevel;
  title: string;
  summary: string;
};

export function getEngineOverview(engine: EngineRecord, workouts: WorkoutType[]): EngineOverview {
  const recovery = getUnifiedRecoveryState(engine, workouts);
  const status: EngineLevel =
    recovery.status === "high" ? "good" : recovery.status === "moderate" ? "moderate" : "attention";

  return {
    status,
    title: status === "good" ? "Good" : status === "moderate" ? "Moderate" : "Needs attention",
    summary: recovery.explanation,
  };
}

export function getEngineCards(engine: EngineRecord, workouts: WorkoutType[], _profile: ProfileType): EngineCard[] {
  const sleepScore = getSleepScoreValue(engine);
  const restingHr = Number.parseFloat(engine.restingHr);
  const recovery = getUnifiedRecoveryState(engine, workouts);
  const todayFueling = getDailyFuelingSummary(engine, workouts, new Date().toISOString().slice(0, 10));
  const fuelingStatus = getFuelingStatusForRecovery(engine, workouts);

  return [
    {
      key: "sleep",
      title: "Sleep",
      value: engine.sleepHours ? `${engine.sleepHours} hrs` : "Add sleep",
      label: sleepScore !== null ? `${sleepScore}/100 score` : capitalize(engine.sleepQuality),
      impact:
        engine.sleepQuality === "solid"
          ? "Sleep should support steadier pace and better patience in workouts."
          : engine.sleepQuality === "mixed"
            ? "Sleep may make harder sessions feel a little heavier than normal."
            : "Low sleep can raise perceived effort and make recovery slower.",
      status: getSleepScore(engine) >= 2 ? "good" : getSleepScore(engine) >= 1 ? "moderate" : "attention",
      secondaryValue: engine.sleepQuality === "solid" ? "Great" : engine.sleepQuality === "mixed" ? "Okay" : "Poor",
    },
    {
      key: "heart-rate",
      title: "Heart Rate",
      value: engine.restingHr ? `${engine.restingHr} bpm` : "Add resting HR",
      label:
        engine.heartRateTrend === "stable"
          ? "Stable"
          : engine.heartRateTrend === "slightly_up"
            ? "Slightly up"
            : "Elevated",
      impact:
        !Number.isNaN(restingHr) && restingHr > 0
          ? engine.heartRateTrend === "stable"
            ? "Heart-rate signals look steady for normal training."
            : engine.heartRateTrend === "slightly_up"
              ? "A small HR rise can be an early sign to keep effort honest."
              : "An elevated resting HR often means fatigue or under-recovery is affecting training."
          : "Add a resting HR to get a clearer readiness read tied to training.",
      status: getHeartRateScore(engine) >= 2 ? "good" : getHeartRateScore(engine) >= 1 ? "moderate" : "attention",
      secondaryValue: engine.activeHr ? `Active avg ${engine.activeHr} bpm` : "Active HR optional",
    },
    {
      key: "fueling",
      title: "Fueling",
      value: todayFueling.eatenCalories > 0 ? `${todayFueling.eatenCalories} cal` : "Log meals",
      label: todayFueling.statusLabel,
      impact: todayFueling.insight,
      status: getFuelingScore(fuelingStatus) >= 2 ? "good" : getFuelingScore(fuelingStatus) >= 1 ? "moderate" : "attention",
      secondaryValue:
        todayFueling.eatenCalories > 0 || todayFueling.burnedCalories > 0
          ? `${todayFueling.burnedCalories} burned • ${todayFueling.netCalories} net`
          : "Track breakfast, lunch, dinner, and snacks",
    },
    {
      key: "recovery",
      title: "Recovery",
      value: recovery.title,
      label: `${recovery.percent}% readiness`,
      impact:
        recovery.adjustment.level === "push"
          ? "Recovery is supporting normal training load."
          : recovery.adjustment.level === "maintain"
            ? "Keep the next hard effort controlled so the week stays productive."
            : "Recovery is the limiter right now, so effort-based running is the smarter call.",
      status: recovery.status === "high" ? "good" : recovery.status === "moderate" ? "moderate" : "attention",
      secondaryValue: recovery.explanation,
    },
  ];
}

export function getEngineDetailCopy(category: EngineCategoryKey, engine: EngineRecord, workouts: WorkoutType[]) {
  const sleepInsight = getSleepInsight(engine);
  const heartRateInsight = getHeartRateInsight(engine);
  const recovery = getUnifiedRecoveryState(engine, workouts);
  const todayFueling = getDailyFuelingSummary(engine, workouts, new Date().toISOString().slice(0, 10));
  const fuelingStatus = getFuelingStatusForRecovery(engine, workouts);

  switch (category) {
    case "sleep":
      return {
        title: "Sleep and running",
        subtitle: "Use sleep to understand whether pace, focus, and recovery are likely to hold up normally.",
        insight: sleepInsight,
        coachTip:
          engine.sleepQuality === "solid"
            ? "Sleep is doing its job. Keep hard days specific and let easy days stay easy."
            : engine.sleepQuality === "mixed"
              ? "If sleep is mixed, be conservative early in workouts and let effort guide the pace."
              : "Low sleep is a real training signal. Prioritize effort over pace and avoid forcing quality if the body does not come around.",
      };
    case "heart-rate":
      return {
        title: "Heart rate and readiness",
        subtitle: "A steady resting HR usually supports normal training. A rising one can hint at fatigue or recovery cost.",
        insight: heartRateInsight,
        coachTip:
          engine.heartRateTrend === "stable"
            ? "HR looks steady enough for normal training rhythm."
            : engine.heartRateTrend === "slightly_up"
              ? "Treat a slightly elevated HR as a caution light, not a panic signal."
              : "When resting HR is elevated, the best move is often to keep the next run controlled and reassess after.",
      };
    case "fueling":
      return {
        title: "Fueling for training quality",
        subtitle:
          "Track enough to understand whether your daily intake is supporting the running, not to build a generic diet app.",
        insight: todayFueling.insight,
        coachTip:
          fuelingStatus === "solid"
            ? "Fueling is supporting the work well. Keep pre-run and post-run habits consistent."
            : fuelingStatus === "mixed"
              ? "A steadier recovery meal and one cleaner carb choice before tougher runs would help sessions land better."
              : "If fueling is low, simplify the day, recover first, and stop chasing pace until the basics are back in place.",
      };
    default:
      return {
        title: "Recovery and training load",
        subtitle: "Recovery should answer one question: can the body absorb the next session well enough for it to help?",
        insight: recovery.explanation,
        coachTip: recovery.adjustment.explanation,
      };
  }
}

function getSleepScore(engine: EngineRecord) {
  const hours = Number.parseFloat(engine.sleepHours);

  if (engine.sleepQuality === "poor" || (!Number.isNaN(hours) && hours < 6)) {
    return 0;
  }

  if (engine.sleepQuality === "mixed" || (!Number.isNaN(hours) && hours < 7)) {
    return 1;
  }

  return 2;
}

function getHeartRateScore(engine: EngineRecord) {
  if (engine.heartRateTrend === "elevated") {
    return 0;
  }

  if (engine.heartRateTrend === "slightly_up") {
    return 1;
  }

  return 2;
}

function getFuelingScore(fuelingStatus: "solid" | "mixed" | "low") {
  if (fuelingStatus === "low") {
    return 0;
  }

  if (fuelingStatus === "mixed") {
    return 1;
  }

  return 2;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

export function getSleepScoreValue(engine: EngineRecord) {
  if (typeof engine.sleepScore === "number") {
    return Math.max(0, Math.min(engine.sleepScore, 100));
  }

  const hours = Number.parseFloat(engine.sleepHours);

  if (Number.isNaN(hours) || hours <= 0) {
    return null;
  }

  const hourScore = Math.max(0, Math.min(Math.round((hours / 8) * 70), 70));
  const qualityScore = engine.sleepQuality === "solid" ? 30 : engine.sleepQuality === "mixed" ? 18 : 6;
  return Math.max(0, Math.min(hourScore + qualityScore, 100));
}

export function getSleepInsight(engine: EngineRecord) {
  const score = getSleepScoreValue(engine);

  if (score === null) {
    return "Add sleep hours and an optional quality read to see how sleep may affect training today.";
  }

  if (score >= 80) {
    return "Sleep should support steadier endurance and better patience in workouts today.";
  }

  if (score >= 60) {
    return "Sleep may slightly affect endurance today, so keep the first half of the run controlled.";
  }

  return "Low sleep may make pace and recovery feel more expensive today, especially in harder sessions.";
}

export function getHeartRateInsight(engine: EngineRecord) {
  if (!engine.restingHr) {
    return "Add a resting HR to get a clearer read on fatigue and readiness.";
  }

  if (engine.heartRateTrend === "stable") {
    return "Resting HR looks steady, which supports normal training readiness.";
  }

  if (engine.heartRateTrend === "slightly_up") {
    return "Resting HR is slightly elevated, so harder running may feel a bit heavier than usual.";
  }

  return "Resting HR is elevated, which can be a sign of fatigue or under-recovery affecting training.";
}
