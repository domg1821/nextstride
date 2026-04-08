import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/contexts/profile-context";
import type { PlanDay, WorkoutPreferenceCategory } from "@/lib/training-plan";
import { supabase } from "@/lib/supabase";
import { readStoredJson, writeStoredJson } from "@/utils/local-storage";
import { parseDistance } from "@/utils/workout-utils";

const WORKOUT_STORAGE_KEY = "nextstride.workouts.by-account.v1";
const SUPABASE_WORKOUT_RECORDS_TABLE = "workout_records";

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
  reflectionFeel?: "great" | "solid" | "flat" | "rough";
  expectation?: "easier" | "as_expected" | "harder";
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
  reflectionFeel?: WorkoutType["reflectionFeel"];
  expectation?: WorkoutType["expectation"];
};

type NewShoeInput =
  | string
  | {
      name: string;
      brand?: string;
      notes?: string;
      mileageAlert?: number;
    };

type WorkoutRecord = {
  workouts: WorkoutType[];
  shoes: ShoeType[];
  likedWorkoutIds: Record<string, WorkoutPreferenceCategory>;
  completedWorkoutIds: string[];
  skippedWorkoutIds: string[];
  planDayNotes: Record<string, string>;
  planCycle: number;
  plannedOverrides: Record<string, PlannedWorkoutOverride>;
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
      reflectionFeel?: WorkoutType["reflectionFeel"];
      expectation?: WorkoutType["expectation"];
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

const DEFAULT_WORKOUT_RECORD: WorkoutRecord = {
  workouts: [],
  shoes: [{ id: "shoe-daily-trainer", name: "Daily Trainer", mileageAlert: 325 }],
  likedWorkoutIds: {},
  completedWorkoutIds: [],
  skippedWorkoutIds: [],
  planDayNotes: {},
  planCycle: 0,
  plannedOverrides: {},
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeWorkoutRecord(record?: Partial<WorkoutRecord>): WorkoutRecord {
  return {
    workouts: record?.workouts ?? [],
    shoes:
      record?.shoes && record.shoes.length > 0
        ? record.shoes
        : DEFAULT_WORKOUT_RECORD.shoes,
    likedWorkoutIds: record?.likedWorkoutIds ?? {},
    completedWorkoutIds: record?.completedWorkoutIds ?? [],
    skippedWorkoutIds: record?.skippedWorkoutIds ?? [],
    planDayNotes: record?.planDayNotes ?? {},
    planCycle: record?.planCycle ?? 0,
    plannedOverrides: record?.plannedOverrides ?? {},
  };
}

export const WorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { account, authReady, userId } = useProfile();
  const accountKey = userId ?? account?.email ?? "guest";
  const [recordsByAccount, setRecordsByAccount] = useState<Record<string, WorkoutRecord>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [remoteReadyKey, setRemoteReadyKey] = useState<string | null>(null);
  const currentRecord = useMemo(
    () => normalizeWorkoutRecord(recordsByAccount[accountKey]),
    [accountKey, recordsByAccount]
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateWorkoutState = async () => {
      const storedRecords = await readStoredJson<Record<string, WorkoutRecord>>(
        WORKOUT_STORAGE_KEY,
        {}
      );

      if (!isMounted) {
        return;
      }

      setRecordsByAccount(
        Object.fromEntries(
          Object.entries(storedRecords).map(([email, record]) => [email, normalizeWorkoutRecord(record)])
        )
      );
      setStorageReady(true);
    };

    hydrateWorkoutState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !storageReady) {
      return;
    }

    void writeStoredJson(WORKOUT_STORAGE_KEY, recordsByAccount);
  }, [authReady, recordsByAccount, storageReady]);

  useEffect(() => {
    if (!authReady || !storageReady) {
      return;
    }

    if (!userId) {
      setRemoteReadyKey(accountKey);
      return;
    }

    let isMounted = true;

    const hydrateRemoteRecord = async () => {
      const { data, error } = await supabase
        .from(SUPABASE_WORKOUT_RECORDS_TABLE)
        .select("record")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn("Unable to load workout record from Supabase:", error.message);
        setRemoteReadyKey(userId);
        return;
      }

      if (data?.record) {
        setRecordsByAccount((current) => ({
          ...current,
          [accountKey]: normalizeWorkoutRecord(data.record as Partial<WorkoutRecord>),
        }));
      } else {
        const { error: upsertError } = await supabase.from(SUPABASE_WORKOUT_RECORDS_TABLE).upsert(
          {
            user_id: userId,
            email: account?.email?.trim().toLowerCase() ?? null,
            record: currentRecord,
          },
          { onConflict: "user_id" }
        );

        if (upsertError) {
          console.warn("Unable to seed workout record in Supabase:", upsertError.message);
        }
      }

      setRemoteReadyKey(userId);
    };

    void hydrateRemoteRecord();

    return () => {
      isMounted = false;
    };
  }, [account?.email, accountKey, authReady, currentRecord, storageReady, userId]);

  useEffect(() => {
    if (!authReady || !storageReady || !userId || remoteReadyKey !== userId) {
      return;
    }

    void supabase
      .from(SUPABASE_WORKOUT_RECORDS_TABLE)
      .upsert(
        {
          user_id: userId,
          email: account?.email?.trim().toLowerCase() ?? null,
          record: currentRecord,
        },
        { onConflict: "user_id" }
      )
      .then(({ error }) => {
        if (error) {
          console.warn("Unable to save workout record to Supabase:", error.message);
        }
      });
  }, [account?.email, authReady, currentRecord, remoteReadyKey, storageReady, userId]);

  const updateCurrentRecord = useCallback(
    (updater: (current: WorkoutRecord) => WorkoutRecord) => {
      setRecordsByAccount((current) => ({
        ...current,
        [accountKey]: updater(normalizeWorkoutRecord(current[accountKey])),
      }));
    },
    [accountKey]
  );

  const addWorkout = useCallback(
    (workout: NewWorkoutInput) => {
      updateCurrentRecord((current) => ({
        ...current,
        workouts: [
          {
            ...workout,
            id: createId("workout"),
            date: workout.date ?? new Date().toISOString(),
            shoeId: workout.shoeId ?? null,
            reflectionFeel: workout.reflectionFeel,
            expectation: workout.expectation,
          },
          ...current.workouts,
        ],
      }));
    },
    [updateCurrentRecord]
  );

  const addShoe = useCallback(
    (input: NewShoeInput) => {
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

      updateCurrentRecord((current) => {
        if (current.shoes.some((shoe) => shoe.name.toLowerCase() === trimmed.toLowerCase())) {
          return current;
        }

        return {
          ...current,
          shoes: [
            ...current.shoes,
            {
              id: createId("shoe"),
              name: trimmed,
              brand: nextShoe.brand?.trim() || undefined,
              notes: nextShoe.notes?.trim() || undefined,
              mileageAlert: nextShoe.mileageAlert ?? 325,
            },
          ],
        };
      });
    },
    [updateCurrentRecord]
  );

  const shoeMileageMap = useMemo(() => {
    return currentRecord.workouts.reduce<Record<string, number>>((accumulator, workout) => {
      if (!workout.shoeId) {
        return accumulator;
      }

      const miles = parseDistance(workout.distance) ?? 0;
      accumulator[workout.shoeId] = (accumulator[workout.shoeId] ?? 0) + miles;
      return accumulator;
    }, {});
  }, [currentRecord.workouts]);

  const getShoeMileage = useCallback(
    (shoeId: string) => shoeMileageMap[shoeId] ?? 0,
    [shoeMileageMap]
  );

  const toggleLikedWorkout = useCallback(
    (workoutId: string, category: WorkoutPreferenceCategory) => {
      updateCurrentRecord((current) => {
        if (current.likedWorkoutIds[workoutId]) {
          const nextLiked = { ...current.likedWorkoutIds };
          delete nextLiked[workoutId];

          return {
            ...current,
            likedWorkoutIds: nextLiked,
          };
        }

        return {
          ...current,
          likedWorkoutIds: {
            ...current.likedWorkoutIds,
            [workoutId]: category,
          },
        };
      });
    },
    [updateCurrentRecord]
  );

  const likedWorkoutCategories = [...new Set(Object.values(currentRecord.likedWorkoutIds))];
  const isWorkoutLiked = useCallback(
    (workoutId: string) => Boolean(currentRecord.likedWorkoutIds[workoutId]),
    [currentRecord.likedWorkoutIds]
  );

  const completePlannedWorkout = useCallback(
    (
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
        reflectionFeel?: WorkoutType["reflectionFeel"];
        expectation?: WorkoutType["expectation"];
      }
    ) => {
      updateCurrentRecord((current) => {
        const nextCompleted = current.completedWorkoutIds.includes(day.id)
          ? current.completedWorkoutIds
          : [...current.completedWorkoutIds, day.id];
        const nextSkipped = current.skippedWorkoutIds.filter((id) => id !== day.id);
        const nextWorkouts = input.skipWorkoutSave
          ? current.workouts
          : [
              {
                id: createId("workout"),
                type: input.typeOverride ?? day.logType,
                distance: input.distanceOverride ?? String(day.distance),
                time: input.time ?? "Completed",
                splits: input.splits ?? "",
                effort: input.effort,
                notes: input.notes?.trim() || `Completed from weekly plan: ${day.title}`,
                date: input.dateOverride ?? new Date().toISOString(),
                shoeId: input.shoeId ?? null,
                reflectionFeel: input.reflectionFeel,
                expectation: input.expectation,
              },
              ...current.workouts,
            ];

        return {
          ...current,
          completedWorkoutIds: nextCompleted,
          skippedWorkoutIds: nextSkipped,
          workouts: nextWorkouts,
        };
      });
    },
    [updateCurrentRecord]
  );

  const isWorkoutCompleted = useCallback(
    (workoutId: string) => currentRecord.completedWorkoutIds.includes(workoutId),
    [currentRecord.completedWorkoutIds]
  );
  const isWorkoutSkipped = useCallback(
    (workoutId: string) => currentRecord.skippedWorkoutIds.includes(workoutId),
    [currentRecord.skippedWorkoutIds]
  );

  const setPlanDayNote = useCallback(
    (dateKey: string, note: string) => {
      updateCurrentRecord((current) => {
        const trimmed = note.trim();

        if (!trimmed) {
          const nextNotes = { ...current.planDayNotes };
          delete nextNotes[dateKey];

          return {
            ...current,
            planDayNotes: nextNotes,
          };
        }

        return {
          ...current,
          planDayNotes: {
            ...current.planDayNotes,
            [dateKey]: trimmed,
          },
        };
      });
    },
    [updateCurrentRecord]
  );

  const skipPlannedWorkout = useCallback(
    (day: PlanDay) => {
      updateCurrentRecord((current) => ({
        ...current,
        skippedWorkoutIds: current.skippedWorkoutIds.includes(day.id)
          ? current.skippedWorkoutIds
          : [...current.skippedWorkoutIds, day.id],
        completedWorkoutIds: current.completedWorkoutIds.filter((id) => id !== day.id),
      }));
    },
    [updateCurrentRecord]
  );

  const advancePlanWeek = useCallback(() => {
    updateCurrentRecord((current) => ({
      ...current,
      completedWorkoutIds: [],
      skippedWorkoutIds: [],
      planCycle: current.planCycle + 1,
    }));
  }, [updateCurrentRecord]);

  const assignWorkoutToDate = useCallback(
    (
      dateKey: string,
      workout: Omit<PlannedWorkoutOverride, "id" | "dateKey">
    ) => {
      updateCurrentRecord((current) => ({
        ...current,
        plannedOverrides: {
          ...current.plannedOverrides,
          [dateKey]: {
            id: `override-${dateKey}`,
            dateKey,
            ...workout,
          },
        },
      }));
    },
    [updateCurrentRecord]
  );

  return (
    <WorkoutContext.Provider
      value={{
        workouts: currentRecord.workouts,
        addWorkout,
        shoes: currentRecord.shoes,
        addShoe,
        getShoeMileage,
        likedWorkoutIds: currentRecord.likedWorkoutIds,
        likedWorkoutCategories,
        toggleLikedWorkout,
        isWorkoutLiked,
        completedWorkoutIds: currentRecord.completedWorkoutIds,
        skippedWorkoutIds: currentRecord.skippedWorkoutIds,
        planDayNotes: currentRecord.planDayNotes,
        completePlannedWorkout,
        skipPlannedWorkout,
        isWorkoutCompleted,
        isWorkoutSkipped,
        setPlanDayNote,
        planCycle: currentRecord.planCycle,
        advancePlanWeek,
        plannedOverrides: currentRecord.plannedOverrides,
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
