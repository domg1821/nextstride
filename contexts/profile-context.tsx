import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { readStoredJson, writeStoredJson } from "@/utils/local-storage";
import { formatDuration, parseDistance, parseTimeToSeconds } from "@/utils/workout-utils";

const AUTH_ACCOUNTS_STORAGE_KEY = "nextstride.auth.accounts.v2";

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
  nextStep?: "app";
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
  sessionRestored: boolean;
  sessionStatusMessage: string;
  resolvedMaxHeartRate: number | null;
  heartRateZones: HeartRateZone[];
  signUp: (input: { name?: string; email: string; password: string }) => Promise<AuthResult>;
  logIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => void;
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
};

function normalizeProfile(profile: ProfileType): ProfileType {
  const prs = {
    ...EMPTY_PRS,
    ...profile.prs,
  };
  const pr5k = profile.pr5k || prs["5k"] || "";

  return {
    ...EMPTY_PROFILE,
    ...profile,
    pr5k,
    prs: {
      ...prs,
      "5k": pr5k,
    },
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

function buildStoredAccount(email: string, user?: User | null, existing?: StoredAccount | null): StoredAccount {
  const normalizedEmail = email.trim().toLowerCase();
  const fallbackName =
    formatDisplayName((user?.user_metadata?.name as string | undefined) || "") ||
    existing?.profile.name ||
    deriveNameFromEmail(normalizedEmail);
  const now = new Date().toISOString();

  return {
    email: normalizedEmail,
    profile: normalizeProfile({
      ...EMPTY_PROFILE,
      ...existing?.profile,
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

  useEffect(() => {
    accountsByEmailRef.current = accountsByEmail;
  }, [accountsByEmail]);

  const syncUserState = useCallback((user: User | null, options?: { restored?: boolean; statusMessage?: string }) => {
    setCurrentUser(user);
    setSessionRestored(Boolean(options?.restored && user));

    if (!user) {
      setProfileState(EMPTY_PROFILE);
      setNotificationPreferences(DEFAULT_NOTIFICATIONS);
      setSessionStatusMessage(options?.statusMessage ?? "");
      return;
    }

    const email = user.email?.trim().toLowerCase();

    if (!email) {
      setProfileState(EMPTY_PROFILE);
      setNotificationPreferences(DEFAULT_NOTIFICATIONS);
      setSessionStatusMessage(options?.statusMessage ?? "");
      return;
    }

    const storedAccount = buildStoredAccount(email, user, accountsByEmailRef.current[email]);

    setAccountsByEmail((currentAccounts) => ({
      ...currentAccounts,
      [email]: storedAccount,
    }));
    setProfileState(storedAccount.profile);
    setNotificationPreferences(storedAccount.notifications);
    setSessionStatusMessage(
      options?.statusMessage ?? `Welcome back, ${storedAccount.profile.name || "Runner"}.`
    );
  }, []);

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
        const email = session.user.email?.trim().toLowerCase() || "";
        const storedAccount = buildStoredAccount(email, session.user, normalizedAccounts[email]);

        setAccountsByEmail((currentAccounts) => ({
          ...currentAccounts,
          [email]: storedAccount,
        }));
        setCurrentUser(session.user);
        setProfileState(storedAccount.profile);
        setNotificationPreferences(storedAccount.notifications);
        setSessionRestored(true);
        setSessionStatusMessage(`Session restored for ${email}.`);
      } else {
        setCurrentUser(null);
        setProfileState(EMPTY_PROFILE);
        setNotificationPreferences(DEFAULT_NOTIFICATIONS);
        setSessionRestored(false);
        setSessionStatusMessage("");
      }

      setAuthReady(true);
    };

    void hydrateAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      syncUserState(session?.user ?? null, {
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
    }: {
      name?: string;
      email: string;
      password: string;
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
              },
            },
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
              error: "Unable to create account.",
            };
          }

          if (!data.session) {
            return {
              ok: false,
              error: "Signup succeeded, but no session was returned. Disable email confirmation in Supabase Auth settings for immediate login.",
            };
          }

          syncUserState(data.user, {
            restored: false,
            statusMessage: "Welcome to NextStride. Your account is ready.",
          });

          return {
            ok: true,
            nextStep: "app",
          };
        },
        {
          ok: false,
          error: "Please wait for the current auth request to finish.",
        }
      ),
    [runExclusiveAuthAction, syncUserState]
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

          syncUserState(data.user, {
            restored: false,
            statusMessage: "Welcome back. Your account is ready.",
          });

          return {
            ok: true,
            nextStep: "app",
          };
        },
        {
          ok: false,
          error: "Please wait for the current auth request to finish.",
        }
      ),
    [runExclusiveAuthAction, syncUserState]
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
      sessionRestored,
      sessionStatusMessage,
      resolvedMaxHeartRate,
      heartRateZones,
      signUp,
      logIn,
      signOut,
    }),
    [
      account,
      applyAutomaticPr,
      authReady,
      currentUser,
      heartRateZones,
      logIn,
      notificationPreferences,
      profile,
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
