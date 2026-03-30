import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { readStoredJson, writeStoredJson } from "@/utils/local-storage";
import { formatDuration, parseDistance, parseTimeToSeconds } from "@/utils/workout-utils";

const AUTH_ACCOUNTS_STORAGE_KEY = "nextstride.auth.accounts.v3";
const SUPABASE_PROFILES_TABLE = "profiles";

export type RunnerLevel = "total_beginner" | "beginner" | "intermediate" | "advanced";
export type AccountType = "solo_runner" | "coach" | "team_runner";

export type RunningExperienceOption =
  | "completely_new"
  | "inconsistent"
  | "somewhat_consistent"
  | "very_consistent";

export type AbilityOption = "no" | "barely" | "yes";
export type FrequencyOption = "0" | "1-2" | "3-4" | "5-6" | "7";
export type MileageOption = "0" | "1-10" | "11-20" | "21-35" | "36+";
export type LongestRunOption = "less_than_2" | "3-5" | "6-8" | "9+";
export type GoalOption =
  | "start_running"
  | "get_fitter"
  | "run_5k"
  | "run_10k"
  | "run_half"
  | "run_marathon"
  | "get_faster";

export type TrainingPreferenceOption = 3 | 4 | 5 | 6 | 7;
export type RaceDistanceOption =
  | "none"
  | "800"
  | "1600/mile"
  | "5k"
  | "10k"
  | "half marathon"
  | "marathon";

export type OnboardingSurveyAnswers = {
  accountType: AccountType | "";
  runningExperience: RunningExperienceOption | "";
  canRunTwentyMinutes: AbilityOption | "";
  currentFrequency: FrequencyOption | "";
  weeklyMileageRange: MileageOption | "";
  longestRecentRun: LongestRunOption | "";
  mainGoal: GoalOption | "";
  preferredTrainingDays: TrainingPreferenceOption | 0;
  recentResultDistance: RaceDistanceOption | "";
  recentResultTime: string;
  goalRaceDistance: Exclude<RaceDistanceOption, "none"> | "";
  goalTime: string;
  goalRaceDate: string;
};

export type PRsType = {
  "400": string;
  "800": string;
  "1600": string;
  "3200": string;
  "5k": string;
  "10k": string;
  half: string;
  marathon: string;
};

export type RaceGoalType = {
  id: string;
  event: string;
  goalTime: string;
  raceDate: string;
};

export type ProfileType = {
  name: string;
  mileage: string;
  goalEvent: string;
  pr5k: string;
  prs: PRsType;
  raceGoals: RaceGoalType[];
  age: string;
  restingHeartRate: string;
  maxHeartRate: string;
  image?: string;
  accountType: AccountType;
  onboardingComplete: boolean;
  runnerLevel: RunnerLevel | null;
  onboardingAnswers: OnboardingSurveyAnswers;
  preferredTrainingDays: number;
};

export type NotificationPreferences = {
  workoutReminders: boolean;
  longRunReminders: boolean;
  weeklyGoalReminders: boolean;
  streakReminders: boolean;
  recoveryReminders: boolean;
};

export type HeartRateZone = {
  name: string;
  label: string;
  min: number;
  max: number;
};

type StoredAccount = {
  email: string;
  profile: ProfileType;
  notifications: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
};

type AuthResult = {
  ok: boolean;
  error?: string;
  nextStep?: "onboarding" | "app";
  appRoute?: AppRoute;
};

type OnboardingResult = {
  ok: boolean;
  error?: string;
};

type ProfileContextType = {
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
  updateProfile: (updates: Partial<ProfileType>) => void;
  applyAutomaticPr: (input: { distance: string; time: string }) => {
    matchedEvent: keyof PRsType | null;
    updated: boolean;
    label?: string;
    time?: string;
  };
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  account: StoredAccount | null;
  displayName: string;
  isAuthenticated: boolean;
  authReady: boolean;
  requiresOnboarding: boolean;
  sessionRestored: boolean;
  sessionStatusMessage: string;
  appHomeRoute: AppRoute;
  resolvedMaxHeartRate: number | null;
  heartRateZones: HeartRateZone[];
  signUp: (input: { name?: string; email: string; password: string; accountType: AccountType }) => Promise<AuthResult>;
  logIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  completeOnboarding: (answers: OnboardingSurveyAnswers) => Promise<OnboardingResult>;
  signOut: () => void;
};

type SupabaseProfileRow = {
  user_id?: string;
  email?: string;
  name?: string;
  mileage?: string | number | null;
  goal_event?: string | null;
  pr5k?: string | null;
  prs?: PRsType | null;
  race_goals?: RaceGoalType[] | null;
  age?: string | number | null;
  resting_heart_rate?: string | number | null;
  max_heart_rate?: string | number | null;
  image?: string | null;
  account_type?: AccountType | null;
  onboarding_complete?: boolean | null;
  runner_level?: RunnerLevel | null;
  onboarding_answers?: Partial<OnboardingSurveyAnswers> | null;
  training_days_per_week?: number | null;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

const PR_EVENT_RULES: {
  key: keyof PRsType;
  label: string;
  miles: number;
  tolerance: number;
}[] = [
  { key: "400", label: "400m", miles: 0.2485, tolerance: 0.02 },
  { key: "800", label: "800m", miles: 0.4971, tolerance: 0.03 },
  { key: "1600", label: "1600m / Mile", miles: 0.9942, tolerance: 0.04 },
  { key: "3200", label: "3200m / 2 Mile", miles: 1.9884, tolerance: 0.06 },
  { key: "5k", label: "5K", miles: 3.1069, tolerance: 0.08 },
  { key: "10k", label: "10K", miles: 6.2137, tolerance: 0.12 },
  { key: "half", label: "Half Marathon", miles: 13.1094, tolerance: 0.2 },
  { key: "marathon", label: "Marathon", miles: 26.2188, tolerance: 0.35 },
];

const EMPTY_PRS: PRsType = {
  "400": "",
  "800": "",
  "1600": "",
  "3200": "",
  "5k": "",
  "10k": "",
  half: "",
  marathon: "",
};

const EMPTY_ONBOARDING_ANSWERS: OnboardingSurveyAnswers = {
  accountType: "",
  runningExperience: "",
  canRunTwentyMinutes: "",
  currentFrequency: "",
  weeklyMileageRange: "",
  longestRecentRun: "",
  mainGoal: "",
  preferredTrainingDays: 0,
  recentResultDistance: "",
  recentResultTime: "",
  goalRaceDistance: "",
  goalTime: "",
  goalRaceDate: "",
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  workoutReminders: true,
  longRunReminders: true,
  weeklyGoalReminders: true,
  streakReminders: true,
  recoveryReminders: false,
};

const EMPTY_PROFILE: ProfileType = {
  name: "",
  mileage: "",
  goalEvent: "",
  pr5k: "",
  prs: EMPTY_PRS,
  raceGoals: [],
  age: "",
  restingHeartRate: "",
  maxHeartRate: "",
  accountType: "solo_runner",
  onboardingComplete: false,
  runnerLevel: null,
  onboardingAnswers: EMPTY_ONBOARDING_ANSWERS,
  preferredTrainingDays: 4,
};

type AppRoute = "/(tabs)" | "/coach-app" | "/team-app";

export function getAppRouteForAccountType(accountType: AccountType | "" | null | undefined): AppRoute {
  switch (accountType) {
    case "coach":
      return "/coach-app";
    case "team_runner":
      return "/team-app";
    default:
      return "/(tabs)";
  }
}

function normalizeAccountType(accountType: AccountType | "" | null | undefined): AccountType {
  switch (accountType) {
    case "coach":
    case "team_runner":
      return accountType;
    default:
      return "solo_runner";
  }
}

function shouldRequireOnboarding(
  profile: Pick<ProfileType, "accountType" | "onboardingComplete"> | null | undefined
) {
  if (!profile) {
    return false;
  }

  return normalizeAccountType(profile.accountType) === "solo_runner" && !profile.onboardingComplete;
}

function getPostAuthNextStep(
  profile: Pick<ProfileType, "accountType" | "onboardingComplete"> | null | undefined
): "onboarding" | "app" {
  return shouldRequireOnboarding(profile) ? "onboarding" : "app";
}

function normalizeProfile(profile: ProfileType): ProfileType {
  const prs = {
    ...EMPTY_PRS,
    ...profile.prs,
  };
  const pr5k = profile.pr5k || prs["5k"] || "";

  return {
    ...EMPTY_PROFILE,
    ...profile,
    accountType: normalizeAccountType(profile.accountType),
    pr5k,
    prs: {
      ...prs,
      "5k": pr5k,
    },
    onboardingAnswers: {
      ...EMPTY_ONBOARDING_ANSWERS,
      ...(profile.onboardingAnswers ?? {}),
    },
    preferredTrainingDays:
      Number.isFinite(profile.preferredTrainingDays) && profile.preferredTrainingDays >= 3
        ? profile.preferredTrainingDays
        : profile.onboardingAnswers?.preferredTrainingDays || 4,
  };
}

function formatDisplayName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeStoredAccount(email: string, account?: Partial<StoredAccount> | null): StoredAccount {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  return {
    email: normalizedEmail,
    profile: normalizeProfile(account?.profile ?? EMPTY_PROFILE),
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
      ...(account?.notifications ?? {}),
    },
    createdAt: account?.createdAt ?? now,
    updatedAt: account?.updatedAt ?? now,
  };
}

function buildStoredAccount(
  email: string,
  user?: User | null,
  existing?: StoredAccount | null,
  profileOverride?: Partial<ProfileType> | null
): StoredAccount {
  const normalizedEmail = email.trim().toLowerCase();
  const fallbackName =
    formatDisplayName((user?.user_metadata?.name as string | undefined) || "") ||
    profileOverride?.name ||
    existing?.profile.name ||
    deriveNameFromEmail(normalizedEmail);
  const fallbackAccountType = normalizeAccountType(
    profileOverride?.accountType ||
      (user?.user_metadata?.account_type as AccountType | undefined) ||
      existing?.profile.accountType
  );
  const now = new Date().toISOString();

  return {
    email: normalizedEmail,
    profile: normalizeProfile({
      ...EMPTY_PROFILE,
      ...existing?.profile,
      ...profileOverride,
      accountType: fallbackAccountType,
      name: fallbackName,
    }),
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
      ...(existing?.notifications ?? {}),
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function getFriendlyAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("email rate limit exceeded") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Too many requests were sent. Please wait a bit, then try again.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  return message;
}

function classifyRunner(answers: OnboardingSurveyAnswers): RunnerLevel {
  if (
    answers.canRunTwentyMinutes === "no" &&
    (answers.currentFrequency === "0" || answers.currentFrequency === "1-2") &&
    (answers.weeklyMileageRange === "0" || answers.weeklyMileageRange === "1-10")
  ) {
    return "total_beginner";
  }

  let score = 0;

  switch (answers.runningExperience) {
    case "inconsistent":
      score += 1;
      break;
    case "somewhat_consistent":
      score += 2;
      break;
    case "very_consistent":
      score += 3;
      break;
  }

  switch (answers.canRunTwentyMinutes) {
    case "barely":
      score += 1;
      break;
    case "yes":
      score += 3;
      break;
  }

  switch (answers.currentFrequency) {
    case "1-2":
      score += 1;
      break;
    case "3-4":
      score += 2;
      break;
    case "5-6":
      score += 3;
      break;
    case "7":
      score += 4;
      break;
  }

  switch (answers.weeklyMileageRange) {
    case "1-10":
      score += 1;
      break;
    case "11-20":
      score += 2;
      break;
    case "21-35":
      score += 3;
      break;
    case "36+":
      score += 4;
      break;
  }

  switch (answers.longestRecentRun) {
    case "3-5":
      score += 1;
      break;
    case "6-8":
      score += 2;
      break;
    case "9+":
      score += 3;
      break;
  }

  if (score <= 3) {
    return "total_beginner";
  }

  if (score <= 7) {
    return "beginner";
  }

  if (score <= 11) {
    return "intermediate";
  }

  return "advanced";
}

function mileageFromSurvey(range: MileageOption | "") {
  switch (range) {
    case "0":
      return "6";
    case "1-10":
      return "10";
    case "11-20":
      return "18";
    case "21-35":
      return "30";
    case "36+":
      return "42";
    default:
      return "12";
  }
}

function goalEventFromSurvey(goal: GoalOption | "") {
  switch (goal) {
    case "run_10k":
      return "10k";
    case "run_half":
      return "half marathon";
    case "run_marathon":
      return "marathon";
    case "get_faster":
      return "5k";
    case "run_5k":
      return "5k";
    case "start_running":
      return "5k";
    case "get_fitter":
      return "5k";
    default:
      return "5k";
  }
}

function goalEventFromGoalDistance(goalRaceDistance: OnboardingSurveyAnswers["goalRaceDistance"]) {
  return goalRaceDistance || "5k";
}

function mapRaceDistanceToPrKey(distance: RaceDistanceOption | ""): keyof PRsType | null {
  switch (distance) {
    case "800":
      return "800";
    case "1600/mile":
      return "1600";
    case "5k":
      return "5k";
    case "10k":
      return "10k";
    case "half marathon":
      return "half";
    case "marathon":
      return "marathon";
    default:
      return null;
  }
}

function getRaceDistanceMiles(distance: RaceDistanceOption | "") {
  switch (distance) {
    case "800":
      return 0.4971;
    case "1600/mile":
      return 1;
    case "5k":
      return 3.1069;
    case "10k":
      return 6.2137;
    case "half marathon":
      return 13.1094;
    case "marathon":
      return 26.2188;
    default:
      return null;
  }
}

function estimateEquivalent5k(recentDistance: RaceDistanceOption | "", recentTime: string) {
  const seconds = parseTimeToSeconds(recentTime);
  const miles = getRaceDistanceMiles(recentDistance);

  if (!seconds || !miles) {
    return "";
  }

  const estimated5kSeconds = seconds * Math.pow(3.1069 / miles, 1.06);
  return formatDuration(Math.round(estimated5kSeconds));
}

function buildRaceGoalsFromAnswers(
  answers: OnboardingSurveyAnswers,
  existingGoals: RaceGoalType[]
) {
  if (!answers.goalRaceDistance) {
    return existingGoals;
  }

  const nextGoal: RaceGoalType = {
    id: existingGoals[0]?.id ?? `goal-${Date.now()}`,
    event: answers.goalRaceDistance,
    goalTime: answers.goalTime.trim(),
    raceDate: answers.goalRaceDate.trim(),
  };

  const remainingGoals = existingGoals.filter((goal) => goal.id !== nextGoal.id);
  return [nextGoal, ...remainingGoals].slice(0, 4);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown Supabase error.";
}

function mapSupabaseProfileRow(row: SupabaseProfileRow | null | undefined): Partial<ProfileType> | null {
  if (!row) {
    return null;
  }

  return {
    name: row.name ?? "",
    mileage: row.mileage ? String(row.mileage) : "",
    goalEvent: row.goal_event ?? "",
    pr5k: row.pr5k ?? "",
    prs: row.prs ?? EMPTY_PRS,
    raceGoals: row.race_goals ?? [],
    age: row.age ? String(row.age) : "",
    restingHeartRate: row.resting_heart_rate ? String(row.resting_heart_rate) : "",
    maxHeartRate: row.max_heart_rate ? String(row.max_heart_rate) : "",
    image: row.image ?? undefined,
    accountType: normalizeAccountType(row.account_type ?? row.onboarding_answers?.accountType),
    onboardingComplete: Boolean(row.onboarding_complete),
    runnerLevel: row.runner_level ?? null,
    onboardingAnswers: {
      ...EMPTY_ONBOARDING_ANSWERS,
      ...(row.onboarding_answers ?? {}),
    },
    preferredTrainingDays: row.training_days_per_week ?? row.onboarding_answers?.preferredTrainingDays ?? 4,
  };
}

function toSupabaseProfilePayload(user: User, profile: ProfileType) {
  return {
    user_id: user.id,
    email: user.email?.trim().toLowerCase() || "",
    name: profile.name,
    mileage: profile.mileage,
    goal_event: profile.goalEvent,
    pr5k: profile.pr5k,
    prs: profile.prs,
    race_goals: profile.raceGoals,
    age: profile.age,
    resting_heart_rate: profile.restingHeartRate,
    max_heart_rate: profile.maxHeartRate,
    image: profile.image ?? null,
    account_type: profile.accountType,
    onboarding_complete: profile.onboardingComplete,
    runner_level: profile.runnerLevel,
    onboarding_answers: profile.onboardingAnswers,
    training_days_per_week: profile.preferredTrainingDays,
    updated_at: new Date().toISOString(),
  };
}

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [accountsByEmail, setAccountsByEmail] = useState<Record<string, StoredAccount>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<ProfileType>(EMPTY_PROFILE);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [authReady, setAuthReady] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sessionStatusMessage, setSessionStatusMessage] = useState("");
  const accountsByEmailRef = useRef<Record<string, StoredAccount>>({});
  const authRequestInFlightRef = useRef(false);
  const authHydratedRef = useRef(false);
  const profileKeyRef = useRef<"user_id" | "id" | null>(null);

  useEffect(() => {
    accountsByEmailRef.current = accountsByEmail;
  }, [accountsByEmail]);

  const fetchProfileFromSupabase = useCallback(async (userId: string) => {
    const userIdQuery = await supabase
      .from(SUPABASE_PROFILES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!userIdQuery.error) {
      if (userIdQuery.data) {
        profileKeyRef.current = "user_id";
      }

      return mapSupabaseProfileRow(userIdQuery.data as SupabaseProfileRow | null);
    }

    const idQuery = await supabase
      .from(SUPABASE_PROFILES_TABLE)
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (idQuery.error) {
      profileKeyRef.current = null;
      return null;
    }

    if (idQuery.data) {
      profileKeyRef.current = "id";
    }

    return mapSupabaseProfileRow(idQuery.data as SupabaseProfileRow | null);
  }, []);

  const upsertProfileToSupabase = useCallback(async (user: User, nextProfile: ProfileType) => {
    const payload = toSupabaseProfilePayload(user, nextProfile);
    const { user_id: _userId, ...payloadWithoutUserId } = payload;
    const candidates: { key: "user_id" | "id"; payload: Record<string, unknown> }[] =
      profileKeyRef.current === "id"
        ? [{ key: "id", payload: { ...payloadWithoutUserId, id: user.id } }]
        : profileKeyRef.current === "user_id"
          ? [{ key: "user_id", payload }]
          : [
              { key: "user_id", payload },
              { key: "id", payload: { ...payloadWithoutUserId, id: user.id } },
            ];

    let lastError: unknown = null;

    for (const candidate of candidates) {
      const { error } = await supabase
        .from(SUPABASE_PROFILES_TABLE)
        .upsert(candidate.payload, { onConflict: candidate.key });

      if (!error) {
        profileKeyRef.current = candidate.key;
        return;
      }

      lastError = error;
    }

    throw lastError ?? new Error("Unable to save profile.");
  }, []);

  const syncUserState = useCallback(
    async (user: User | null, options?: { restored?: boolean; statusMessage?: string }) => {
      setCurrentUser(user);
      setSessionRestored(Boolean(options?.restored && user));

      if (!user) {
        setProfileState(EMPTY_PROFILE);
        setNotificationPreferences(DEFAULT_NOTIFICATIONS);
        setSessionStatusMessage(options?.statusMessage ?? "");
        return null;
      }

      const email = user.email?.trim().toLowerCase();

      if (!email) {
        setProfileState(EMPTY_PROFILE);
        setNotificationPreferences(DEFAULT_NOTIFICATIONS);
        setSessionStatusMessage(options?.statusMessage ?? "");
        return null;
      }

      const remoteProfile = await fetchProfileFromSupabase(user.id);
      const storedAccount = buildStoredAccount(email, user, accountsByEmailRef.current[email], remoteProfile);

      setAccountsByEmail((currentAccounts) => ({
        ...currentAccounts,
        [email]: storedAccount,
      }));
      setProfileState(storedAccount.profile);
      setNotificationPreferences(storedAccount.notifications);
      setSessionStatusMessage(
        options?.statusMessage ??
          (storedAccount.profile.onboardingComplete
            ? `Welcome back, ${storedAccount.profile.name || "Runner"}.`
            : "Finish onboarding to build your personalized training plan.")
      );

      return storedAccount;
    },
    [fetchProfileFromSupabase]
  );

  const runExclusiveAuthAction = useCallback(async <T,>(action: () => Promise<T>, fallback: T) => {
    if (authRequestInFlightRef.current) {
      return fallback;
    }

    authRequestInFlightRef.current = true;

    try {
      return await action();
    } finally {
      authRequestInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuthState = async () => {
      authHydratedRef.current = false;

      const storedAccounts = await readStoredJson<Record<string, Partial<StoredAccount>>>(
        AUTH_ACCOUNTS_STORAGE_KEY,
        {}
      );
      const normalizedAccounts = Object.fromEntries(
        Object.entries(storedAccounts).map(([email, account]) => [
          email.trim().toLowerCase(),
          normalizeStoredAccount(email, account),
        ])
      );

      if (!isMounted) {
        return;
      }

      setAccountsByEmail(normalizedAccounts);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (session?.user) {
        const syncedAccount = await syncUserState(session.user, {
          restored: true,
          statusMessage: `Session restored for ${session.user.email?.trim().toLowerCase() || "your account"}.`,
        });

        if (!isMounted) {
          return;
        }

        if (syncedAccount) {
          setSessionRestored(true);
        }
      } else {
        setCurrentUser(null);
        setProfileState(EMPTY_PROFILE);
        setNotificationPreferences(DEFAULT_NOTIFICATIONS);
        setSessionRestored(false);
        setSessionStatusMessage("");
      }

      authHydratedRef.current = true;
      setAuthReady(true);
    };

    void hydrateAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!authHydratedRef.current) {
        return;
      }

      void syncUserState(session?.user ?? null, {
        restored: event === "INITIAL_SESSION",
        statusMessage: event === "SIGNED_OUT" ? "" : undefined,
      });
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserState]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    void writeStoredJson(AUTH_ACCOUNTS_STORAGE_KEY, accountsByEmail);
  }, [accountsByEmail, authReady]);

  const account = useMemo(() => {
    const email = currentUser?.email?.trim().toLowerCase();

    if (!email) {
      return null;
    }

    return accountsByEmail[email] ?? buildStoredAccount(email, currentUser, null);
  }, [accountsByEmail, currentUser]);
  const appHomeRoute = useMemo(() => getAppRouteForAccountType(profile.accountType), [profile.accountType]);

  const parsedAge = Number.parseInt(profile.age, 10);
  const parsedMaxHeartRate = Number.parseInt(profile.maxHeartRate, 10);
  const resolvedMaxHeartRate = useMemo(
    () =>
      Number.isFinite(parsedMaxHeartRate) && parsedMaxHeartRate > 0
        ? parsedMaxHeartRate
        : Number.isFinite(parsedAge) && parsedAge > 0
          ? 220 - parsedAge
          : null,
    [parsedAge, parsedMaxHeartRate]
  );
  const heartRateZones = useMemo(
    () => (resolvedMaxHeartRate ? buildHeartRateZones(resolvedMaxHeartRate) : []),
    [resolvedMaxHeartRate]
  );

  const persistAccountUpdate = useCallback((email: string, updates: Partial<StoredAccount>) => {
    const normalizedEmail = email.trim().toLowerCase();

    setAccountsByEmail((currentAccounts) => {
      const currentAccount = currentAccounts[normalizedEmail] ?? normalizeStoredAccount(normalizedEmail, null);

      return {
        ...currentAccounts,
        [normalizedEmail]: {
          ...currentAccount,
          ...updates,
          profile: normalizeProfile(updates.profile ?? currentAccount.profile),
          notifications: {
            ...DEFAULT_NOTIFICATIONS,
            ...(updates.notifications ?? currentAccount.notifications),
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const setProfile = useCallback<React.Dispatch<React.SetStateAction<ProfileType>>>(
    (nextProfile) => {
      setProfileState((currentProfile) => {
        const resolvedProfile = normalizeProfile(
          typeof nextProfile === "function" ? nextProfile(currentProfile) : nextProfile
        );
        const email = currentUser?.email?.trim().toLowerCase();

        if (email) {
          persistAccountUpdate(email, {
            profile: resolvedProfile,
          });
        }

        return resolvedProfile;
      });
    },
    [currentUser?.email, persistAccountUpdate]
  );

  const updateProfile = useCallback(
    (updates: Partial<ProfileType>) => {
      setProfile((current) =>
        normalizeProfile({
          ...current,
          ...updates,
          prs: {
            ...current.prs,
            ...(updates.prs ?? {}),
          },
          onboardingAnswers: {
            ...current.onboardingAnswers,
            ...(updates.onboardingAnswers ?? {}),
          },
        })
      );
    },
    [setProfile]
  );

  const applyAutomaticPr = useCallback(
    ({ distance, time }: { distance: string; time: string }) => {
      const miles = parseDistance(distance);
      const seconds = parseTimeToSeconds(time);

      if (!miles || !seconds || miles <= 0 || seconds <= 0) {
        return { matchedEvent: null, updated: false };
      }

      const matchedRule =
        PR_EVENT_RULES.find((rule) => Math.abs(miles - rule.miles) <= rule.tolerance) ?? null;

      if (!matchedRule) {
        return { matchedEvent: null, updated: false };
      }

      const existingPrValue = profile.prs[matchedRule.key];
      const existingSeconds = existingPrValue ? parseTimeToSeconds(existingPrValue) : null;

      if (existingSeconds !== null && existingSeconds <= seconds) {
        return {
          matchedEvent: matchedRule.key,
          updated: false,
          label: matchedRule.label,
          time: existingPrValue,
        };
      }

      const formattedPr = formatDuration(seconds);

      updateProfile({
        prs: {
          ...profile.prs,
          [matchedRule.key]: formattedPr,
        },
        ...(matchedRule.key === "5k" ? { pr5k: formattedPr } : {}),
      });

      return {
        matchedEvent: matchedRule.key,
        updated: true,
        label: matchedRule.label,
        time: formattedPr,
      };
    },
    [profile.prs, updateProfile]
  );

  const updateNotificationPreferences = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      setNotificationPreferences((current) => {
        const next = {
          ...current,
          ...updates,
        };
        const email = currentUser?.email?.trim().toLowerCase();

        if (email) {
          persistAccountUpdate(email, {
            notifications: next,
          });
        }

        return next;
      });
    },
    [currentUser?.email, persistAccountUpdate]
  );

  const signUp = useCallback(
    async ({
      name,
      email,
      password,
      accountType,
    }: {
      name?: string;
      email: string;
      password: string;
      accountType: AccountType;
    }): Promise<AuthResult> =>
      runExclusiveAuthAction(
        async () => {
          const normalizedEmail = email.trim().toLowerCase();
          const trimmedPassword = password.trim();

          if (!normalizedEmail || !trimmedPassword) {
            return {
              ok: false,
              error: "Email and password are required.",
            };
          }

          if (!normalizedEmail.includes("@")) {
            return {
              ok: false,
              error: "Enter a valid email address.",
            };
          }

          if (trimmedPassword.length < 6) {
            return {
              ok: false,
              error: "Password must be at least 6 characters.",
            };
          }

          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: trimmedPassword,
            options: {
              data: {
                name: formatDisplayName(name || "") || deriveNameFromEmail(normalizedEmail),
                account_type: normalizeAccountType(accountType),
              },
            },
          });

          if (error) {
            return {
              ok: false,
              error: getFriendlyAuthError(error.message),
            };
          }

          if (!data.user || !data.session) {
            return {
              ok: false,
              error: "Unable to create an active session. Confirm email signup is configured correctly in Supabase.",
            };
          }

          const syncedAccount = await syncUserState(data.user, {
            restored: false,
            statusMessage: "Welcome to NextStride. Let's build your personalized training plan.",
          });
          const normalizedSelectedAccountType = normalizeAccountType(accountType);
          const nextProfile = normalizeProfile({
            ...(syncedAccount?.profile ?? EMPTY_PROFILE),
            accountType: normalizedSelectedAccountType,
            onboardingComplete: normalizedSelectedAccountType === "solo_runner" ? false : syncedAccount?.profile.onboardingComplete,
            onboardingAnswers: {
              ...(syncedAccount?.profile.onboardingAnswers ?? EMPTY_ONBOARDING_ANSWERS),
              accountType: normalizedSelectedAccountType,
            },
          });

          if (data.user.email) {
            const normalizedSignedUpEmail = data.user.email.trim().toLowerCase();

            if (normalizedSelectedAccountType !== "solo_runner") {
              const shellReadyProfile = normalizeProfile({
                ...nextProfile,
                onboardingComplete: true,
              });

              try {
                await upsertProfileToSupabase(data.user, shellReadyProfile);
              } catch (error) {
                return {
                  ok: false,
                  error: `Unable to finish account setup: ${getErrorMessage(error)}`,
                };
              }

              setProfileState(shellReadyProfile);
              persistAccountUpdate(normalizedSignedUpEmail, {
                profile: shellReadyProfile,
              });
              setSessionStatusMessage(
                normalizedSelectedAccountType === "coach"
                  ? "Your coach dashboard is ready."
                  : "Your team runner dashboard is ready."
              );

              return {
                ok: true,
                nextStep: "app",
                appRoute: getAppRouteForAccountType(normalizedSelectedAccountType),
              };
            }

            try {
              await upsertProfileToSupabase(data.user, nextProfile);
            } catch (error) {
              return {
                ok: false,
                error: `Unable to finish account setup: ${getErrorMessage(error)}`,
              };
            }

            setProfileState(nextProfile);
            persistAccountUpdate(normalizedSignedUpEmail, {
              profile: nextProfile,
            });
          }

          return {
            ok: true,
            nextStep: getPostAuthNextStep(nextProfile),
            appRoute: getAppRouteForAccountType(normalizedSelectedAccountType),
          };
        },
        {
          ok: false,
          error: "Please wait for the current auth request to finish.",
        }
      ),
    [persistAccountUpdate, runExclusiveAuthAction, syncUserState, upsertProfileToSupabase]
  );

  const logIn = useCallback(
    async ({ email, password }: { email: string; password: string }): Promise<AuthResult> =>
      runExclusiveAuthAction(
        async () => {
          const normalizedEmail = email.trim().toLowerCase();
          const trimmedPassword = password.trim();

          if (!normalizedEmail || !trimmedPassword) {
            return {
              ok: false,
              error: "Email and password are required.",
            };
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: trimmedPassword,
          });

          if (error) {
            return {
              ok: false,
              error: getFriendlyAuthError(error.message),
            };
          }

          if (!data.user) {
            return {
              ok: false,
              error: "Unable to log in.",
            };
          }

          const syncedAccount = await syncUserState(data.user, {
            restored: false,
            statusMessage: "Welcome back. Your account is ready.",
          });

          return {
            ok: true,
            nextStep: getPostAuthNextStep(syncedAccount?.profile),
            appRoute: getAppRouteForAccountType(syncedAccount?.profile.accountType),
          };
        },
        {
          ok: false,
          error: "Please wait for the current auth request to finish.",
        }
      ),
    [runExclusiveAuthAction, syncUserState]
  );

  const completeOnboarding = useCallback(
    async (answers: OnboardingSurveyAnswers): Promise<OnboardingResult> =>
      runExclusiveAuthAction(
        async () => {
          if (!currentUser?.email) {
            return {
              ok: false,
              error: "Sign in before completing onboarding.",
            };
          }

          const accountType = normalizeAccountType(answers.accountType || profile.accountType);
          const isSoloRunner = accountType === "solo_runner";
          const recentResultTime = answers.recentResultTime.trim();
          const recentPrKey = mapRaceDistanceToPrKey(answers.recentResultDistance);
          const equivalent5k = isSoloRunner ? estimateEquivalent5k(answers.recentResultDistance, recentResultTime) : "";
          const nextPrs = {
            ...profile.prs,
            ...(isSoloRunner && recentPrKey && recentResultTime ? { [recentPrKey]: recentResultTime } : {}),
          };
          const nextProfile = normalizeProfile({
            ...profile,
            name: profile.name || deriveNameFromEmail(currentUser.email),
            mileage: isSoloRunner ? mileageFromSurvey(answers.weeklyMileageRange) : profile.mileage,
            goalEvent: isSoloRunner
              ? goalEventFromGoalDistance(answers.goalRaceDistance) || goalEventFromSurvey(answers.mainGoal)
              : profile.goalEvent,
            pr5k: equivalent5k || profile.pr5k,
            prs: nextPrs,
            raceGoals: isSoloRunner ? buildRaceGoalsFromAnswers(answers, profile.raceGoals) : profile.raceGoals,
            accountType,
            onboardingComplete: true,
            runnerLevel: isSoloRunner ? classifyRunner(answers) : profile.runnerLevel,
            onboardingAnswers: {
              ...answers,
              accountType,
            },
            preferredTrainingDays: isSoloRunner ? answers.preferredTrainingDays || 4 : profile.preferredTrainingDays || 4,
          });

          try {
            await upsertProfileToSupabase(currentUser, nextProfile);
          } catch (error) {
            return {
              ok: false,
              error: `Unable to save onboarding to Supabase: ${getErrorMessage(error)}`,
            };
          }

          const normalizedEmail = currentUser.email.trim().toLowerCase();

          setProfileState(nextProfile);
          persistAccountUpdate(normalizedEmail, {
            profile: nextProfile,
          });
          setSessionStatusMessage(
            accountType === "solo_runner"
              ? "Your personalized training plan is ready."
              : accountType === "coach"
                ? "Your coach dashboard is ready."
                : "Your team runner dashboard is ready."
          );

          return { ok: true };
        },
        {
          ok: false,
          error: "Please wait for the current auth request to finish.",
        }
      ),
    [currentUser, persistAccountUpdate, profile, runExclusiveAuthAction, upsertProfileToSupabase]
  );

  const signOut = useCallback(() => {
    setCurrentUser(null);
    setProfileState(EMPTY_PROFILE);
    setNotificationPreferences(DEFAULT_NOTIFICATIONS);
    setSessionRestored(false);
    setSessionStatusMessage("");
    void supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      updateProfile,
      applyAutomaticPr,
      notificationPreferences,
      updateNotificationPreferences,
      account,
      displayName: formatDisplayName(profile.name) || deriveNameFromEmail(account?.email || ""),
      isAuthenticated: Boolean(currentUser),
      authReady,
      requiresOnboarding: Boolean(currentUser && shouldRequireOnboarding(profile)),
      sessionRestored,
      sessionStatusMessage,
      appHomeRoute,
      resolvedMaxHeartRate,
      heartRateZones,
      signUp,
      logIn,
      completeOnboarding,
      signOut,
    }),
    [
      account,
      applyAutomaticPr,
      authReady,
      completeOnboarding,
      currentUser,
      heartRateZones,
      logIn,
      notificationPreferences,
      profile,
      appHomeRoute,
      resolvedMaxHeartRate,
      sessionRestored,
      sessionStatusMessage,
      setProfile,
      signOut,
      signUp,
      updateNotificationPreferences,
      updateProfile,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }

  return context;
};

function buildHeartRateZones(maxHeartRate: number): HeartRateZone[] {
  const definitions = [
    { name: "Zone 1", label: "50-60%", minPercent: 0.5, maxPercent: 0.6 },
    { name: "Zone 2", label: "60-70%", minPercent: 0.6, maxPercent: 0.7 },
    { name: "Zone 3", label: "70-80%", minPercent: 0.7, maxPercent: 0.8 },
    { name: "Zone 4", label: "80-90%", minPercent: 0.8, maxPercent: 0.9 },
    { name: "Zone 5", label: "90-100%", minPercent: 0.9, maxPercent: 1 },
  ];

  return definitions.map((zone) => ({
    name: zone.name,
    label: zone.label,
    min: Math.round(maxHeartRate * zone.minPercent),
    max: Math.round(maxHeartRate * zone.maxPercent),
  }));
}
