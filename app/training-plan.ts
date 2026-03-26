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
  pr5k = "",
  likedCategories: WorkoutPreferenceCategory[] = [],
  planCycle = 0
): PlanDay[] {
  const goal = normalizeGoalEvent(goalEvent);
  const weeklyMileage = parseWeeklyMileage(mileage);
  const paceProfile = buildPaceProfile(pr5k, goal);
  const template = getTemplate(weeklyMileage, likedCategories);
  const detailSeed = planCycle + getLikedCategoryOffset(likedCategories);
  const weightTotal = template.reduce(
    (sum, day) => sum + getWeight(day.role, goal),
    0
  );
  const baseUnit = weeklyMileage / weightTotal;

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
      details: buildDetails(day, goal, distance, weeklyMileage, paceProfile, detailSeed),
    };
  });
}

export function getTodayPlanDay(plan: PlanDay[], date = new Date()) {
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  return plan[mondayFirstIndex];
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

function getLikedCategoryOffset(likedCategories: WorkoutPreferenceCategory[]) {
  return likedCategories.reduce((sum, category) => sum + category.charCodeAt(0), 0) % 4;
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
