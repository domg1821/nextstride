import type { ProfileType } from "@/contexts/profile-context";
import type { WorkoutType } from "@/contexts/workout-context";
import { formatDuration, parseDistance, parseTimeToSeconds } from "@/utils/workout-utils";

export type RunningCoachContext = {
  profile: Pick<ProfileType, "goalEvent" | "mileage" | "pr5k" | "prs">;
  workouts: WorkoutType[];
};

export const RUNNING_COACH_SUGGESTIONS = [
  "What should an easy run feel like?",
  "How hard should tempo pace be?",
  "What should I eat before a long run?",
  "Convert 18 minutes for 3 miles to pace",
  "What is 6:00 mile pace for 800m?",
];

type CalculationResult = {
  answer: string;
};

type TopicResponse = {
  answer: string;
};

type TopicMatcher = {
  keywords: string[];
  handler: (question: string, context: RunningCoachContext, summary: CoachSummary) => string;
};

type CoachSummary = {
  mileageGoal: number;
  recentHighEffort: boolean;
  recentWorkoutTypes: string[];
  recentTimedRuns: number;
  goalEventLabel: string;
  pr5k: string;
};

const TOPIC_MATCHERS: TopicMatcher[] = [
  {
    keywords: ["easy run", "easy day", "easy effort", "easy pace"],
    handler: (_question, context, summary) =>
      withContext(
        "Easy runs should feel conversational, controlled, and almost a little too easy at the start.",
        context,
        summary,
        summary.recentHighEffort
          ? "Since your recent effort has been high, keep the next easy run truly relaxed."
          : "You should finish feeling like you could keep going."
      ),
  },
  {
    keywords: ["tempo", "threshold"],
    handler: (_question, context, summary) =>
      withContext(
        "Tempo work should feel strong, steady, and sustainable, not like a race from the first minute.",
        context,
        summary,
        summary.goalEventLabel.includes("5K") || summary.goalEventLabel.includes("10K")
          ? "For your goal event, think controlled discomfort and rhythm rather than sprinting."
          : "If breathing gets ragged too early, back it down slightly."
      ),
  },
  {
    keywords: ["interval", "track", "speed work", "speedwork"],
    handler: (question, context, summary) => {
      if (question.includes("how often")) {
        return withContext(
          "Most runners do best with one speed-focused session each week.",
          context,
          summary,
          summary.mileageGoal >= 45
            ? "A second quality day can work if your easy days stay easy and recovery is holding up."
            : "Only add more if recovery stays solid."
        );
      }

      return withContext(
        "Intervals should feel controlled fast, not reckless.",
        context,
        summary,
        "The goal is repeatable quality and stable splits, not one hero rep followed by a fade."
      );
    },
  },
  {
    keywords: ["long run"],
    handler: (_question, context, summary) =>
      withContext(
        "Long runs should usually stay aerobic and build durability more than ego.",
        context,
        summary,
        summary.goalEventLabel.includes("Half") || summary.goalEventLabel.includes("Marathon")
          ? "For longer races, the long run matters most when it stays steady enough to recover from."
          : "Start easy, settle in, and only finish stronger if the plan calls for it."
      ),
  },
  {
    keywords: ["recovery day", "day after a hard workout", "after a hard workout", "recover"],
    handler: (_question, context, summary) =>
      withContext(
        "The day after a hard workout should be easy or off.",
        context,
        summary,
        summary.recentHighEffort
          ? "Right now I would strongly lean easy or full recovery."
          : "Keep the run short, relaxed, and focused on absorbing the work."
      ),
  },
  {
    keywords: ["mileage increase", "increase mileage", "weekly mileage", "mileage"],
    handler: (_question, context, summary) =>
      withContext(
        "Increase mileage gradually enough that workouts stay sharp and easy days still feel easy.",
        context,
        summary,
        summary.mileageGoal <= 25
          ? "Small steady jumps work better than big jumps when your base is still building."
          : "If your legs stay flat for several days, the increase was probably too aggressive."
      ),
  },
  {
    keywords: ["fatigue", "sore", "soreness", "heavy legs", "tired legs", "tired"],
    handler: (_question, context, summary) =>
      withContext(
        "If you feel sore or flat, protect the next few days instead of forcing pace.",
        context,
        summary,
        summary.recentHighEffort
          ? "Your recent training already points toward backing off a bit."
          : "Trim distance if needed, keep effort easy, and let recovery do its job."
      ),
  },
  {
    keywords: ["race prep", "race preparation", "race strategy", "race", "taper", "taper week"],
    handler: (question, context, summary) => {
      if (question.includes("taper")) {
        return withContext(
          "Taper week should reduce stress while keeping your legs awake.",
          context,
          summary,
          "Keep workouts short and specific, cut volume, and show up feeling fresh instead of stale."
        );
      }

      return withContext(
        "Race strategy should feel patient early and strong late.",
        context,
        summary,
        summary.goalEventLabel
          ? `For a ${summary.goalEventLabel} focus, aim to stay controlled early and avoid spending your race in the red too soon.`
          : "Start under control, settle into rhythm, and save your hardest running for the back half."
      );
    },
  },
  {
    keywords: ["fuel", "eat", "before a run", "before run", "before a long run", "after a run", "after run", "carb"],
    handler: (question, context, summary) => {
      if (question.includes("after")) {
        return withContext(
          "After harder or longer runs, get carbs and some protein in fairly soon.",
          context,
          summary,
          "You are trying to start recovery before the next workout sneaks up on you."
        );
      }

      return withContext(
        "Before a run, keep fueling simple, familiar, and easy to digest.",
        context,
        summary,
        summary.goalEventLabel.includes("Half") || summary.goalEventLabel.includes("Marathon")
          ? "Longer long-run and race-prep days usually feel better with a carb-focused meal 2 to 3 hours beforehand."
          : "For shorter sessions, a light carb snack is often enough."
      );
    },
  },
  {
    keywords: ["rest day", "when to rest", "rest"],
    handler: (_question, context, summary) =>
      withContext(
        "Take a rest day when fatigue is piling up, effort is drifting higher than normal, or easy running stops feeling easy.",
        context,
        summary,
        summary.recentHighEffort
          ? "Based on your recent effort, extra recovery would be a reasonable call."
          : "Rest helps good training sink in."
      ),
  },
  {
    keywords: ["consistency", "stay consistent", "training consistency"],
    handler: (_question, context, summary) =>
      withContext(
        "Consistency usually comes from doing slightly less than your maximum and repeating it well.",
        context,
        summary,
        `At around ${summary.mileageGoal} miles per week, protecting recovery is what keeps good weeks stacking up.`
      ),
  },
  {
    keywords: ["pacing", "pace"],
    handler: (_question, context, summary) =>
      withContext(
        "Good pacing feels controlled early and stronger late.",
        context,
        summary,
        summary.pr5k
          ? `Since you have a ${summary.pr5k} 5K PR on file, think in terms of effort discipline first and pace second when you are tired.`
          : "If you have to force the first half, the pace is too hot."
      ),
  },
  {
    keywords: ["split", "splits"],
    handler: (_question, context, summary) =>
      withContext(
        "Good splits usually come from starting controlled enough that the final rep or final mile is still honest.",
        context,
        summary,
        "Aim for repeatable pacing, not one fast split followed by a fade."
      ),
  },
];

export function getRunningCoachReply(input: string, context: RunningCoachContext) {
  const question = normalizeQuestion(input);
  const summary = summarizeContext(context);
  const calculation = getCalculationReply(question);

  if (calculation) {
    return calculation.answer;
  }

  if (!isRunningQuestion(question)) {
    return "I focus on running, workouts, pacing, recovery, race prep, and fueling questions.";
  }

  const topicReply = getTopicReply(question, context, summary);

  if (topicReply) {
    return topicReply.answer;
  }

  return withContext(
    "I can help with workouts, pacing, recovery, mileage, race prep, fueling, and running calculations.",
    context,
    summary,
    "Ask it directly and I'll keep the answer concise."
  );
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

function getTopicReply(
  question: string,
  context: RunningCoachContext,
  summary: CoachSummary
): TopicResponse | null {
  for (const matcher of TOPIC_MATCHERS) {
    if (matcher.keywords.some((keyword) => question.includes(keyword))) {
      return {
        answer: matcher.handler(question, context, summary),
      };
    }
  }

  if (question.includes("how often")) {
    return {
      answer: withContext(
        "Most runners do best when hard sessions are limited to one or two focused days each week.",
        context,
        summary,
        "Everything else should support those days with easier running."
      ),
    };
  }

  if (question.includes("what should i do")) {
    return {
      answer: withContext(
        "Match the answer to the purpose of the day: easy means easy, workouts mean controlled quality, and recovery means actually recovering.",
        context,
        summary,
        "If you tell me the exact situation, I can answer more directly."
      ),
    };
  }

  return null;
}

function summarizeContext(context: RunningCoachContext): CoachSummary {
  const mileageGoal = Number.parseFloat(context.profile.mileage) || 30;
  const recentWorkouts = [...context.workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5);

  return {
    mileageGoal,
    recentHighEffort: recentWorkouts.some((workout) => workout.effort >= 8),
    recentWorkoutTypes: recentWorkouts.map((workout) => workout.type).filter(Boolean),
    recentTimedRuns: recentWorkouts.filter((workout) => {
      const distance = parseDistance(workout.distance);
      const seconds = parseTimeToSeconds(workout.time);
      return Boolean(distance && seconds);
    }).length,
    goalEventLabel: context.profile.goalEvent || "running",
    pr5k: context.profile.pr5k || context.profile.prs["5k"] || "",
  };
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
    "fuel",
    "eat",
    "carb",
    "recovery",
    "rest",
    "taper",
    "sore",
    "fatigue",
    "5k",
    "10k",
    "marathon",
    "half",
    "400",
    "800",
    "1600",
    "3200",
    "split",
    "splits",
  ];

  return runningKeywords.some((keyword) => question.includes(keyword));
}

function withContext(
  primary: string,
  _context: RunningCoachContext,
  summary: CoachSummary,
  followUp?: string
) {
  const pieces = [primary];

  if (followUp) {
    pieces.push(followUp);
  }

  if (
    summary.goalEventLabel &&
    summary.goalEventLabel !== "running" &&
    !primary.toLowerCase().includes(summary.goalEventLabel.toLowerCase())
  ) {
    pieces.push(`That fits your current ${summary.goalEventLabel} focus.`);
  }

  return pieces.join(" ");
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
