import React, { createContext, useContext, useState } from "react";

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
};

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export const WorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);

  const addWorkout = (workout: WorkoutType) => {
    setWorkouts((prev) => [workout, ...prev]);
  };

  return (
    <WorkoutContext.Provider value={{ workouts, addWorkout }}>
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