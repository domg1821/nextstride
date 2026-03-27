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

type WorkoutContextType = {
  workouts: WorkoutType[];
  addWorkout: (workout: NewWorkoutInput) => void;
  shoes: ShoeType[];
  addShoe: (name: string) => void;
  getShoeMileage: (shoeId: string) => number;
  likedWorkoutIds: Record<string, WorkoutPreferenceCategory>;
  likedWorkoutCategories: WorkoutPreferenceCategory[];
  toggleLikedWorkout: (workoutId: string, category: WorkoutPreferenceCategory) => void;
  isWorkoutLiked: (workoutId: string) => boolean;
  completedWorkoutIds: string[];
  completePlannedWorkout: (day: PlanDay, effort: number) => void;
  isWorkoutCompleted: (workoutId: string) => boolean;
  planCycle: number;
  advancePlanWeek: () => void;
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
    { id: "shoe-daily-trainer", name: "Daily Trainer" },
  ]);
  const [likedWorkoutIds, setLikedWorkoutIds] = useState<
    Record<string, WorkoutPreferenceCategory>
  >({});
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<string[]>([]);
  const [planCycle, setPlanCycle] = useState(0);

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

  const addShoe = (name: string) => {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    setShoes((current) => {
      if (current.some((shoe) => shoe.name.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }

      return [...current, { id: createId("shoe"), name: trimmed }];
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

  const completePlannedWorkout = (day: PlanDay, effort: number) => {
    setCompletedWorkoutIds((current) =>
      current.includes(day.id) ? current : [...current, day.id]
    );

    addWorkout({
      type: day.logType,
      distance: String(day.distance),
      time: "Completed",
      splits: "",
      effort,
      notes: `Completed from weekly plan: ${day.title}`,
    });
  };

  const isWorkoutCompleted = (workoutId: string) => completedWorkoutIds.includes(workoutId);

  const advancePlanWeek = () => {
    setCompletedWorkoutIds([]);
    setPlanCycle((current) => current + 1);
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
        completePlannedWorkout,
        isWorkoutCompleted,
        planCycle,
        advancePlanWeek,
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
