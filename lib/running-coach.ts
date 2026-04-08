import type { ProfileType, RaceGoalType } from "@/contexts/profile-context";
import type { WorkoutType } from "@/contexts/workout-context";
import { formatDuration, parseDistance, parseTimeToSeconds } from "@/utils/workout-utils";

export type RunningCoachContext = {
  profile: Pick<ProfileType, "goalEvent" | "mileage" | "pr5k" | "prs" | "raceGoals" | "runnerLevel" | "preferredTrainingDays">;
  workouts: WorkoutType[];
  todayWorkout?: {
    title: string;
    details: string;
    distance: number;
    kind: string;
  } | null;
  weeklySummary?: {
    totalMiles: number;
    runCount: number;
    averageEffort: number | null;
  };
  streak?: number;
  adaptiveFeedback?: string[];
  recovery?: {
    percent: number;
    status: "high" | "moderate" | "low";
    explanation: string;
    recommendation: string;
    adjustment: "push" | "maintain" | "ease_off";
  };
  engine?: {
    sleepHours: string;
    sleepQuality: "solid" | "mixed" | "poor";
    sleepScore: number | null;
    restingHr: string;
    heartRateTrend: "stable" | "slightly_up" | "elevated";
    fuelingStatus: "solid" | "mixed" | "low";
    fatigueLevel: "fresh" | "steady" | "heavy";
  };
  fuelingToday?: {
    eatenCalories: number;
    burnedCalories: number;
    netCalories: number;
    status: "underfueled" | "balanced" | "well_fueled";
    statusLabel: string;
    insight: string;
  };
};

export const RUNNING_COACH_SUGGESTIONS = [
  "Help with today's workout",
  "Why did my last run feel hard?",
  "Am I on track for my goal race?",
  "What pace should I run today?",
  "How should I recover after a hard run?",
];

type CalculationResult = {
  answer: string;
};

type CoachSummary = {
  mileageGoal: number;
  goalEventLabel: string;
  goalRace: RaceGoalType | null;
  pr5k: string;
  runnerLevel: ProfileType["runnerLevel"];
  preferredTrainingDays: number;
  recentWorkout: WorkoutType | null;
  recentWorkouts: WorkoutType[];
  recentTimedRuns: number;
  recentHighEffort: boolean;
  averageRecentEffort: number | null;
  recentWorkoutTypes: string[];
  consistency: "low" | "solid" | "strong";
  weeklyMiles: number;
  weeklyRunCount: number;
  streak: number;
  workloadStatus: "below_goal" | "on_track" | "above_goal";
  recoveryPercent: number | null;
  recoveryStatus: "high" | "moderate" | "low" | null;
  recoveryAdjustment: "push" | "maintain" | "ease_off" | null;
  recoveryExplanation: string;
  adaptiveFeedback: string[];
  fuelingStatusLabel: string | null;
  fuelingInsight: string | null;
  fuelingStatus: RunningCoachContext["fuelingToday"] extends infer T ? T extends { status: infer S } ? S : null : null;
  eatenCalories: number | null;
  burnedCalories: number | null;
  netCalories: number | null;
  sleepScore: number | null;
  sleepHours: string | null;
  sleepQuality: RunningCoachContext["engine"] extends infer T ? T extends { sleepQuality: infer S } ? S : null : null;
  restingHr: string | null;
  heartRateTrend: "stable" | "slightly_up" | "elevated" | null;
  fatigueLevel: "fresh" | "steady" | "heavy" | null;
  todayWorkout: RunningCoachContext["todayWorkout"];
};

type CoachCategory =
  | "workout_explanation"
  | "pacing_guidance"
  | "recovery_advice"
  | "race_prediction"
  | "training_adjustment"
  | "fueling"
  | "heart_rate"
  | "injury"
  | "general";

type CoachReplyParts = {
  answer: string;
  context: string;
  nextStep: string;
  assumption?: string;
  followUp?: string;
};

export function getRunningCoachReply(input: string, context: RunningCoachContext) {
  const question = normalizeQuestion(input);
  const summary = summarizeContext(context);
  const calculation = getCalculationReply(question);

  if (calculation) {
    return calculation.answer;
  }

  if (!isRunningQuestion(question)) {
    return "I can help best with running, training, pacing, recovery, and race prep. What would you like help with there?";
  }

  const category = classifyQuestion(question);

  switch (category) {
    case "workout_explanation":
      return formatCoachReply(buildWorkoutExplanationReply(question, summary));
    case "pacing_guidance":
      return formatCoachReply(buildPacingReply(question, summary));
    case "recovery_advice":
      return formatCoachReply(buildRecoveryReply(question, summary));
    case "race_prediction":
      return formatCoachReply(buildRaceReply(question, summary));
    case "training_adjustment":
      return formatCoachReply(buildTrainingAdjustmentReply(question, summary));
    case "fueling":
      return formatCoachReply(buildFuelingReply(question, summary));
    case "heart_rate":
      return formatCoachReply(buildHeartRateReply(question, summary));
    case "injury":
      return formatCoachReply(buildInjuryReply(summary));
    default:
      return formatCoachReply(buildGeneralReply(summary));
  }
}

function buildWorkoutExplanationReply(question: string, summary: CoachSummary): CoachReplyParts {
  if (summary.todayWorkout) {
    const purpose = getWorkoutPurpose(summary.todayWorkout.title, summary.todayWorkout.kind);
    const effort = getWorkoutEffortCue(summary.todayWorkout.title, summary.todayWorkout.kind);

    return {
      answer: `Today's workout is ${summary.todayWorkout.title.toLowerCase()}. ${purpose}`,
      context: `${summary.todayWorkout.details} ${effort}`,
      nextStep: summary.recentHighEffort
        ? "Keep the first part extra controlled because your recent running has leaned hard."
        : "Run the opening minutes calmly and let the workout come to you.",
    };
  }

  if (question.includes("tempo") || question.includes("threshold")) {
    return {
      answer: "Tempo work is there to build stamina at a strong but controlled effort.",
      context: "It should feel steady and honest, not like you are racing from the first minute.",
      nextStep: "If breathing is ragged early, back off a little and hold rhythm instead.",
    };
  }

  if (question.includes("long run")) {
    return {
      answer: "The long run is mainly for endurance and durability.",
      context: "Most of the value comes from staying aerobic enough to recover and train again well.",
      nextStep: "Keep it patient early and only finish stronger if the plan clearly calls for that.",
    };
  }

  return {
    answer: "The workout purpose should tell you what to prioritize: easy means relaxed, quality means controlled work, recovery means absorbing training.",
    context: "The best running advice always starts with the job of the session rather than treating every run the same way.",
    nextStep: "Ask about the specific session and I can make the target feel clearer.",
  };
}

function buildPacingReply(question: string, summary: CoachSummary): CoachReplyParts {
  if (summary.todayWorkout) {
    const workoutType = `${summary.todayWorkout.title} ${summary.todayWorkout.kind}`.toLowerCase();

    if (workoutType.includes("easy") || workoutType.includes("recovery")) {
      return {
        answer: "Run today by easy effort, not by a fixed pace.",
        context: summary.recentHighEffort
          ? "Recent effort has been high enough that forcing an easy-day split would just add more fatigue. Keep it conversational from the start."
          : "The point of an easy run is low stress aerobic work, so the pace only matters if it stays relaxed and conversational.",
        nextStep: "If breathing gets choppy or you feel yourself pressing to hold a number, slow down and make the run feel smoother.",
      };
    }

    if (workoutType.includes("tempo") || workoutType.includes("threshold")) {
      return {
        answer: "For today's workout, chase rhythm before pace.",
        context: summary.pr5k
          ? `Your ${summary.pr5k} 5K PR gives useful context, but the better target is controlled discomfort you can hold evenly rather than one perfect split.`
          : "Without a recent benchmark, effort is a better guide than forcing a split that may not match current fitness.",
        nextStep: "Start the first rep or first block slightly conservative and settle into a pace you could repeat cleanly.",
      };
    }
  }

  if (summary.pr5k) {
    return {
      answer: "Use effort first and your benchmark second.",
      context: `With a ${summary.pr5k} 5K PR on file, pacing should still feel controlled enough that you are not fading halfway through.`,
      nextStep: "Start a touch conservative and aim to finish stronger than you started.",
    };
  }

  return {
    answer: "The right pace depends on the session and your current fitness.",
    context: "Exact splits only make sense when they are tied to workout purpose, recent fitness, and current fatigue.",
    nextStep: "Tell me the workout or goal race and I can narrow the pace guidance much more precisely.",
    assumption: "I do not have enough detail yet to give an exact pace range.",
    followUp: "What workout are you running today?",
  };
}

function buildRecoveryReply(question: string, summary: CoachSummary): CoachReplyParts {
  if (question.includes("skip") && summary.todayWorkout) {
    if (summary.recoveryAdjustment === "ease_off") {
      return {
        answer: "You should strongly consider modifying or skipping the quality part of today's session.",
        context: `${summary.recoveryExplanation} That is not a strong setup for forcing a hard day.`,
        nextStep: "Warm up first, then convert it to an easy aerobic run or take the rest day if the body still feels flat.",
      };
    }

    return {
      answer: "Do not skip it automatically, but earn the workout in the warm-up.",
      context: summary.recoveryAdjustment === "maintain"
        ? `${summary.recoveryExplanation} You can still train, but the session should start more controlled than usual.`
        : "Your readiness looks good enough to try the planned session if the warm-up feels normal.",
      nextStep: "Give yourself 10-15 easy minutes, then keep the workout only if rhythm and breathing settle well.",
    };
  }

  if (summary.recentWorkout) {
    const recentLabel = `${summary.recentWorkout.type || "run"} at effort ${summary.recentWorkout.effort}/10`;

    if (summary.recentWorkout.effort >= 8 || question.includes("hard") || question.includes("bad")) {
      return {
        answer: getHardRunHeadline(summary),
        context: [
          `Your recent run was ${recentLabel}.`,
          buildRecentWorkoutContext(summary),
          summary.recoveryExplanation,
          buildConditionContext(summary),
          summary.fuelingInsight,
        ]
          .filter(Boolean)
          .join(" "),
        nextStep: "Keep the next 24-48 hours easy, avoid trying to make up pace, and get back to normal intensity only when an easy run feels smooth again.",
      };
    }
  }

  return {
    answer: summary.recoveryAdjustment === "ease_off"
      ? "Recovery is the limiter right now."
      : summary.recoveryAdjustment === "maintain"
        ? "Recovery is workable but not perfect."
        : "Recovery looks supportive today.",
    context: summary.consistency === "strong"
      ? `${summary.recoveryExplanation} Your consistency is good enough that protecting the next quality day matters more than squeezing in extra work.`
      : `${summary.recoveryExplanation} When training is uneven, fatigue hides fitness fast.`,
    nextStep: summary.recoveryAdjustment === "ease_off"
      ? "Keep the next run short and easy, prioritize sleep and food tonight, and skip extra intensity until the body feels normal again."
      : "Use easy effort, steady fueling, and a normal night of sleep to set up the next quality session.",
  };
}

function buildRaceReply(_question: string, summary: CoachSummary): CoachReplyParts {
  if (summary.goalRace?.event) {
    const countdown = summary.goalRace.raceDate ? getRaceCountdown(summary.goalRace.raceDate) : null;

    return {
      answer: `Judge the block against your ${summary.goalRace.event} goal, not one good or bad run.`,
      context: [
        summary.goalRace.goalTime ? `Goal time is ${summary.goalRace.goalTime}.` : null,
        countdown,
        summary.consistency === "strong"
          ? "Recent consistency looks strong enough to keep building."
          : summary.consistency === "solid"
            ? "Consistency looks decent, so steady training matters more than forcing breakthroughs."
            : "Consistency looks light right now, so the safest win is stacking more good weeks first.",
        summary.weeklyMiles > 0 ? `This week is at ${summary.weeklyMiles.toFixed(1)} miles against a goal of about ${summary.mileageGoal}.` : null,
      ]
        .filter(Boolean)
        .join(" "),
      nextStep: "Ask me whether your recent training supports that specific goal time and I will give you a more direct read.",
    };
  }

  if (summary.goalEventLabel !== "running") {
    return {
      answer: `You do have a ${summary.goalEventLabel} focus, which helps frame the training.`,
      context: "A clear race distance changes how workouts, long runs, and pacing guidance should be interpreted even before a full goal is set.",
      assumption: "I do not have a goal date or goal time saved yet.",
      nextStep: "Add a goal race and time if you want sharper prediction-style guidance.",
    };
  }

  return {
    answer: "I can talk race prediction, but I need a race goal to make it meaningful.",
    context: "Prediction only means something when it is tied to a distance and recent training context.",
    nextStep: "Set a goal race or tell me the distance you care about most right now.",
  };
}

function buildTrainingAdjustmentReply(question: string, summary: CoachSummary): CoachReplyParts {
  const struggling =
    summary.consistency === "low" || summary.recentHighEffort || (summary.averageRecentEffort ?? 0) >= 7.5;
  const thriving =
    summary.consistency === "strong" &&
    !summary.recentHighEffort &&
    (summary.averageRecentEffort === null || summary.averageRecentEffort <= 6.5);

  if (question.includes("increase") || thriving) {
    if (thriving) {
      return {
        answer: "A small increase is reasonable.",
        context: "Your recent training looks consistent without obvious overload.",
        nextStep: "Think slight progression, not a big jump. More is only useful if easy days still feel easy.",
      };
    }
  }

  if (question.includes("reduce") || struggling) {
    return {
      answer: "I would lean hold or slightly reduce right now.",
      context: summary.recentHighEffort
        ? `Recent effort has been high, so forcing more would probably blunt the next good session. ${buildConditionContext(summary)}`
        : `The recent pattern does not really support a clean increase yet. ${buildConditionContext(summary)}`,
      nextStep: "Keep the next few days controlled, then build again once rhythm returns.",
    };
  }

  return {
    answer: "Holding steady looks like the smartest call.",
    context: "There is enough training there to keep progressing, but not a strong reason to press harder this second.",
    nextStep: "Aim for another solid week before trying to add more load.",
  };
}

function buildFuelingReply(question: string, summary: CoachSummary): CoachReplyParts {
  if (question.includes("before")) {
    return {
      answer: "Before a run, keep food simple and easy to digest.",
      context: "The goal is usable carbohydrate without stomach stress. The longer or harder the run, the more important that becomes.",
      nextStep: "Use a light carb-based snack 30-90 minutes before if needed, and avoid starting harder sessions underfueled.",
    };
  }

  if (question.includes("after") || question.includes("recover")) {
    return {
      answer: "After a hard or long run, eat soon enough that recovery starts the same day.",
      context: "Post-run fueling helps restore glycogen, supports muscle repair, and makes the next run feel more normal instead of flat.",
      nextStep: "Within about an hour, get carbohydrate plus protein, fluids, and enough total intake that you are not still digging out by evening.",
    };
  }

  return {
    answer: summary.fuelingStatusLabel === "Underfueled"
      ? "Fueling looks too light for the running you are doing."
      : "Fueling should support the work, not become its own project.",
    context:
      [
        summary.fuelingInsight ?? "For runners, the main question is whether intake is helping you train and recover, especially around harder and longer sessions.",
        buildFuelingContext(summary),
      ]
        .filter(Boolean)
        .join(" "),
    nextStep: summary.fuelingStatusLabel === "Underfueled"
      ? "Fix the basics first: eat earlier after runs, add an easy carb source before quality days, and stop trying to train hard on low intake."
      : "Keep your pre-run and post-run habits repeatable so energy and recovery stay steadier across the week.",
  };
}

function buildHeartRateReply(_question: string, summary: CoachSummary): CoachReplyParts {
  return {
    answer: summary.heartRateTrend === "elevated"
      ? "A higher heart rate usually means the day should stay more controlled."
      : "Heart rate is useful when it confirms how the run feels, not when it overrides everything else.",
    context: summary.heartRateTrend === "elevated"
      ? `In running, HR often rises when recovery, heat, dehydration, or residual fatigue are pushing the body harder than normal for the same pace. ${buildHeartRateContext(summary)}`
      : `Your current HR trend reads ${summary.heartRateTrend ?? "unclear"}. ${buildHeartRateContext(summary)} HR is most useful as a readiness and pacing check alongside breathing, legs, and workout purpose.`,
    nextStep: summary.heartRateTrend === "elevated"
      ? "Run by effort instead of forcing pace, keep the session aerobic, and reassess after an easy day or two. If it is severe or persistent, get medical advice."
      : "Use HR to keep easy runs honest and to flag unusual fatigue, but let effort be the tie-breaker when conditions are off.",
  };
}

function buildInjuryReply(_summary: CoachSummary): CoachReplyParts {
  return {
    answer: "If something feels injury-like, reduce stress first and do not try to train through worsening pain.",
    context: "I can help with basic running guidance, but I cannot diagnose an injury. Pain that changes your stride or gets worse during the run usually means the load is too high right now.",
    nextStep: "Cut intensity, shorten or stop the run if mechanics change, and get evaluated by a qualified professional if pain is sharp, worsening, or not settling quickly.",
  };
}

function buildGeneralReply(summary: CoachSummary): CoachReplyParts {
  if (summary.todayWorkout) {
    return {
      answer: `Start with today's workout: ${summary.todayWorkout.title}.`,
      context: `That is usually the clearest way to make the coach useful because it anchors pacing, effort, recovery, and how the day fits your goal. ${buildConditionContext(summary)}`,
      nextStep: "Ask what it should feel like, how to pace it, or how it fits your goal.",
    };
  }

  return {
    answer: "I can help most when the question is specific to your running.",
    context: "Workouts, pacing, recovery, goal races, and recent effort are all fair game.",
    nextStep: "Try asking about your next run or the last session that felt off.",
  };
}

function formatCoachReply(parts: CoachReplyParts) {
  return [
    `Short answer: ${parts.answer}`,
    `Why: ${parts.context}${parts.assumption ? ` Assumption: ${parts.assumption}` : ""}`,
    `What to do next: ${parts.nextStep}`,
    parts.followUp ? `Follow-up: ${parts.followUp}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function classifyQuestion(question: string): CoachCategory {
  if (hasAny(question, ["pain", "injury", "injured", "hurt", "knee", "shin", "achilles", "hamstring"])) {
    return "injury";
  }

  if (
    hasAny(question, [
      "today",
      "today's workout",
      "help with today",
      "what is the purpose",
      "purpose",
      "explain workout",
      "what should this feel like",
      "what should my long run feel like",
    ])
  ) {
    return "workout_explanation";
  }

  if (hasAny(question, ["pace", "pacing", "split", "splits"])) {
    return "pacing_guidance";
  }

  if (hasAny(question, ["food", "eat", "eating", "fuel", "fueling", "calories", "carb", "carbs", "protein", "gel", "hydration"])) {
    return "fueling";
  }

  if (hasAny(question, ["heart rate", "hr", "bpm", "pulse"])) {
    return "heart_rate";
  }

  if (hasAny(question, ["recover", "recovery", "rest", "fatigue", "tired", "sore", "hard"])) {
    return "recovery_advice";
  }

  if (hasAny(question, ["goal", "goal race", "prediction", "on track", "race", "target"])) {
    return "race_prediction";
  }

  if (hasAny(question, ["adjust", "increase", "reduce", "hold", "mileage", "how often", "consistency"])) {
    return "training_adjustment";
  }

  return "general";
}

function summarizeContext(context: RunningCoachContext): CoachSummary {
  const mileageGoal = Number.parseFloat(context.profile.mileage) || 30;
  const recentWorkouts = [...context.workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);
  const recentWorkout = recentWorkouts[0] ?? null;
  const recentTimedRuns = recentWorkouts.filter((workout) => {
    const distance = parseDistance(workout.distance);
    const seconds = parseTimeToSeconds(workout.time);
    return Boolean(distance && seconds);
  }).length;
  const averageRecentEffort =
    recentWorkouts.length > 0
      ? recentWorkouts.reduce((sum, workout) => sum + (Number.isFinite(workout.effort) ? workout.effort : 0), 0) /
        recentWorkouts.length
      : null;
  const weeklyMiles = context.weeklySummary?.totalMiles ?? 0;
  const workloadRatio = mileageGoal > 0 ? weeklyMiles / mileageGoal : 0;

  return {
    mileageGoal,
    goalEventLabel: context.profile.goalEvent || "running",
    goalRace: context.profile.raceGoals[0] ?? null,
    pr5k: context.profile.pr5k || context.profile.prs["5k"] || "",
    runnerLevel: context.profile.runnerLevel ?? null,
    preferredTrainingDays: context.profile.preferredTrainingDays || 4,
    recentWorkout,
    recentWorkouts,
    recentTimedRuns,
    recentHighEffort: recentWorkouts.some((workout) => workout.effort >= 8),
    averageRecentEffort,
    recentWorkoutTypes: recentWorkouts.map((workout) => workout.type).filter(Boolean),
    consistency: getConsistencyStatus(context.workouts),
    weeklyMiles,
    weeklyRunCount: context.weeklySummary?.runCount ?? 0,
    streak: context.streak ?? 0,
    workloadStatus: workloadRatio >= 1.08 ? "above_goal" : workloadRatio >= 0.72 ? "on_track" : "below_goal",
    recoveryPercent: context.recovery?.percent ?? null,
    recoveryStatus: context.recovery?.status ?? null,
    recoveryAdjustment: context.recovery?.adjustment ?? null,
    recoveryExplanation: context.recovery?.explanation ?? "Recovery data is limited.",
    adaptiveFeedback: context.adaptiveFeedback ?? [],
    fuelingStatusLabel: context.fuelingToday?.statusLabel ?? null,
    fuelingInsight: context.fuelingToday?.insight ?? null,
    fuelingStatus: context.fuelingToday?.status ?? null,
    eatenCalories: context.fuelingToday?.eatenCalories ?? null,
    burnedCalories: context.fuelingToday?.burnedCalories ?? null,
    netCalories: context.fuelingToday?.netCalories ?? null,
    sleepScore: context.engine?.sleepScore ?? null,
    sleepHours: context.engine?.sleepHours ?? null,
    sleepQuality: context.engine?.sleepQuality ?? null,
    restingHr: context.engine?.restingHr ?? null,
    heartRateTrend: context.engine?.heartRateTrend ?? null,
    fatigueLevel: context.engine?.fatigueLevel ?? null,
    todayWorkout: context.todayWorkout ?? null,
  };
}

function buildRecentWorkoutContext(summary: CoachSummary) {
  if (!summary.recentWorkout) {
    return "";
  }

  const distance = parseDistance(summary.recentWorkout.distance);
  const pace = getWorkoutPaceText(summary.recentWorkout);
  const details = [
    distance ? `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} miles` : null,
    pace ? `${pace} pace` : null,
    Number.isFinite(summary.recentWorkout.effort) ? `${summary.recentWorkout.effort}/10 effort` : null,
  ].filter(Boolean);

  return details.length > 0 ? `That session came in at ${details.join(", ")}.` : "";
}

function buildFuelingContext(summary: CoachSummary) {
  if (summary.eatenCalories === null || summary.netCalories === null) {
    return "";
  }

  const parts = [
    `${Math.round(summary.eatenCalories)} calories eaten today`,
    summary.burnedCalories !== null ? `${Math.round(summary.burnedCalories)} burned` : null,
    `${Math.round(summary.netCalories)} net`,
  ].filter(Boolean);

  return parts.length > 0 ? `Current intake context: ${parts.join(", ")}.` : "";
}

function buildHeartRateContext(summary: CoachSummary) {
  const parts = [
    summary.restingHr ? `Resting HR is ${summary.restingHr}` : null,
    summary.heartRateTrend ? `trend is ${summary.heartRateTrend.replace("_", " ")}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? `${parts.join(", ")}.` : "";
}

function buildConditionContext(summary: CoachSummary) {
  const parts = [
    summary.sleepScore !== null ? `sleep score ${summary.sleepScore}` : null,
    summary.sleepQuality ? `sleep quality ${summary.sleepQuality}` : null,
    summary.sleepHours ? `${summary.sleepHours} hours sleep` : null,
    summary.heartRateTrend ? `HR ${summary.heartRateTrend.replace("_", " ")}` : null,
    summary.fatigueLevel ? `fatigue ${summary.fatigueLevel}` : null,
    summary.fuelingStatusLabel ? `fueling ${summary.fuelingStatusLabel.toLowerCase()}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? `Right now the main recovery signals are ${parts.join(", ")}.` : "";
}

function getConsistencyStatus(workouts: WorkoutType[]) {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentDays = new Set(
    workouts
      .filter((workout) => new Date(workout.date).getTime() >= cutoff)
      .map((workout) => new Date(workout.date).toISOString().slice(0, 10))
  );

  if (recentDays.size >= 6) {
    return "strong";
  }

  if (recentDays.size >= 3) {
    return "solid";
  }

  return "low";
}

function getWorkoutPurpose(title: string, kind: string) {
  const descriptor = `${title} ${kind}`.toLowerCase();

  if (descriptor.includes("tempo") || descriptor.includes("threshold")) {
    return "The main job is to build faster aerobic strength without racing the session.";
  }

  if (descriptor.includes("long")) {
    return "The main job is endurance and durability, not proving fitness in one day.";
  }

  if (descriptor.includes("recovery")) {
    return "The main job is helping your legs absorb work and come back fresher.";
  }

  if (descriptor.includes("easy")) {
    return "The main job is aerobic volume that does not cost too much recovery.";
  }

  if (descriptor.includes("track") || descriptor.includes("interval") || descriptor.includes("quality")) {
    return "The main job is quality work with enough control that the whole session stays honest.";
  }

  return "The main job is to match the planned purpose of the day instead of drifting into the wrong effort.";
}

function getWorkoutEffortCue(title: string, kind: string) {
  const descriptor = `${title} ${kind}`.toLowerCase();

  if (descriptor.includes("tempo") || descriptor.includes("threshold")) {
    return "It should feel strong and steady, not frantic.";
  }

  if (descriptor.includes("long")) {
    return "It should feel patient early and mostly aerobic.";
  }

  if (descriptor.includes("recovery") || descriptor.includes("easy")) {
    return "It should feel relaxed enough that conversation is easy.";
  }

  if (descriptor.includes("track") || descriptor.includes("interval") || descriptor.includes("quality")) {
    return "It should feel controlled hard, not reckless.";
  }

  return "Let effort stay aligned with the purpose of the day.";
}

function getRaceCountdown(value: string) {
  const raceDate = new Date(value);

  if (Number.isNaN(raceDate.getTime())) {
    return "";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  raceDate.setHours(0, 0, 0, 0);
  const days = Math.round((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days > 1) {
    return `${days} days out gives you enough time to keep building rather than forcing anything.`;
  }

  if (days === 1) {
    return "Race day is tomorrow, so freshness matters more than adding work.";
  }

  if (days === 0) {
    return "Race day is today, so the priority is calm execution.";
  }

  return "";
}

function hasAny(question: string, keywords: string[]) {
  return keywords.some((keyword) => question.includes(keyword));
}

function normalizeQuestion(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function isRunningQuestion(question: string) {
  const runningKeywords = [
    "run",
    "running",
    "workout",
    "pace",
    "easy",
    "tempo",
    "threshold",
    "interval",
    "track",
    "long run",
    "race",
    "mile",
    "mileage",
    "effort",
    "recover",
    "recovery",
    "rest",
    "taper",
    "fatigue",
    "goal",
    "prediction",
    "5k",
    "10k",
    "marathon",
    "half",
    "split",
    "today",
    "food",
    "fuel",
    "calories",
    "heart rate",
    "hr",
    "injury",
    "pain",
    "sleep",
  ];

  return runningKeywords.some((keyword) => question.includes(keyword));
}

function getHardRunHeadline(summary: CoachSummary) {
  if (summary.recoveryAdjustment === "ease_off") {
    return "Your run probably felt hard because recovery was already behind.";
  }

  if (summary.fuelingStatusLabel === "Underfueled") {
    return "Low fueling likely made the run feel harder than the pace suggested.";
  }

  if (summary.recentHighEffort) {
    return "You were likely carrying fatigue from earlier in the week.";
  }

  return "The body likely was not as fresh as the run demanded.";
}

function getWorkoutPaceText(workout: WorkoutType) {
  const distance = parseDistance(workout.distance);
  const seconds = parseTimeToSeconds(workout.time);

  if (!distance || !seconds) {
    return null;
  }

  const paceSeconds = seconds / distance;
  const minutes = Math.floor(paceSeconds / 60);
  const remainder = Math.round(paceSeconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}/mi`;
}

function getCalculationReply(question: string): CalculationResult | null {
  const paceFromDistanceAndTime =
    question.match(
      /(?:what\s+)?(?:mile\s+)?pace(?:\s+is)?\s+(\d+(?:\.\d+)?)\s*(mile|miles|mi|km|k)\s+(?:in|at)\s+(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)?/
    ) ??
    question.match(
      /what\s+pace\s+is\s+(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(?:for)\s*(\d+(?:\.\d+)?)\s*(mile|miles|mi|km|k|5k|10k|half marathon|half|marathon)/
    );

  if (paceFromDistanceAndTime) {
    const firstLooksTime = paceFromDistanceAndTime[1].includes(":") || Boolean(paceFromDistanceAndTime[4]);
    const distanceValue = firstLooksTime ? Number.parseFloat(paceFromDistanceAndTime[2]) : Number.parseFloat(paceFromDistanceAndTime[1]);
    const distanceUnit = firstLooksTime ? paceFromDistanceAndTime[3] : paceFromDistanceAndTime[2];
    const timeValue = firstLooksTime ? paceFromDistanceAndTime[1] : paceFromDistanceAndTime[3];
    const timeUnit = firstLooksTime ? paceFromDistanceAndTime[2] : paceFromDistanceAndTime[4];
    const totalSeconds = parseFlexibleTime(timeValue, timeUnit);
    const distanceMiles = convertDistanceToMiles(distanceValue, distanceUnit);

    if (totalSeconds && distanceMiles > 0) {
      return {
        answer: `${formatPaceOnly(totalSeconds / distanceMiles)} per mile pace.`,
      };
    }
  }

  const finishTimeFromPaceAndDistance = question.match(
    /how\s+long\s+is\s+(\d+(?:\.\d+)?)\s*(mile|miles|mi|km|k)\s+at\s+(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)?\s*(?:pace)?/
  );

  if (finishTimeFromPaceAndDistance) {
    const distanceValue = Number.parseFloat(finishTimeFromPaceAndDistance[1]);
    const distanceUnit = finishTimeFromPaceAndDistance[2];
    const paceValue = finishTimeFromPaceAndDistance[3];
    const paceUnit = finishTimeFromPaceAndDistance[4];
    const paceSeconds = parseFlexibleTime(paceValue, paceUnit);
    const distanceMiles = convertDistanceToMiles(distanceValue, distanceUnit);

    if (paceSeconds && distanceMiles > 0) {
      return {
        answer: `${formatDuration(paceSeconds * distanceMiles)} total time.`,
      };
    }
  }

  const splitFromRep = question.match(
    /what\s+(?:is\s+)?(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)?\s*(400|600|800|1000|1k)\s*(?:m|meter|meters)?(?:\s+pace)?(?:\s+converted\s+to\s+mile|\s+to\s+mile|\s+mile pace)?/
  );

  if (splitFromRep) {
    const repTime = parseFlexibleTime(splitFromRep[1], splitFromRep[2]);
    const repMeters = splitFromRep[3] === "1k" ? 1000 : Number.parseFloat(splitFromRep[3]);

    if (repTime && repMeters > 0) {
      const milePaceSeconds = repTime * (1609.344 / repMeters);
      return {
        answer: `${formatOriginalTime(splitFromRep[1], splitFromRep[2])} for ${formatRepDistance(splitFromRep[3])} is about ${formatPaceOnly(milePaceSeconds)} per mile.`,
      };
    }
  }

  const repFromMilePace = question.match(
    /what\s+(?:is\s+)?(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:mile|mi)\s+pace(?:\s+for)?\s+(400|600|800|1000|1k)\s*(?:m|meter|meters)?/
  );

  if (repFromMilePace) {
    const milePaceSeconds = parseFlexibleTime(repFromMilePace[1]);
    const repMeters = repFromMilePace[2] === "1k" ? 1000 : Number.parseFloat(repFromMilePace[2]);

    if (milePaceSeconds && repMeters > 0) {
      const repSeconds = milePaceSeconds * (repMeters / 1609.344);
      return {
        answer: `${formatDuration(Math.round(repSeconds))} for ${formatRepDistance(repFromMilePace[2])}.`,
      };
    }
  }

  const equivalence = question.match(
    /what\s+(?:is|would)\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(400m|800m|mile|1600m|3200m|2 mile|5k|10k|half marathon|marathon)\s+(?:equivalent\s+to|equivalent\s+for)\s+(400m|800m|mile|1600m|3200m|2 mile|5k|10k|half marathon|marathon)/
  );

  if (equivalence) {
    const sourceSeconds = parseFlexibleTime(equivalence[1]);
    const sourceMiles = convertDistanceToMiles(1, equivalence[2]);
    const targetMiles = convertDistanceToMiles(1, equivalence[3]);

    if (sourceSeconds && sourceMiles > 0 && targetMiles > 0) {
      const projected = sourceSeconds * Math.pow(targetMiles / sourceMiles, 1.06);
      return {
        answer: `A rough equivalent is ${formatDuration(Math.round(projected))} for ${normalizeDistanceLabel(equivalence[3])}.`,
      };
    }
  }

  return null;
}

function parseFlexibleTime(value: string, unit?: string) {
  const trimmed = value.trim();

  if (trimmed.includes(":")) {
    return parseTimeToSeconds(trimmed);
  }

  const numeric = Number(trimmed);

  if (Number.isNaN(numeric)) {
    return null;
  }

  const normalizedUnit = unit?.toLowerCase();

  if (!normalizedUnit || normalizedUnit.startsWith("min")) {
    return numeric * 60;
  }

  if (normalizedUnit.startsWith("sec")) {
    return numeric;
  }

  if (normalizedUnit.startsWith("hour") || normalizedUnit.startsWith("hr")) {
    return numeric * 3600;
  }

  return numeric;
}

function convertDistanceToMiles(value: number, unit: string) {
  const normalizedUnit = unit.toLowerCase();

  if (normalizedUnit === "mile" || normalizedUnit === "miles" || normalizedUnit === "mi") {
    return value;
  }

  if (normalizedUnit === "km") {
    return value * 0.621371;
  }

  if (normalizedUnit === "k") {
    return value === 10 ? 6.21371 : value === 5 ? 3.10686 : value * 0.621371;
  }

  if (normalizedUnit === "400m") {
    return 0.2485;
  }

  if (normalizedUnit === "800m") {
    return 0.4971;
  }

  if (normalizedUnit === "mile" || normalizedUnit === "1600m") {
    return 0.9942;
  }

  if (normalizedUnit === "3200m" || normalizedUnit === "2 mile") {
    return 1.9884;
  }

  if (normalizedUnit === "half marathon" || normalizedUnit === "half") {
    return 13.1094;
  }

  if (normalizedUnit === "marathon") {
    return 26.2188;
  }

  return value;
}

function formatPaceOnly(secondsPerMile: number) {
  const rounded = Math.round(secondsPerMile);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRepDistance(rep: string) {
  return rep === "1k" ? "1K" : `${rep}m`;
}

function formatOriginalTime(value: string, unit?: string) {
  const normalizedUnit = unit?.toLowerCase();

  if (!normalizedUnit || value.includes(":")) {
    return value;
  }

  if (normalizedUnit.startsWith("sec")) {
    return `${value} seconds`;
  }

  if (normalizedUnit.startsWith("min")) {
    return `${value} minutes`;
  }

  return value;
}

function normalizeDistanceLabel(label: string) {
  return label === "half" ? "half marathon" : label;
}
