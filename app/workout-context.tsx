import React, { createContext, useContext, useMemo, useState } from "react";
import type { PlanDay, WorkoutPreferenceCategory } from "./training-plan";
import { parseDistance } from "./workout-utils";

export type WorkoutType = {
  id: string;
  type: string;
  distance: string;
  time: string;
  splits: string;
  effort: number;
  notes: string;
  date: string;
  shoeId?: string | null;
};

export type ShoeType = {
  id: string;
  name: string;
  brand?: string;
  notes?: string;
  mileageAlert?: number;
};

export type PlannedWorkoutOverride = {
  id: string;
  dateKey: string;
  title: string;
  logType: string;
  kind: PlanDay["kind"];
  category: WorkoutPreferenceCategory;
  distance: number;
  details: string;
};

type NewWorkoutInput = {
  type: string;
  distance: string;
  time: string;
  splits: string;
  effort: number;
  notes: string;
  date?: string;
  shoeId?: string | null;
};

type NewShoeInput =
  | string
  | {
      name: string;
      brand?: string;
      notes?: string;
      mileageAlert?: number;
    };

type WorkoutContextType = {
  workouts: WorkoutType[];
  addWorkout: (workout: NewWorkoutInput) => void;
  shoes: ShoeType[];
  addShoe: (input: NewShoeInput) => void;
  getShoeMileage: (shoeId: string) => number;
  likedWorkoutIds: Record<string, WorkoutPreferenceCategory>;
  likedWorkoutCategories: WorkoutPreferenceCategory[];
  toggleLikedWorkout: (workoutId: string, category: WorkoutPreferenceCategory) => void;
  isWorkoutLiked: (workoutId: string) => boolean;
  completedWorkoutIds: string[];
  skippedWorkoutIds: string[];
  planDayNotes: Record<string, string>;
  completePlannedWorkout: (
    day: PlanDay,
    input: {
      effort: number;
      notes?: string;
      dateOverride?: string;
      time?: string;
      distanceOverride?: string;
      typeOverride?: string;
      splits?: string;
      shoeId?: string | null;
      skipWorkoutSave?: boolean;
    }
  ) => void;
  skipPlannedWorkout: (day: PlanDay, note?: string) => void;
  isWorkoutCompleted: (workoutId: string) => boolean;
  isWorkoutSkipped: (workoutId: string) => boolean;
  setPlanDayNote: (dateKey: string, note: string) => void;
  planCycle: number;
  advancePlanWeek: () => void;
  plannedOverrides: Record<string, PlannedWorkoutOverride>;
  assignWorkoutToDate: (dateKey: string, workout: Omit<PlannedWorkoutOverride, "id" | "dateKey">) => void;
};

const WorkoutContext = createContext<WorkoutContextType | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const WorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);
  const [shoes, setShoes] = useState<ShoeType[]>([
    { id: "shoe-daily-trainer", name: "Daily Trainer", mileageAlert: 325 },
  ]);
  const [likedWorkoutIds, setLikedWorkoutIds] = useState<
    Record<string, WorkoutPreferenceCategory>
  >({});
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<string[]>([]);
  const [skippedWorkoutIds, setSkippedWorkoutIds] = useState<string[]>([]);
  const [planDayNotes, setPlanDayNotes] = useState<Record<string, string>>({});
  const [planCycle, setPlanCycle] = useState(0);
  const [plannedOverrides, setPlannedOverrides] = useState<Record<string, PlannedWorkoutOverride>>(
    {}
  );

  const addWorkout = (workout: NewWorkoutInput) => {
    setWorkouts((prev) => [
      {
        ...workout,
        id: createId("workout"),
        date: workout.date ?? new Date().toISOString(),
        shoeId: workout.shoeId ?? null,
      },
      ...prev,
    ]);
  };

  const addShoe = (input: NewShoeInput) => {
    const nextShoe =
      typeof input === "string"
        ? { name: input }
        : {
            name: input.name,
            brand: input.brand,
            notes: input.notes,
            mileageAlert: input.mileageAlert,
          };
    const trimmed = nextShoe.name.trim();

    if (!trimmed) {
      return;
    }

    setShoes((current) => {
      if (current.some((shoe) => shoe.name.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }

      return [
        ...current,
        {
          id: createId("shoe"),
          name: trimmed,
          brand: nextShoe.brand?.trim() || undefined,
          notes: nextShoe.notes?.trim() || undefined,
          mileageAlert: nextShoe.mileageAlert ?? 325,
        },
      ];
    });
  };

  const shoeMileageMap = useMemo(() => {
    return workouts.reduce<Record<string, number>>((accumulator, workout) => {
      if (!workout.shoeId) {
        return accumulator;
      }

      const miles = parseDistance(workout.distance) ?? 0;
      accumulator[workout.shoeId] = (accumulator[workout.shoeId] ?? 0) + miles;
      return accumulator;
    }, {});
  }, [workouts]);

  const getShoeMileage = (shoeId: string) => shoeMileageMap[shoeId] ?? 0;

  const toggleLikedWorkout = (
    workoutId: string,
    category: WorkoutPreferenceCategory
  ) => {
    setLikedWorkoutIds((current) => {
      if (current[workoutId]) {
        const next = { ...current };
        delete next[workoutId];
        return next;
      }

      return {
        ...current,
        [workoutId]: category,
      };
    });
  };

  const likedWorkoutCategories = [...new Set(Object.values(likedWorkoutIds))];
  const isWorkoutLiked = (workoutId: string) => Boolean(likedWorkoutIds[workoutId]);

  const completePlannedWorkout = (
    day: PlanDay,
    input: {
      effort: number;
      notes?: string;
      dateOverride?: string;
      time?: string;
      distanceOverride?: string;
      typeOverride?: string;
      splits?: string;
      shoeId?: string | null;
      skipWorkoutSave?: boolean;
    }
  ) => {
    setCompletedWorkoutIds((current) =>
      current.includes(day.id) ? current : [...current, day.id]
    );
    setSkippedWorkoutIds((current) => current.filter((id) => id !== day.id));

    if (!input.skipWorkoutSave) {
      addWorkout({
        type: input.typeOverride ?? day.logType,
        distance: input.distanceOverride ?? String(day.distance),
        time: input.time ?? "Completed",
        splits: input.splits ?? "",
        effort: input.effort,
        notes:
          input.notes?.trim() ||
          `Completed from weekly plan: ${day.title}`,
        date: input.dateOverride,
        shoeId: input.shoeId ?? null,
      });
    }
  };

  const isWorkoutCompleted = (workoutId: string) => completedWorkoutIds.includes(workoutId);
  const isWorkoutSkipped = (workoutId: string) => skippedWorkoutIds.includes(workoutId);
  const setPlanDayNote = (dateKey: string, note: string) => {
    setPlanDayNotes((current) => {
      const trimmed = note.trim();

      if (!trimmed) {
        const next = { ...current };
        delete next[dateKey];
        return next;
      }

      return {
        ...current,
        [dateKey]: trimmed,
      };
    });
  };

  const skipPlannedWorkout = (day: PlanDay, note?: string) => {
    setSkippedWorkoutIds((current) =>
      current.includes(day.id) ? current : [...current, day.id]
    );
    setCompletedWorkoutIds((current) => current.filter((id) => id !== day.id));
  };

  const advancePlanWeek = () => {
    setCompletedWorkoutIds([]);
    setSkippedWorkoutIds([]);
    setPlanCycle((current) => current + 1);
  };

  const assignWorkoutToDate = (
    dateKey: string,
    workout: Omit<PlannedWorkoutOverride, "id" | "dateKey">
  ) => {
    setPlannedOverrides((current) => ({
      ...current,
      [dateKey]: {
        id: `override-${dateKey}`,
        dateKey,
        ...workout,
      },
    }));
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        addWorkout,
        shoes,
        addShoe,
        getShoeMileage,
        likedWorkoutIds,
        likedWorkoutCategories,
        toggleLikedWorkout,
        isWorkoutLiked,
        completedWorkoutIds,
        skippedWorkoutIds,
        planDayNotes,
        completePlannedWorkout,
        skipPlannedWorkout,
        isWorkoutCompleted,
        isWorkoutSkipped,
        setPlanDayNote,
        planCycle,
        advancePlanWeek,
        plannedOverrides,
        assignWorkoutToDate,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkouts = () => {
  const context = useContext(WorkoutContext);

  if (!context) {
    throw new Error("useWorkouts must be used inside WorkoutProvider");
  }

  return context;
};
