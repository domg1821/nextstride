import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/contexts/profile-context";
import { supabase } from "@/lib/supabase";
import { readStoredJson, writeStoredJson } from "@/utils/local-storage";

const ENGINE_STORAGE_KEY = "nextstride.engine.by-account.v1";
const SUPABASE_ENGINE_RECORDS_TABLE = "engine_records";

export type SleepQuality = "solid" | "mixed" | "poor";
export type HeartRateTrend = "stable" | "slightly_up" | "elevated";
export type FuelingStatus = "solid" | "mixed" | "low";
export type RecoveryLevel = "good" | "moderate" | "strained";
export type FatigueLevel = "fresh" | "steady" | "heavy";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snacks";
export type FoodCategory = "fruit" | "carb" | "protein" | "fat" | "fuel" | "meal" | "custom";
export type ConditionTrainingPreferences = {
  temperature: string;
  humidity: string;
  windSpeed: string;
  runType: "outside" | "treadmill";
  exposure: "sunny" | "shaded" | "cloudy";
  feelsLikeNote: string;
};

export type ReusableFood = {
  id: string;
  name: string;
  servingLabel: string;
  caloriesPerServing: number;
  category?: FoodCategory;
  isFavorite?: boolean;
  lastUsedAt?: string;
};

export type FoodLogEntry = {
  id: string;
  meal: MealSlot;
  name: string;
  calories: number;
  servings: number;
  servingLabel?: string;
  caloriesPerServing?: number;
  notes?: string;
  createdAt: string;
};

export type EngineRecord = {
  sleepHours: string;
  sleepQuality: SleepQuality;
  sleepScore: number | null;
  restingHr: string;
  activeHr: string;
  heartRateTrend: HeartRateTrend;
  fuelingStatus: FuelingStatus;
  fatigueLevel: FatigueLevel;
  foodLogsByDate: Record<string, FoodLogEntry[]>;
  customFoods: ReusableFood[];
  recentFoods: ReusableFood[];
  conditionPreferences: ConditionTrainingPreferences;
  recoveryLevel: RecoveryLevel;
  updatedAt: string | null;
};

type EngineContextType = {
  engine: EngineRecord;
  updateEngine: (updates: Partial<EngineRecord>) => void;
  addFoodLog: (
    dateKey: string,
    entry: {
      meal: MealSlot;
      name: string;
      calories: number;
      servings?: number;
      servingLabel?: string;
      caloriesPerServing?: number;
      notes?: string;
      saveToCustomFoods?: boolean;
    }
  ) => void;
  removeFoodLog: (dateKey: string, entryId: string) => void;
};

const DEFAULT_ENGINE: EngineRecord = {
  sleepHours: "7.5",
  sleepQuality: "solid",
  sleepScore: 82,
  restingHr: "",
  activeHr: "",
  heartRateTrend: "stable",
  fuelingStatus: "mixed",
  fatigueLevel: "steady",
  foodLogsByDate: {},
  customFoods: [],
  recentFoods: [],
  conditionPreferences: {
    temperature: "",
    humidity: "",
    windSpeed: "",
    runType: "outside",
    exposure: "shaded",
    feelsLikeNote: "",
  },
  recoveryLevel: "moderate",
  updatedAt: null,
};

function normalizeEngineRecord(record?: Partial<EngineRecord>): EngineRecord {
  return {
    ...DEFAULT_ENGINE,
    ...record,
    foodLogsByDate: record?.foodLogsByDate ?? {},
    customFoods: record?.customFoods ?? [],
    recentFoods: record?.recentFoods ?? [],
    conditionPreferences: {
      ...DEFAULT_ENGINE.conditionPreferences,
      ...(record?.conditionPreferences ?? {}),
    },
  };
}

const EngineContext = createContext<EngineContextType | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const { account, authReady, userId } = useProfile();
  const accountKey = userId ?? account?.email ?? "guest";
  const [recordsByAccount, setRecordsByAccount] = useState<Record<string, EngineRecord>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [remoteReadyKey, setRemoteReadyKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const stored = await readStoredJson<Record<string, EngineRecord>>(ENGINE_STORAGE_KEY, {});

      if (!isMounted) {
        return;
      }

      setRecordsByAccount(
        Object.fromEntries(
          Object.entries(stored).map(([key, value]) => [key, normalizeEngineRecord(value)])
        )
      );
      setStorageReady(true);
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !storageReady) {
      return;
    }

    void writeStoredJson(ENGINE_STORAGE_KEY, recordsByAccount);
  }, [authReady, recordsByAccount, storageReady]);

  const engine = useMemo(
    () => normalizeEngineRecord(recordsByAccount[accountKey]),
    [accountKey, recordsByAccount]
  );

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
        .from(SUPABASE_ENGINE_RECORDS_TABLE)
        .select("record")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn("Unable to load engine record from Supabase:", error.message);
        setRemoteReadyKey(userId);
        return;
      }

      if (data?.record) {
        setRecordsByAccount((current) => ({
          ...current,
          [accountKey]: normalizeEngineRecord(data.record as Partial<EngineRecord>),
        }));
      } else {
        const { error: upsertError } = await supabase.from(SUPABASE_ENGINE_RECORDS_TABLE).upsert(
          {
            user_id: userId,
            email: account?.email?.trim().toLowerCase() ?? null,
            record: engine,
          },
          { onConflict: "user_id" }
        );

        if (upsertError) {
          console.warn("Unable to seed engine record in Supabase:", upsertError.message);
        }
      }

      setRemoteReadyKey(userId);
    };

    void hydrateRemoteRecord();

    return () => {
      isMounted = false;
    };
  }, [account?.email, accountKey, authReady, engine, storageReady, userId]);

  useEffect(() => {
    if (!authReady || !storageReady || !userId || remoteReadyKey !== userId) {
      return;
    }

    void supabase
      .from(SUPABASE_ENGINE_RECORDS_TABLE)
      .upsert(
        {
          user_id: userId,
          email: account?.email?.trim().toLowerCase() ?? null,
          record: engine,
        },
        { onConflict: "user_id" }
      )
      .then(({ error }) => {
        if (error) {
          console.warn("Unable to save engine record to Supabase:", error.message);
        }
      });
  }, [account?.email, authReady, engine, remoteReadyKey, storageReady, userId]);

  const updateEngine = useCallback(
    (updates: Partial<EngineRecord>) => {
      setRecordsByAccount((current) => ({
        ...current,
        [accountKey]: {
          ...normalizeEngineRecord(current[accountKey]),
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [accountKey]
  );

  const addFoodLog = useCallback(
    (
      dateKey: string,
        entry: {
          meal: MealSlot;
          name: string;
          calories: number;
          servings?: number;
          servingLabel?: string;
          caloriesPerServing?: number;
          notes?: string;
          saveToCustomFoods?: boolean;
        }
      ) => {
      const trimmedName = entry.name.trim();

      if (!trimmedName || !Number.isFinite(entry.calories) || entry.calories <= 0) {
        return;
      }

      setRecordsByAccount((current) => {
        const existing = normalizeEngineRecord(current[accountKey]);
        const dayEntries = existing.foodLogsByDate[dateKey] ?? [];
        const normalizedReusableFood =
          entry.caloriesPerServing && entry.caloriesPerServing > 0
            ? {
                id: createReusableFoodId(trimmedName, entry.servingLabel || "serving", entry.caloriesPerServing),
                name: trimmedName,
                servingLabel: entry.servingLabel?.trim() || "1 serving",
                caloriesPerServing: Math.round(entry.caloriesPerServing),
                category: "custom",
                lastUsedAt: new Date().toISOString(),
              }
            : null;
        const nextRecentFoods = normalizedReusableFood
          ? mergeReusableFood(existing.recentFoods, normalizedReusableFood).slice(0, 10)
          : existing.recentFoods;
        const nextCustomFoods =
          normalizedReusableFood && entry.saveToCustomFoods
            ? mergeReusableFood(existing.customFoods, normalizedReusableFood)
            : existing.customFoods;

        return {
          ...current,
          [accountKey]: {
            ...existing,
            foodLogsByDate: {
              ...existing.foodLogsByDate,
              [dateKey]: [
                {
                  id: `meal-${Math.random().toString(36).slice(2, 10)}`,
                  meal: entry.meal,
                  name: trimmedName,
                  calories: Math.round(entry.calories),
                  servings: entry.servings && entry.servings > 0 ? entry.servings : 1,
                  servingLabel: entry.servingLabel?.trim() || undefined,
                  caloriesPerServing:
                    entry.caloriesPerServing && entry.caloriesPerServing > 0
                      ? Math.round(entry.caloriesPerServing)
                      : undefined,
                  notes: entry.notes?.trim() || undefined,
                  createdAt: new Date().toISOString(),
                },
                ...dayEntries,
              ],
            },
            recentFoods: nextRecentFoods,
            customFoods: nextCustomFoods,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [accountKey]
  );

  const removeFoodLog = useCallback(
    (dateKey: string, entryId: string) => {
      setRecordsByAccount((current) => {
        const existing = normalizeEngineRecord(current[accountKey]);
        const dayEntries = existing.foodLogsByDate[dateKey] ?? [];
        const nextEntries = dayEntries.filter((entry) => entry.id !== entryId);
        const nextFoodLogs = { ...existing.foodLogsByDate };

        if (nextEntries.length === 0) {
          delete nextFoodLogs[dateKey];
        } else {
          nextFoodLogs[dateKey] = nextEntries;
        }

        return {
          ...current,
          [accountKey]: {
            ...existing,
            foodLogsByDate: nextFoodLogs,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [accountKey]
  );

  const value = useMemo(
    () => ({
      engine,
      updateEngine,
      addFoodLog,
      removeFoodLog,
    }),
    [addFoodLog, engine, removeFoodLog, updateEngine]
  );

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const context = useContext(EngineContext);

  if (!context) {
    throw new Error("useEngine must be used inside EngineProvider");
  }

  return context;
}

function createReusableFoodId(name: string, servingLabel: string, caloriesPerServing: number) {
  return `${name.trim().toLowerCase()}-${servingLabel.trim().toLowerCase()}-${Math.round(caloriesPerServing)}`.replace(
    /\s+/g,
    "-"
  );
}

function mergeReusableFood(existingFoods: ReusableFood[], nextFood: ReusableFood) {
  return [nextFood, ...existingFoods.filter((food) => food.id !== nextFood.id)];
}
