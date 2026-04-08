import type { WorkoutPreferenceCategory } from "@/lib/training-plan";

export type ConditionRunType = "outside" | "treadmill";
export type ConditionExposure = "sunny" | "shaded" | "cloudy";
export type ConditionCautionLevel = "low" | "moderate" | "high";

export type ConditionTrainingInput = {
  plannedWorkout: {
    category?: WorkoutPreferenceCategory | null;
    title?: string | null;
    details?: string | null;
  } | null;
  conditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    runType: ConditionRunType;
    exposure?: ConditionExposure | null;
    feelsLikeNote?: string | null;
  };
};

export type ConditionTrainingResult = {
  adjustedPaceText: string;
  adjustedEffortText: string;
  adjustedHeartRateText: string;
  hydrationNote: string;
  cautionLevel: ConditionCautionLevel;
  recommendation: string;
};

export function evaluateConditionTraining(input: ConditionTrainingInput): ConditionTrainingResult {
  const category = input.plannedWorkout?.category ?? "easy";
  const { temperature, humidity, windSpeed, runType, exposure } = input.conditions;

  const temperatureImpact =
    temperature >= 88 ? 3.4 : temperature >= 80 ? 2.4 : temperature >= 72 ? 1.3 : temperature >= 64 ? 0.5 : 0;
  const humidityImpact =
    humidity >= 80 ? 2.4 : humidity >= 65 ? 1.5 : humidity >= 50 ? 0.8 : 0;
  const windImpact =
    runType === "outside"
      ? windSpeed >= 18
        ? 1.2
        : windSpeed >= 12
          ? 0.7
          : windSpeed >= 8
            ? 0.3
            : 0
      : 0;
  const exposureImpact = exposure === "sunny" ? 0.8 : exposure === "cloudy" ? 0.2 : 0;
  const treadmillModifier = runType === "treadmill" ? 0.35 : 1;
  const totalImpact = (temperatureImpact + humidityImpact + windImpact + exposureImpact) * treadmillModifier;
  const cautionLevel: ConditionCautionLevel =
    totalImpact >= 4.5 ? "high" : totalImpact >= 2 ? "moderate" : "low";

  const paceAdjustment = getPaceAdjustment(category, cautionLevel, runType);
  const hydrationNote = getHydrationNote(cautionLevel, temperature, humidity, runType);

  return {
    adjustedPaceText: getAdjustedPaceText(category, cautionLevel, paceAdjustment, runType),
    adjustedEffortText: getAdjustedEffortText(category, cautionLevel),
    adjustedHeartRateText: getAdjustedHeartRateText(cautionLevel, runType),
    hydrationNote,
    cautionLevel,
    recommendation: getRecommendation(category, cautionLevel, runType),
  };
}

function getPaceAdjustment(
  category: WorkoutPreferenceCategory,
  cautionLevel: ConditionCautionLevel,
  runType: ConditionRunType
) {
  if (category === "easy" || category === "recovery" || category === "rest") {
    if (cautionLevel === "high") return runType === "treadmill" ? "pace can drift" : "pace can drift 10-20 sec/mi";
    if (cautionLevel === "moderate") return runType === "treadmill" ? "pace can drift slightly" : "pace can drift 5-12 sec/mi";
    return "pace can stay close to normal";
  }

  if (cautionLevel === "high") return runType === "treadmill" ? "back off slightly from normal targets" : "back off roughly 10-25 sec/mi";
  if (cautionLevel === "moderate") return runType === "treadmill" ? "trim pace slightly" : "trim pace roughly 5-15 sec/mi";
  return "planned pace is still reasonable";
}

function getAdjustedPaceText(
  category: WorkoutPreferenceCategory,
  cautionLevel: ConditionCautionLevel,
  paceAdjustment: string,
  runType: ConditionRunType
) {
  if (category === "easy" || category === "recovery" || category === "rest") {
    return cautionLevel === "low"
      ? "Keep pace relaxed and conversational. Conditions should not force much change."
      : `Treat pace as secondary today. ${capitalize(paceAdjustment)} and let effort lead.`;
  }

  if (category === "long") {
    return cautionLevel === "high"
      ? `Long-run pace should soften today. ${capitalize(paceAdjustment)} and keep the whole run aerobic.`
      : cautionLevel === "moderate"
        ? `Long-run pace should be a touch easier. ${capitalize(paceAdjustment)} if breathing rises too quickly.`
        : "Long-run pace can stay close to plan if the effort still feels controlled.";
  }

  return cautionLevel === "high"
    ? `Workout pace should be adjusted today. ${capitalize(paceAdjustment)} and protect the quality of the full session.`
    : cautionLevel === "moderate"
      ? `Use a lighter pace target than normal. ${capitalize(paceAdjustment)} if the effort rises early.`
      : runType === "treadmill"
        ? "Conditions are fairly manageable. Planned pace can stay close to normal if the effort is steady."
        : "Planned pace can stay close to normal, but still check effort during the opening minutes.";
}

function getAdjustedEffortText(category: WorkoutPreferenceCategory, cautionLevel: ConditionCautionLevel) {
  if (category === "easy" || category === "recovery" || category === "rest") {
    return cautionLevel === "low"
      ? "Effort target stays easy. Keep the run relaxed and smooth."
      : "Effort target stays easy. Ignore pace if needed and keep the run comfortable.";
  }

  if (category === "long") {
    return cautionLevel === "high"
      ? "Keep long-run effort at the low end of steady. This is a better day to run by feel than pace."
      : "Keep long-run effort steady and patient, especially early.";
  }

  if (cautionLevel === "high") {
    return "Keep the session by effort, not ego. Hit the workout purpose without forcing goal splits.";
  }

  if (cautionLevel === "moderate") {
    return "Keep the effort target the same, but expect the pace to look a little slower than usual.";
  }

  return "Effort target can stay close to normal if the opening minutes feel controlled.";
}

function getAdjustedHeartRateText(cautionLevel: ConditionCautionLevel, runType: ConditionRunType) {
  if (runType === "treadmill") {
    return cautionLevel === "high"
      ? "Heart rate may still sit 3-6 bpm above normal if the room is warm."
      : "Heart rate should stay fairly close to normal indoors.";
  }

  if (cautionLevel === "high") {
    return "Heart rate may run about 6-10 bpm higher than usual. Back off if it climbs early and stays high.";
  }

  if (cautionLevel === "moderate") {
    return "Heart rate may run about 3-6 bpm higher than usual, especially if humidity is noticeable.";
  }

  return "Heart rate should stay close to normal, with only a small bump from conditions if any.";
}

function getHydrationNote(
  cautionLevel: ConditionCautionLevel,
  temperature: number,
  humidity: number,
  runType: ConditionRunType
) {
  if (runType === "treadmill" && cautionLevel === "low") {
    return "A normal pre-run drink is probably enough unless the room is warm.";
  }

  if (cautionLevel === "high" || temperature >= 82 || humidity >= 75) {
    return "Drink before the run and strongly consider carrying fluids or planning a loop where you can sip during the session.";
  }

  if (cautionLevel === "moderate") {
    return "Drink before the run and keep fluids nearby if the session is longer or harder than usual.";
  }

  return "Standard hydration should be fine, but still start the run topped up.";
}

function getRecommendation(
  category: WorkoutPreferenceCategory,
  cautionLevel: ConditionCautionLevel,
  runType: ConditionRunType
) {
  if (runType === "treadmill" && cautionLevel !== "low") {
    return "If you want cleaner execution today, treadmill running is a good option.";
  }

  if (cautionLevel === "high") {
    return category === "easy" || category === "recovery"
      ? "Today is a better day to run by effort than pace."
      : "Start by effort, watch heart rate early, and be willing to trim pace or volume if the session feels expensive too soon.";
  }

  if (cautionLevel === "moderate") {
    return "Open a little easier than usual and let the weather decide whether pace needs to move.";
  }

  return "Conditions look manageable. Stay aware early, then settle into the planned purpose.";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
