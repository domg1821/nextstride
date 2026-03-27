import React, { createContext, useContext, useState } from "react";
import type { PlanDay, WorkoutPreferenceCategory } from "./training-plan";

type WorkoutType = {
  type: string;
  distance: string;
  time: string;
  splits: string;
  effort: number;
  notes: string;
};

type WorkoutContextType = {
  workouts: WorkoutType[];
  addWorkout: (workout: WorkoutType) => void;
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

export const WorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);
  const [likedWorkoutIds, setLikedWorkoutIds] = useState<
    Record<string, WorkoutPreferenceCategory>
  >({});
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<string[]>([]);
  const [planCycle, setPlanCycle] = useState(0);

  const addWorkout = (workout: WorkoutType) => {
    setWorkouts((prev) => [workout, ...prev]);
  };

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
    setWorkouts((current) => [
      {
        type: day.logType,
        distance: String(day.distance),
        time: "Completed",
        splits: "",
        effort,
        notes: `Completed from weekly plan: ${day.title}`,
      },
      ...current,
    ]);
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
