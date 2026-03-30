import {
  DayName,
  getDateForPlanDay,
  getDayKey,
  getRecentMileageTrend,
} from "@/utils/workout-utils";
import type { RunnerLevel } from "@/contexts/profile-context";

export type SupportedGoalEvent =
  | "800"
  | "1600/mile"
  | "5k"
  | "10k"
  | "half marathon"
  | "marathon";

export type PlanDay = {
  id: string;
  day: string;
  kind: "rest" | "recovery" | "easy" | "quality" | "steady" | "long";
  category: WorkoutPreferenceCategory;
  title: string;
  details: string;
  distance: number;
  logType: string;
  adjustmentNote?: string;
  adjustmentType?: "recovery" | "missed" | "progression";
};

export type AdaptivePlanContext = {
  workouts: {
    date: string;
    effort: number;
    notes: string;
    distance: string;
  }[];
  completedWorkoutIds: string[];
  referenceDate?: Date;
};

export type AdaptivePlanResult = {
  plan: PlanDay[];
  feedback: string[];
};

export type RunnerPlanPreferences = {
  runnerLevel?: RunnerLevel | null;
  preferredTrainingDays?: number;
};

export type WorkoutPreferenceCategory =
  | "rest"
  | "recovery"
  | "easy"
  | "intervals"
  | "threshold"
  | "steady"
  | "long";

type WorkoutRole = WorkoutPreferenceCategory;

type PlannedDay = {
  day: DayName;
  kind: PlanDay["kind"];
  role: WorkoutRole;
  title: string;
  logType: string;
  distance: number;
};

type PaceProfile = {
  prLabel: string;
  fiveKPacePerMile: number;
  intervalPacePerMile: number;
  thresholdPacePerMile: number;
  easyLowPerMile: number;
  easyHighPerMile: number;
  longLowPerMile: number;
  longHighPerMile: number;
};

const GOAL_LABELS: Record<SupportedGoalEvent, string> = {
  "800": "800m",
  "1600/mile": "1600 / Mile",
  "5k": "5K",
  "10k": "10K",
  "half marathon": "Half Marathon",
  "marathon": "Marathon",
};

export function normalizeGoalEvent(goalEvent: string): SupportedGoalEvent {
  const goal = goalEvent.trim().toLowerCase();

  if (goal.includes("800")) {
    return "800";
  }

  if (goal.includes("1600") || goal.includes("mile")) {
    return "1600/mile";
  }

  if (goal.includes("10k")) {
    return "10k";
  }

  if (goal.includes("half")) {
    return "half marathon";
  }

  if (goal.includes("marathon")) {
    return "marathon";
  }

  return "5k";
}

export function getGoalLabel(goalEvent: string) {
  return GOAL_LABELS[normalizeGoalEvent(goalEvent)];
}

export function parseWeeklyMileage(mileage: string) {
  const parsed = Number.parseFloat(mileage);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(Math.max(parsed, 4), 90);
}

export function buildWeeklyPlan(
  goalEvent: string,
  mileage: string,
  pr5k = "",
  likedCategories: WorkoutPreferenceCategory[] = [],
  planCycle = 0,
  preferences: RunnerPlanPreferences = {}
): PlanDay[] {
  if (preferences.runnerLevel === "total_beginner" || preferences.runnerLevel === "beginner") {
    return buildFoundationWeeklyPlan({
      runnerLevel: preferences.runnerLevel,
      weeklyMileage: parseWeeklyMileage(mileage),
      preferredTrainingDays: preferences.preferredTrainingDays ?? 4,
      planCycle,
    });
  }

  const goal = normalizeGoalEvent(goalEvent);
  const weeklyMileage = parseWeeklyMileage(mileage);
  const paceProfile = buildPaceProfile(pr5k, goal);
  const template = getTemplate(weeklyMileage, likedCategories);
  const detailSeed = planCycle + getLikedCategoryOffset(likedCategories);
  const cycleVariation = getCycleVariation(planCycle);
  const weightTotal = template.reduce(
    (sum, day) => sum + getWeight(day.role, goal),
    0
  );
  const adjustedWeeklyMileage = weeklyMileage * cycleVariation;
  const baseUnit = adjustedWeeklyMileage / weightTotal;

  return template.map((day) => {
    const distance = day.kind === "rest" ? 0 : roundToHalf(baseUnit * getWeight(day.role, goal));

    return {
      id: buildPlanDayId(day, planCycle),
      day: day.day,
      kind: day.kind,
      category: day.role,
      title: day.title,
      logType: day.logType,
      distance,
      details: buildDetails(day, goal, distance, adjustedWeeklyMileage, paceProfile, detailSeed),
    };
  });
}

export function getTodayPlanDay(plan: PlanDay[], date = new Date()) {
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  return plan[mondayFirstIndex];
}

export function buildAdaptiveWeeklyPlan(
  goalEvent: string,
  mileage: string,
  pr5k = "",
  likedCategories: WorkoutPreferenceCategory[] = [],
  planCycle = 0,
  preferences?: RunnerPlanPreferences,
  context?: AdaptivePlanContext
): AdaptivePlanResult {
  const basePlan = buildWeeklyPlan(goalEvent, mileage, pr5k, likedCategories, planCycle, preferences);

  if (!context) {
    return {
      plan: basePlan,
      feedback: [],
    };
  }

  const referenceDate = context.referenceDate ?? new Date();
  const todayIndex = (referenceDate.getDay() + 6) % 7;
  const weeklyMileageGoal = parseWeeklyMileage(mileage);
  const feedback: string[] = [];
  const workoutsByDateKey = context.workouts.reduce<Record<string, AdaptivePlanContext["workouts"]>>(
    (accumulator, workout) => {
      const key = getDayKey(workout.date);
      accumulator[key] = accumulator[key] ? [...accumulator[key], workout] : [workout];
      return accumulator;
    },
    {}
  );
  const missedQualityDay = basePlan.find((day, index) => {
    if (index >= todayIndex || day.kind === "rest") {
      return false;
    }

    const plannedDateKey = getDayKey(getDateForPlanDay(day.day as DayName, referenceDate, planCycle).toISOString());
    const completed = context.completedWorkoutIds.includes(day.id);
    const loggedWorkoutThatDay = (workoutsByDateKey[plannedDateKey] ?? []).length > 0;

    return !completed && !loggedWorkoutThatDay && (day.category === "intervals" || day.category === "threshold" || day.category === "long");
  });
  const recentWorkout = [...context.workouts]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];
  const recentMileageTrend = getRecentMileageTrend(
    context.workouts.map((workout) => ({
      date: workout.date,
      distance: workout.distance,
    })),
    referenceDate,
    3
  );
  const averageRecentMiles =
    recentMileageTrend.length > 0
      ? recentMileageTrend.reduce((sum, point) => sum + point.miles, 0) / recentMileageTrend.length
      : 0;
  const strongConsistency =
    averageRecentMiles >= weeklyMileageGoal * 0.85 &&
    context.workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);
      const daysAgo = Math.floor((referenceDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= 14;
    }).length >= 4;
  const highRecentEffort = recentWorkout && recentWorkout.effort >= 8;

  const adaptedPlan = basePlan.map((day, index) => {
    const nextDayGap = index - todayIndex;
    let adaptedDay = { ...day };

    if (highRecentEffort && nextDayGap >= 0 && nextDayGap <= 1 && (day.category === "easy" || day.category === "recovery" || day.category === "steady")) {
      adaptedDay = {
        ...adaptedDay,
        distance: Math.max(2, roundToHalf(day.distance - 0.5)),
        details: `${day.details} Yesterday was high effort, so today stays easy and controlled.`,
        adjustmentNote: "Yesterday was high effort, so today stays easy.",
        adjustmentType: "recovery",
      };
    }

    if (
      missedQualityDay &&
      nextDayGap >= 0 &&
      nextDayGap <= 2 &&
      index > basePlan.indexOf(missedQualityDay) &&
      (day.category === "easy" || day.category === "recovery" || day.category === "steady")
    ) {
      adaptedDay = {
        ...adaptedDay,
        distance: Math.max(2, roundToHalf(adaptedDay.distance - 0.5)),
        details: `${adaptedDay.details} You missed ${missedQualityDay.day}'s ${missedQualityDay.title.toLowerCase()}, so this session stays lighter.`,
        adjustmentNote: `You missed ${missedQualityDay.day}'s ${missedQualityDay.title.toLowerCase()}, so this session stays lighter.`,
        adjustmentType: "missed",
      };
    }

    if (
      strongConsistency &&
      !adaptedDay.adjustmentType &&
      nextDayGap >= 0 &&
      (day.category === "steady" || day.category === "long") &&
      index >= todayIndex
    ) {
      adaptedDay = {
        ...adaptedDay,
        distance: roundToHalf(day.distance + 0.5),
        details: `${day.details} Consistency has been strong, so this session gets a small progression.`,
        adjustmentNote: "Consistency has been strong, so this session gets a small progression.",
        adjustmentType: "progression",
      };
    }

    return adaptedDay;
  });

  if (highRecentEffort) {
    feedback.push("Yesterday was high effort, so the next easy day stays lighter.");
  }

  if (missedQualityDay) {
    feedback.push(`You missed ${missedQualityDay.day}'s ${missedQualityDay.title.toLowerCase()}, so the next few days stay more controlled.`);
  }

  if (strongConsistency) {
    feedback.push("Consistency has been strong, so the plan allows a small progression later in the week.");
  }

  return {
    plan: adaptedPlan,
    feedback: feedback.slice(0, 3),
  };
}

function getTemplate(
  weeklyMileage: number,
  likedCategories: WorkoutPreferenceCategory[]
): PlannedDay[] {
  const sundayRole = selectSundayRole(weeklyMileage, likedCategories);

  if (weeklyMileage <= 20) {
    return [
      createRoleDay("Monday", "intervals"),
      createRoleDay("Tuesday", "easy"),
      createRoleDay("Wednesday", "threshold"),
      createRoleDay("Thursday", "steady"),
      createRoleDay("Friday", "easy"),
      createDay("Saturday", "long", "Long Run", "long"),
      createRoleDay("Sunday", sundayRole),
    ];
  }

  if (weeklyMileage <= 35) {
    return [
      createRoleDay("Monday", "intervals"),
      createRoleDay("Tuesday", "easy"),
      createRoleDay("Wednesday", "threshold"),
      createRoleDay("Thursday", "steady"),
      createRoleDay("Friday", "easy"),
      createDay("Saturday", "long", "Long Run", "long"),
      createRoleDay("Sunday", sundayRole),
    ];
  }

  return [
    createRoleDay("Monday", "intervals"),
    createRoleDay("Tuesday", "easy"),
    createRoleDay("Wednesday", "threshold"),
    createRoleDay("Thursday", "steady"),
    createRoleDay("Friday", "easy"),
    createDay("Saturday", "long", "Long Run", "long"),
    createRoleDay("Sunday", sundayRole),
  ];
}

function createDay(
  day: DayName,
  kind: PlanDay["kind"],
  title: string,
  role: WorkoutRole
): PlannedDay {
  return {
    day,
    kind,
    role,
    title,
    logType: title,
    distance: 0,
  };
}

function buildPlanDayId(day: PlannedDay, planCycle: number) {
  return `${planCycle}-${day.day.toLowerCase()}-${day.role}`;
}

function createRoleDay(day: DayName, role: WorkoutRole): PlannedDay {
  const descriptor = getRoleDescriptor(role);
  return {
    day,
    kind: descriptor.kind,
    role,
    title: descriptor.title,
    logType: descriptor.logType,
    distance: 0,
  };
}

function getRoleDescriptor(
  role: WorkoutRole
): Pick<PlannedDay, "kind" | "title" | "logType"> {
  switch (role) {
    case "rest":
      return { kind: "rest", title: "Rest Day", logType: "Rest" };
    case "recovery":
      return { kind: "recovery", title: "Recovery Run", logType: "Recovery Run" };
    case "easy":
      return { kind: "easy", title: "Easy Run", logType: "Easy Run" };
    case "intervals":
      return { kind: "quality", title: "Track Workout", logType: "Track Workout" };
    case "threshold":
      return { kind: "steady", title: "Tempo Workout", logType: "Tempo Workout" };
    case "steady":
      return { kind: "steady", title: "Aerobic Run", logType: "Aerobic Run" };
    case "long":
      return { kind: "long", title: "Long Run", logType: "Long Run" };
  }
}

function getWeight(role: WorkoutRole, goal: SupportedGoalEvent) {
  const longRunWeight: Record<SupportedGoalEvent, number> = {
    "800": 1.45,
    "1600/mile": 1.55,
    "5k": 1.8,
    "10k": 2,
    "half marathon": 2.3,
    "marathon": 2.6,
  };

  switch (role) {
    case "rest":
      return 0;
    case "recovery":
      return 0.7;
    case "easy":
      return 1;
    case "intervals":
      return 1.1;
    case "threshold":
      return 1.15;
    case "steady":
      return 1.05;
    case "long":
      return longRunWeight[goal];
  }
}

function buildDetails(
  day: PlannedDay,
  goal: SupportedGoalEvent,
  distance: number,
  weeklyMileage: number,
  paceProfile: PaceProfile,
  detailSeed: number
) {
  switch (day.role) {
    case "rest":
      return "Full rest or 20-30 minutes of mobility and light drills.";
    case "recovery":
      return `${formatMiles(distance)} very easy at ${formatPaceRange(
        paceProfile.easyHighPerMile,
        paceProfile.easyHighPerMile + 30
      )}, then 4 x 20-second strides if legs feel good.`;
    case "easy":
      return buildEasyDetails(day.day, distance, paceProfile, detailSeed);
    case "intervals":
      return buildIntervalDetails(goal, weeklyMileage, paceProfile, detailSeed);
    case "threshold":
      return buildThresholdDetails(goal, weeklyMileage, paceProfile, detailSeed);
    case "steady":
      return buildAerobicDetails(distance, paceProfile, weeklyMileage, detailSeed);
    case "long":
      return buildLongRunDetails(goal, distance, paceProfile, detailSeed);
  }
}

function buildIntervalDetails(
  goal: SupportedGoalEvent,
  weeklyMileage: number,
  paceProfile: PaceProfile,
  detailSeed: number
) {
  const pace = formatPace(paceProfile.intervalPacePerMile);
  const variant = detailSeed % 4;

  if (goal === "800") {
    const repsOptions =
      weeklyMileage <= 25
        ? ["6 x 300m", "8 x 200m", "5 x 400m", "4 x 500m"]
        : weeklyMileage <= 45
          ? ["8 x 300m", "6 x 400m", "5 x 500m", "4 x 600m"]
          : ["10 x 300m", "8 x 400m", "6 x 500m", "5 x 600m"];
    const reps = repsOptions[variant];
    return `2 mi warm-up, ${reps} at about ${pace}/mi effort with 200m jog, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "1600/mile") {
    const repsOptions =
      weeklyMileage <= 25
        ? ["5 x 600m", "6 x 400m", "4 x 800m", "8 x 300m"]
        : weeklyMileage <= 45
          ? ["6 x 600m", "5 x 800m", "4 x 1k", "8 x 400m"]
          : ["7 x 600m", "6 x 800m", "5 x 1k", "10 x 400m"];
    const reps = repsOptions[variant];
    return `2 mi warm-up, ${reps} at about ${pace}/mi effort with 200m jog, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "5k") {
    const repsOptions =
      weeklyMileage <= 25
        ? ["5 x 1k", "6 x 800m", "4 x 1200m", "8 x 400m"]
        : weeklyMileage <= 45
          ? ["6 x 1k", "5 x 1200m", "8 x 600m", "10 x 400m"]
          : ["7 x 1k", "6 x 1200m", "5 x 1 mile", "12 x 400m"];
    const reps = repsOptions[variant];
    return `2 mi warm-up, ${reps} at ${pace}/mi pace with 2-minute jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "10k") {
    const repsOptions =
      weeklyMileage <= 25
        ? ["5 x 1k", "4 x 1200m", "6 x 800m", "8 x 400m"]
        : weeklyMileage <= 45
          ? ["6 x 1k", "5 x 1200m", "4 x 1 mile", "10 x 400m"]
          : ["7 x 1k", "6 x 1200m", "5 x 1 mile", "12 x 400m"];
    const reps = repsOptions[variant];
    return `2 mi warm-up, ${reps} at ${pace}/mi pace with 90-second jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "half marathon") {
    const repsOptions =
      weeklyMileage <= 30
        ? ["5 x 1 mile", "4 x 1.25 miles", "6 x 1k", "3 x 2 miles"]
        : weeklyMileage <= 50
          ? ["6 x 1 mile", "5 x 2k", "4 x 1.5 miles", "3 x 2 miles"]
          : ["7 x 1 mile", "6 x 2k", "5 x 1.5 miles", "4 x 2 miles"];
    const reps = repsOptions[variant];
    return `2 mi warm-up, ${reps} at ${pace}/mi pace with 75-90 seconds jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  const repsOptions =
    weeklyMileage <= 35
      ? ["6 x 1k", "5 x 1200m", "4 x 1 mile", "8 x 600m"]
      : weeklyMileage <= 55
        ? ["8 x 1k", "6 x 1200m", "5 x 1 mile", "4 x 2k"]
        : ["10 x 1k", "8 x 1200m", "6 x 1 mile", "5 x 2k"];
  const reps = repsOptions[variant];
  return `2 mi warm-up, ${reps} at ${pace}/mi pace with 60-75 seconds jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
}

function buildThresholdDetails(
  goal: SupportedGoalEvent,
  weeklyMileage: number,
  paceProfile: PaceProfile,
  detailSeed: number
) {
  const thresholdPace = formatPace(paceProfile.thresholdPacePerMile);
  const variant = detailSeed % 4;

  if (goal === "800") {
    const blockOptions =
      weeklyMileage <= 25
        ? ["2 x 8 minutes", "16 minutes continuous", "3 x 6 minutes", "8 x 2 minutes"]
        : ["3 x 8 minutes", "20 minutes continuous", "4 x 6 minutes", "10 x 2 minutes"];
    const block = blockOptions[variant];
    return `${block} at about ${thresholdPace}/mi threshold pace with 2 minutes easy jog, plus short hill sprints after.`;
  }

  if (goal === "1600/mile") {
    const blockOptions =
      weeklyMileage <= 25
        ? ["20 minutes continuous", "3 x 8 minutes", "5 x 5 minutes", "2 x 10 minutes"]
        : ["3 x 10 minutes", "25 minutes continuous", "4 x 8 minutes", "2 x 12 minutes"];
    const block = blockOptions[variant];
    return `${block} at about ${thresholdPace}/mi threshold pace with relaxed control throughout.`;
  }

  if (goal === "5k") {
    const blockOptions =
      weeklyMileage <= 25
        ? ["20 minutes continuous", "4 x 5 minutes", "3 x 8 minutes", "2 mi tempo"]
        : weeklyMileage <= 45
          ? ["25 minutes continuous", "5 x 5 minutes", "3 x 10 minutes", "3 mi tempo"]
          : ["3 x 10 minutes", "30 minutes continuous", "4 x 8 minutes", "4 mi tempo"];
    const block = blockOptions[variant];
    return `${block} at about ${thresholdPace}/mi threshold pace with 2 minutes easy jog if broken up.`;
  }

  if (goal === "10k") {
    const blockOptions =
      weeklyMileage <= 25
        ? ["3 x 8 minutes", "20 minutes continuous", "4 x 6 minutes", "2 mi progression tempo"]
        : weeklyMileage <= 45
          ? ["3 x 10 minutes", "25 minutes continuous", "4 x 8 minutes", "3 mi progression tempo"]
          : ["4 x 10 minutes", "30 minutes continuous", "5 x 8 minutes", "4 mi progression tempo"];
    const block = blockOptions[variant];
    return `${block} at about ${thresholdPace}/mi threshold pace with 2 minutes easy jog.`;
  }

  if (goal === "half marathon") {
    const blockOptions =
      weeklyMileage <= 30
        ? ["3 miles steady tempo", "2 x 2 miles", "20 minutes tempo + 10 minutes steady", "4 x 8 minutes"]
        : weeklyMileage <= 50
          ? ["4 miles steady tempo", "3 x 2 miles", "25 minutes tempo + 10 minutes steady", "5 x 8 minutes"]
          : ["5 miles steady tempo", "2 x 3 miles", "30 minutes tempo + 15 minutes steady", "6 x 8 minutes"];
    const block = blockOptions[variant];
    return `${block} at about ${thresholdPace}/mi threshold pace, staying smooth rather than all-out.`;
  }

  const blockOptions =
    weeklyMileage <= 35
      ? ["3 x 2 miles", "4 miles continuous", "4 x 10 minutes", "20 minutes tempo + 15 minutes steady"]
      : weeklyMileage <= 55
        ? ["2 x 3 miles", "5 miles continuous", "5 x 10 minutes", "25 minutes tempo + 20 minutes steady"]
        : ["5-6 miles continuous", "3 x 3 miles", "6 x 10 minutes", "30 minutes tempo + 20 minutes steady"];
  const block = blockOptions[variant];
  return `${block} at about ${thresholdPace}/mi threshold pace with short float recovery if needed.`;
}

function buildEasyDetails(
  dayName: DayName,
  distance: number,
  paceProfile: PaceProfile,
  detailSeed: number
) {
  const easyRange = formatPaceRange(
    paceProfile.easyLowPerMile,
    paceProfile.easyHighPerMile
  );
  const variant = detailSeed % 4;
  const finishingTouches =
    dayName === "Tuesday"
      ? ["plus 4 x 20-second strides.", "with relaxed form focus.", "keeping the final 10 minutes smooth.", "staying conversational throughout."]
      : ["keeping it calm and controlled.", "with soft aerobic rhythm.", "finishing relaxed, not pressing.", "staying easy on tired legs."];

  return `${formatMiles(distance)} easy aerobic running at ${easyRange}, ${finishingTouches[variant]}`;
}

function buildAerobicDetails(
  distance: number,
  paceProfile: PaceProfile,
  weeklyMileage: number,
  detailSeed: number
) {
  const steadyLow = paceProfile.easyLowPerMile - 15;
  const steadyHigh = paceProfile.easyHighPerMile - 10;
  const steadyRange = formatPaceRange(steadyLow, steadyHigh);
  const variant = detailSeed % 4;
  const options =
    weeklyMileage <= 30
      ? [
          `${formatMiles(distance)} aerobic running at ${steadyRange} with a smooth steady finish.`,
          `${formatMiles(distance)} steady aerobic running at ${steadyRange}, keeping cadence relaxed.`,
          `${formatMiles(distance)} aerobic running at ${steadyRange} with the middle third slightly stronger.`,
          `${formatMiles(distance)} controlled aerobic running at ${steadyRange} on relaxed effort.`,
        ]
      : [
          `${formatMiles(distance)} aerobic running at ${steadyRange} with a smooth steady finish.`,
          `${formatMiles(distance)} steady aerobic running at ${steadyRange}, settling in after the first mile.`,
          `${formatMiles(distance)} aerobic running at ${steadyRange} with the final 15 minutes comfortably strong.`,
          `${formatMiles(distance)} controlled aerobic running at ${steadyRange} with even effort throughout.`,
        ];

  return options[variant];
}

function buildLongRunDetails(
  goal: SupportedGoalEvent,
  distance: number,
  paceProfile: PaceProfile,
  detailSeed: number
) {
  const longRange = formatPaceRange(
    paceProfile.longLowPerMile,
    paceProfile.longHighPerMile
  );
  const variant = detailSeed % 4;

  if (goal === "800" || goal === "1600/mile") {
    const options = [
      `${formatMiles(distance)} relaxed aerobic long run at ${longRange}, finishing with 4 x 20-second strides.`,
      `${formatMiles(distance)} smooth long aerobic run at ${longRange} with the final mile a touch steadier.`,
      `${formatMiles(distance)} relaxed aerobic long run at ${longRange}, keeping the middle miles rhythmic.`,
      `${formatMiles(distance)} long run at ${longRange} on soft effort with 6 short strides after.`,
    ];
    return options[variant];
  }

  if (goal === "5k" || goal === "10k") {
    const options = [
      `${formatMiles(distance)} controlled long run at ${longRange}, keeping the final 10 minutes steady.`,
      `${formatMiles(distance)} long aerobic run at ${longRange} with a moderate pickup over the final 2 miles.`,
      `${formatMiles(distance)} smooth long run at ${longRange}, staying even from start to finish.`,
      `${formatMiles(distance)} controlled long run at ${longRange} with the last 20 minutes just under easy pace.`,
    ];
    return options[variant];
  }

  const options = [
    `${formatMiles(distance)} long aerobic run at ${longRange}, staying smooth and efficient the whole way.`,
    `${formatMiles(distance)} long run at ${longRange} with the final 3 miles progressing gently.`,
    `${formatMiles(distance)} aerobic long run at ${longRange}, settling into strong rhythm after the opening miles.`,
    `${formatMiles(distance)} long run at ${longRange} with a controlled steady finish over the final quarter.`,
  ];
  return options[variant];
}

function selectSundayRole(
  weeklyMileage: number,
  likedCategories: WorkoutPreferenceCategory[]
): WorkoutRole {
  if (likedCategories.includes("recovery")) {
    return "recovery";
  }

  if (likedCategories.includes("rest")) {
    return "rest";
  }

  return weeklyMileage <= 24 ? "rest" : "recovery";
}

function buildFoundationWeeklyPlan(input: {
  runnerLevel: "total_beginner" | "beginner";
  weeklyMileage: number;
  preferredTrainingDays: number;
  planCycle: number;
}): PlanDay[] {
  const activeDays = getActiveTrainingDays(input.preferredTrainingDays);
  const activeCount = activeDays.length;
  const distanceTargets =
    input.runnerLevel === "total_beginner"
      ? [1.5, 2, 2.5, 2.5, 3, 3.5, 4]
      : [2.5, 3, 3.5, 4, 4.5, 5.5, 6.5];
  const targetWeeklyMileage = Math.max(
    input.runnerLevel === "total_beginner" ? 5 : 8,
    Math.min(input.weeklyMileage, input.runnerLevel === "total_beginner" ? 16 : 28)
  );
  const baseDistance = targetWeeklyMileage / activeCount;
  const scaledDistance = distanceTargets[Math.max(0, Math.min(activeCount - 1, distanceTargets.length - 1))];
  const sessionDistance = roundToHalf(Math.max(baseDistance, scaledDistance - (input.planCycle % 3 === 2 ? 0.5 : 0)));
  const longDistance = roundToHalf(
    Math.min(
      input.runnerLevel === "total_beginner" ? 4.5 : 8,
      sessionDistance + (input.runnerLevel === "total_beginner" ? 1 : 1.5)
    )
  );
  const easyDistance = roundToHalf(Math.max(input.runnerLevel === "total_beginner" ? 1.5 : 2.5, sessionDistance));
  const recoveryDistance = roundToHalf(Math.max(1.5, easyDistance - 0.5));

  return DAY_ORDER.map((dayName, index) => {
    const activeIndex = activeDays.indexOf(index);

    if (activeIndex === -1) {
      return createFoundationRestDay(dayName, input.planCycle, index);
    }

    const isLongestDay = activeIndex === activeDays.length - 1;

    if (input.runnerLevel === "total_beginner") {
      const day = createFoundationDay(dayName, {
        kind: isLongestDay ? "long" : activeIndex === 1 ? "steady" : "easy",
        category: isLongestDay ? "long" : activeIndex === activeDays.length - 2 ? "recovery" : "easy",
        title: isLongestDay ? "Long Walk / Run" : activeIndex === 0 ? "Walk / Run Builder" : "Easy Run-Walk",
        logType: isLongestDay ? "Long Run" : "Easy Run",
        distance: isLongestDay ? longDistance : activeIndex === activeDays.length - 2 ? recoveryDistance : easyDistance,
        details: buildTotalBeginnerDetails(activeIndex, isLongestDay, input.planCycle),
        planCycle: input.planCycle,
      });

      return day;
    }

    return createFoundationDay(dayName, {
      kind: isLongestDay ? "long" : activeIndex === activeDays.length - 2 ? "recovery" : activeIndex === 1 ? "steady" : "easy",
      category: isLongestDay ? "long" : activeIndex === activeDays.length - 2 ? "recovery" : activeIndex === 1 ? "steady" : "easy",
      title: isLongestDay ? "Long Easy Run" : activeIndex === 1 ? "Aerobic Builder" : "Easy Run",
      logType: isLongestDay ? "Long Run" : "Easy Run",
      distance: isLongestDay ? longDistance : activeIndex === activeDays.length - 2 ? recoveryDistance : easyDistance,
      details: buildBeginnerDetails(activeIndex, isLongestDay, input.planCycle),
      planCycle: input.planCycle,
    });
  });
}

const DAY_ORDER: DayName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getActiveTrainingDays(preferredTrainingDays: number) {
  switch (Math.max(3, Math.min(preferredTrainingDays || 4, 7))) {
    case 3:
      return [1, 3, 5];
    case 4:
      return [0, 2, 4, 5];
    case 5:
      return [0, 1, 3, 5, 6];
    case 6:
      return [0, 1, 2, 4, 5, 6];
    default:
      return [0, 1, 2, 3, 4, 5, 6];
  }
}

function createFoundationRestDay(day: DayName, planCycle: number, index: number): PlanDay {
  const options = [
    "Rest completely or take a relaxed 20-minute walk and light mobility.",
    "Keep movement light today with mobility or a short walk.",
    "Full recovery day. Easy stretching or drills only if that feels good.",
  ];

  return {
    id: `${planCycle}-${day.toLowerCase()}-rest`,
    day,
    kind: "rest",
    category: "rest",
    title: "Recovery Day",
    details: options[(planCycle + index) % options.length],
    distance: 0,
    logType: "Rest",
  };
}

function createFoundationDay(
  day: DayName,
  input: Omit<PlanDay, "id" | "day">
  & { planCycle: number }
): PlanDay {
  return {
    id: `${input.planCycle}-${day.toLowerCase()}-${input.category}`,
    day,
    kind: input.kind,
    category: input.category,
    title: input.title,
    details: input.details,
    distance: input.distance,
    logType: input.logType,
  };
}

function buildTotalBeginnerDetails(activeIndex: number, isLongestDay: boolean, planCycle: number) {
  if (isLongestDay) {
    const options = [
      "30-40 minutes total: alternate 4 minutes easy running with 1 minute walking. Keep the whole session conversational.",
      "32-38 minutes total: 5 minutes easy running, 1 minute walking, repeated. Finish feeling like you could do one more round.",
      "28-36 minutes total: steady run-walk rhythm with relaxed breathing from start to finish.",
    ];
    return options[planCycle % options.length];
  }

  if (activeIndex === 0) {
    const options = [
      "20-24 minutes total: 2 minutes easy running, 1 minute walking, repeated. The goal is comfort and rhythm.",
      "22-26 minutes total: 3 minutes easy running, 1 minute walking. Stay patient and smooth.",
      "20-25 minutes total: short run-walk intervals with a gentle warm-up walk before you start.",
    ];
    return options[planCycle % options.length];
  }

  if (activeIndex === 1) {
    return "24-28 minutes total at easy effort. Run what feels comfortable, walk briefly whenever your breathing gets too high.";
  }

  return "20-30 minutes relaxed with optional walk breaks. Keep this easier than you think you need.";
}

function buildBeginnerDetails(activeIndex: number, isLongestDay: boolean, planCycle: number) {
  if (isLongestDay) {
    const options = [
      "Long easy run on relaxed effort. Optional 30-60 second walk break every 10-15 minutes if needed.",
      "Steady long run with patient pacing early and a calm finish.",
      "Long aerobic run. Stay conversational the whole way and avoid turning it into a hard effort.",
    ];
    return options[planCycle % options.length];
  }

  if (activeIndex === 1) {
    return "Easy aerobic running with the final 5-8 minutes a touch steadier. Finish smooth, not hard.";
  }

  if (activeIndex >= 2) {
    return "Relaxed running with soft effort and optional short walk breaks if your legs need them.";
  }

  return "Easy conversational running. Focus on rhythm, posture, and keeping the effort under control.";
}

function getLikedCategoryOffset(likedCategories: WorkoutPreferenceCategory[]) {
  return likedCategories.reduce((sum, category) => sum + category.charCodeAt(0), 0) % 4;
}

function getCycleVariation(planCycle: number) {
  const phase = ((planCycle % 4) + 4) % 4;

  switch (phase) {
    case 0:
      return 0.98;
    case 1:
      return 1.02;
    case 2:
      return 1.06;
    default:
      return 0.94;
  }
}

function buildPaceProfile(pr5k: string, goal: SupportedGoalEvent): PaceProfile {
  const prSeconds = parseRaceTimeToSeconds(pr5k) ?? 20 * 60;
  const fiveKPacePerMile = prSeconds / 3.10686;
  const intervalAdjustment = getIntervalAdjustment(goal);
  const thresholdAdjustment = getThresholdAdjustment(fiveKPacePerMile);

  return {
    prLabel: pr5k.trim() || "20:00",
    fiveKPacePerMile,
    intervalPacePerMile: fiveKPacePerMile + intervalAdjustment,
    thresholdPacePerMile: fiveKPacePerMile + thresholdAdjustment,
    easyLowPerMile: fiveKPacePerMile + 75,
    easyHighPerMile: fiveKPacePerMile + 110,
    longLowPerMile: fiveKPacePerMile + 55,
    longHighPerMile: fiveKPacePerMile + 85,
  };
}

function getIntervalAdjustment(goal: SupportedGoalEvent) {
  switch (goal) {
    case "800":
      return -28;
    case "1600/mile":
      return -18;
    case "5k":
      return 0;
    case "10k":
      return 4;
    case "half marathon":
      return 6;
    case "marathon":
      return 8;
  }
}

function getThresholdAdjustment(fiveKPacePerMile: number) {
  if (fiveKPacePerMile <= 330) {
    return 18;
  }

  if (fiveKPacePerMile <= 390) {
    return 20;
  }

  return 24;
}

function parseRaceTimeToSeconds(value: string) {
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

function formatMiles(distance: number) {
  if (distance % 1 === 0) {
    return `${distance} mi`;
  }

  return `${distance.toFixed(1)} mi`;
}

function formatPace(secondsPerMile: number) {
  const roundedSeconds = Math.round(secondsPerMile);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPaceRange(lowSecondsPerMile: number, highSecondsPerMile: number) {
  return `${formatPace(lowSecondsPerMile)}-${formatPace(highSecondsPerMile)}/mi`;
}

function roundToHalf(value: number) {
  return Math.max(2, Math.round(value * 2) / 2);
}
