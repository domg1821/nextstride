export type SupportedGoalEvent =
  | "800"
  | "1600/mile"
  | "5k"
  | "10k"
  | "half marathon"
  | "marathon";

export type PlanDay = {
  day: string;
  kind: "rest" | "recovery" | "easy" | "quality" | "steady" | "long";
  title: string;
  details: string;
  distance: number;
};

type WorkoutRole =
  | "rest"
  | "recovery"
  | "easy"
  | "intervals"
  | "threshold"
  | "long";

type PlannedDay = {
  day: DayName;
  kind: PlanDay["kind"];
  role: WorkoutRole;
  title: string;
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

type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

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
    return 30;
  }

  return Math.min(Math.max(parsed, 12), 90);
}

export function buildWeeklyPlan(
  goalEvent: string,
  mileage: string,
  pr5k = ""
): PlanDay[] {
  const goal = normalizeGoalEvent(goalEvent);
  const weeklyMileage = parseWeeklyMileage(mileage);
  const paceProfile = buildPaceProfile(pr5k, goal);
  const template = getTemplate(weeklyMileage);
  const weightTotal = template.reduce(
    (sum, day) => sum + getWeight(day.role, goal),
    0
  );
  const baseUnit = weeklyMileage / weightTotal;

  return template.map((day) => {
    const distance = day.kind === "rest" ? 0 : roundToHalf(baseUnit * getWeight(day.role, goal));

    return {
      day: day.day,
      kind: day.kind,
      title: day.title,
      distance,
      details: buildDetails(day, goal, distance, weeklyMileage, paceProfile),
    };
  });
}

export function getTodayPlanDay(plan: PlanDay[], date = new Date()) {
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  return plan[mondayFirstIndex];
}

function getTemplate(weeklyMileage: number): PlannedDay[] {
  if (weeklyMileage <= 20) {
    return [
      createDay("Monday", "rest", "Rest Day", "rest"),
      createDay("Tuesday", "quality", "Interval Session", "intervals"),
      createDay("Wednesday", "recovery", "Recovery Run", "recovery"),
      createDay("Thursday", "steady", "Threshold Workout", "threshold"),
      createDay("Friday", "rest", "Rest Day", "rest"),
      createDay("Saturday", "long", "Long Run", "long"),
      createDay("Sunday", "easy", "Easy Run", "easy"),
    ];
  }

  if (weeklyMileage <= 35) {
    return [
      createDay("Monday", "recovery", "Recovery Run", "recovery"),
      createDay("Tuesday", "quality", "Interval Session", "intervals"),
      createDay("Wednesday", "easy", "Easy Run", "easy"),
      createDay("Thursday", "steady", "Threshold Workout", "threshold"),
      createDay("Friday", "recovery", "Recovery Run", "recovery"),
      createDay("Saturday", "long", "Long Run", "long"),
      createDay("Sunday", "easy", "Easy Run", "easy"),
    ];
  }

  return [
    createDay("Monday", "recovery", "Recovery Run", "recovery"),
    createDay("Tuesday", "quality", "Interval Session", "intervals"),
    createDay("Wednesday", "easy", "Easy Run", "easy"),
    createDay("Thursday", "steady", "Threshold Workout", "threshold"),
    createDay("Friday", "recovery", "Recovery Run", "recovery"),
    createDay("Saturday", "long", "Long Run", "long"),
    createDay("Sunday", "easy", "Easy Run", "easy"),
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
    distance: 0,
  };
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
    case "long":
      return longRunWeight[goal];
  }
}

function buildDetails(
  day: PlannedDay,
  goal: SupportedGoalEvent,
  distance: number,
  weeklyMileage: number,
  paceProfile: PaceProfile
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
      return `${formatMiles(distance)} easy aerobic running at ${formatPaceRange(
        paceProfile.easyLowPerMile,
        paceProfile.easyHighPerMile
      )}.`;
    case "intervals":
      return buildIntervalDetails(goal, weeklyMileage, paceProfile);
    case "threshold":
      return buildThresholdDetails(goal, weeklyMileage, paceProfile);
    case "long":
      return buildLongRunDetails(goal, distance, paceProfile);
  }
}

function buildIntervalDetails(
  goal: SupportedGoalEvent,
  weeklyMileage: number,
  paceProfile: PaceProfile
) {
  const pace = formatPace(paceProfile.intervalPacePerMile);

  if (goal === "800") {
    const reps = weeklyMileage <= 25 ? "6 x 300m" : weeklyMileage <= 45 ? "8 x 300m" : "10 x 300m";
    return `2 mi warm-up, ${reps} at about ${pace}/mi effort with 200m jog, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "1600/mile") {
    const reps = weeklyMileage <= 25 ? "5 x 600m" : weeklyMileage <= 45 ? "6 x 600m" : "7 x 600m";
    return `2 mi warm-up, ${reps} at about ${pace}/mi effort with 200m jog, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "5k") {
    const reps = weeklyMileage <= 25 ? "5 x 1k" : weeklyMileage <= 45 ? "6 x 1k" : "7 x 1k";
    return `2 mi warm-up, ${reps} at ${pace}/mi pace with 2-minute jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "10k") {
    const reps = weeklyMileage <= 25 ? "5 x 1k" : weeklyMileage <= 45 ? "6 x 1k" : "7 x 1k";
    return `2 mi warm-up, ${reps} at ${pace}/mi pace with 90-second jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  if (goal === "half marathon") {
    const reps = weeklyMileage <= 30 ? "5 x 1 mile" : weeklyMileage <= 50 ? "6 x 1 mile" : "7 x 1 mile";
    return `2 mi warm-up, ${reps} at ${pace}/mi pace with 75-90 seconds jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
  }

  const reps = weeklyMileage <= 35 ? "6 x 1k" : weeklyMileage <= 55 ? "8 x 1k" : "10 x 1k";
  return `2 mi warm-up, ${reps} at ${pace}/mi pace with 60-75 seconds jog recovery, then cool down. Based on a ${paceProfile.prLabel} 5K PR.`;
}

function buildThresholdDetails(
  goal: SupportedGoalEvent,
  weeklyMileage: number,
  paceProfile: PaceProfile
) {
  const thresholdPace = formatPace(paceProfile.thresholdPacePerMile);

  if (goal === "800") {
    const block = weeklyMileage <= 25 ? "2 x 8 minutes" : "3 x 8 minutes";
    return `${block} at about ${thresholdPace}/mi threshold pace with 2 minutes easy jog, plus short hill sprints after.`;
  }

  if (goal === "1600/mile") {
    const block = weeklyMileage <= 25 ? "20 minutes continuous" : "3 x 10 minutes";
    return `${block} at about ${thresholdPace}/mi threshold pace with relaxed control throughout.`;
  }

  if (goal === "5k") {
    const block = weeklyMileage <= 25 ? "20 minutes continuous" : weeklyMileage <= 45 ? "25 minutes continuous" : "3 x 10 minutes";
    return `${block} at about ${thresholdPace}/mi threshold pace with 2 minutes easy jog if broken up.`;
  }

  if (goal === "10k") {
    const block = weeklyMileage <= 25 ? "3 x 8 minutes" : weeklyMileage <= 45 ? "3 x 10 minutes" : "4 x 10 minutes";
    return `${block} at about ${thresholdPace}/mi threshold pace with 2 minutes easy jog.`;
  }

  if (goal === "half marathon") {
    const block = weeklyMileage <= 30 ? "3 miles steady tempo" : weeklyMileage <= 50 ? "4 miles steady tempo" : "5 miles steady tempo";
    return `${block} at about ${thresholdPace}/mi threshold pace, staying smooth rather than all-out.`;
  }

  const block = weeklyMileage <= 35 ? "3 x 2 miles" : weeklyMileage <= 55 ? "2 x 3 miles" : "5-6 miles continuous";
  return `${block} at about ${thresholdPace}/mi threshold pace with short float recovery if needed.`;
}

function buildLongRunDetails(
  goal: SupportedGoalEvent,
  distance: number,
  paceProfile: PaceProfile
) {
  const longRange = formatPaceRange(
    paceProfile.longLowPerMile,
    paceProfile.longHighPerMile
  );

  if (goal === "800" || goal === "1600/mile") {
    return `${formatMiles(distance)} relaxed aerobic long run at ${longRange}, finishing with 4 x 20-second strides.`;
  }

  if (goal === "5k" || goal === "10k") {
    return `${formatMiles(distance)} controlled long run at ${longRange}, keeping the final 10 minutes steady.`;
  }

  return `${formatMiles(distance)} long aerobic run at ${longRange}, staying smooth and efficient the whole way.`;
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
