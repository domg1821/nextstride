import type { PlanDay } from "@/lib/training-plan";

export type FuelingStrategy = {
  summary: string;
  before: string;
  during: string;
  after: string;
  quickNote: string;
  emphasis: "light" | "moderate" | "high";
};

export type WeeklyFuelingDay = {
  day: string;
  workoutTitle: string;
  workoutType: string;
  note: string;
  emphasis: FuelingStrategy["emphasis"];
};

export function getFuelingStrategyForWorkout(workout: PlanDay | null): FuelingStrategy {
  if (!workout) {
    return {
      summary: "No workout scheduled, so fueling can stay simple and normal.",
      before: "Eat normally and avoid overthinking it.",
      during: "No workout-specific fueling needed.",
      after: "Have a normal meal and hydrate through the day.",
      quickNote: "This is a normal eating day, not a special fueling day.",
      emphasis: "light",
    };
  }

  if (workout.category === "rest" || workout.category === "recovery") {
    return {
      summary: "Recovery days need basic fueling, not a full workout strategy.",
      before: "A normal meal or light snack is enough.",
      during: "Water is usually plenty.",
      after: "Eat a balanced meal and keep hydration steady.",
      quickNote: "Keep it simple and let recovery stay the priority.",
      emphasis: "light",
    };
  }

  if (workout.category === "easy" || workout.category === "steady") {
    return {
      summary: "Easy aerobic work usually needs only light preparation.",
      before: "If you run hungry, take a small carb snack 30-60 minutes before.",
      during: workout.distance >= 8 ? "Water is usually enough. Bring fluids if the run is longer or warm." : "No mid-run fuel needed for most easy runs.",
      after: "Eat a normal meal or snack with carbs and some protein.",
      quickNote: "Fuel lightly so the run stays easy and routine.",
      emphasis: workout.distance >= 8 ? "moderate" : "light",
    };
  }

  if (workout.category === "threshold" || workout.category === "intervals") {
    return {
      summary: "Quality sessions usually benefit from light pre-run carbs and a clean recovery meal.",
      before: "Take light carbs before the run, especially if the session is early or you have not eaten in a while.",
      during: "Usually no fuel needed during the session unless it runs long or conditions are harsh.",
      after: "Refuel soon after with carbs and protein so the quality work actually lands.",
      quickNote: "Quality days should feel supported, not underfueled.",
      emphasis: "moderate",
    };
  }

  if (workout.category === "long") {
    return {
      summary: "Long runs are the clearest days for a real fueling plan.",
      before: "Have a fuller pre-run meal or snack with easy carbs and fluids.",
      during: "Bring fluids and take carbs during the run if it is long enough to drain energy.",
      after: "Refuel properly with carbs, protein, and hydration soon after finishing.",
      quickNote: "Treat the long run like a practice day for fueling, not just for mileage.",
      emphasis: "high",
    };
  }

  return {
    summary: "Fuel enough to support the purpose of the run.",
    before: "A light pre-run carb option is usually enough.",
    during: "Water or simple fluids are enough unless the session is long.",
    after: "Refuel with carbs and protein after the session.",
    quickNote: "Match your fueling to the work, not to generic rules.",
    emphasis: "moderate",
  };
}

export function buildWeeklyFuelingOverview(plan: PlanDay[]) {
  const days = plan.map((workout) => {
    const strategy = getFuelingStrategyForWorkout(workout);

    return {
      day: workout.day,
      workoutTitle: workout.title,
      workoutType: workout.logType,
      note: strategy.quickNote,
      emphasis: strategy.emphasis,
    } satisfies WeeklyFuelingDay;
  });

  const highDays = days.filter((day) => day.emphasis === "high").length;
  const moderateDays = days.filter((day) => day.emphasis === "moderate").length;

  return {
    summary:
      highDays > 0
        ? `This week has ${highDays} key fueling day${highDays > 1 ? "s" : ""} and ${moderateDays} lighter support day${moderateDays === 1 ? "" : "s"}.`
        : `This week is mostly light fueling support with ${moderateDays} day${moderateDays === 1 ? "" : "s"} that benefit from a little extra planning.`,
    days,
  };
}

export function getFuelingQuickTips() {
  return [
    {
      title: "Pre-run carbs",
      body: "A banana, toast, or simple cereal can be enough before workouts that need more support.",
    },
    {
      title: "Hydration basics",
      body: "Start the run hydrated and bring fluids sooner on longer or warmer runs.",
    },
    {
      title: "Long run strategy",
      body: "Long runs are the best place to practice what you will actually tolerate well during race training.",
    },
    {
      title: "Recovery meal",
      body: "After quality or long runs, refuel with carbs and protein so the next session does not pay the price.",
    },
  ];
}
