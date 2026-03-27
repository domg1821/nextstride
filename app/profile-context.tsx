import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { formatDuration, parseDistance, parseTimeToSeconds } from "./workout-utils";

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

export type ProfileType = {
  name: string;
  mileage: string;
  goalEvent: string;
  pr5k: string;
  prs: PRsType;
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

type AuthAccount = {
  email: string;
  password: string;
  profile: ProfileType;
  notifications: NotificationPreferences;
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
  account: AuthAccount | null;
  displayName: string;
  isAuthenticated: boolean;
  resolvedMaxHeartRate: number | null;
  heartRateZones: HeartRateZone[];
  signUp: (input: {
    name?: string;
    email: string;
    password: string;
  }) => { ok: boolean; error?: string };
  logIn: (input: { email: string; password: string }) => {
    ok: boolean;
    error?: string;
  };
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

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [accountsByEmail, setAccountsByEmail] = useState<Record<string, AuthAccount>>({});
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [profile, setProfileState] = useState<ProfileType>(EMPTY_PROFILE);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);

  const account = currentEmail ? accountsByEmail[currentEmail] ?? null : null;
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

  const setProfile = useCallback<React.Dispatch<React.SetStateAction<ProfileType>>>(
    (nextProfile) => {
      setProfileState((currentProfile) => {
        const resolvedProfile = normalizeProfile(
          typeof nextProfile === "function" ? nextProfile(currentProfile) : nextProfile
        );

        if (currentEmail) {
          setAccountsByEmail((currentAccounts) => {
            const currentAccount = currentAccounts[currentEmail];

            if (!currentAccount) {
              return currentAccounts;
            }

            return {
              ...currentAccounts,
              [currentEmail]: {
                ...currentAccount,
                profile: resolvedProfile,
              },
            };
          });
        }

        return resolvedProfile;
      });
    },
    [currentEmail]
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

        if (currentEmail) {
          setAccountsByEmail((currentAccounts) => {
            const currentAccount = currentAccounts[currentEmail];

            if (!currentAccount) {
              return currentAccounts;
            }

            return {
              ...currentAccounts,
              [currentEmail]: {
                ...currentAccount,
                notifications: next,
              },
            };
          });
        }

        return next;
      });
    },
    [currentEmail]
  );

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
      isAuthenticated: Boolean(account),
      resolvedMaxHeartRate,
      heartRateZones,
      signUp: ({
        name,
        email,
        password,
      }: {
        name?: string;
        email: string;
        password: string;
      }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        const resolvedName = formatDisplayName(name || "") || deriveNameFromEmail(normalizedEmail);

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

        if (accountsByEmail[normalizedEmail]) {
          return {
            ok: false,
            error: "An account with that email already exists.",
          };
        }

        const nextProfile = normalizeProfile({
          ...EMPTY_PROFILE,
          name: resolvedName,
        });

        setAccountsByEmail((currentAccounts) => ({
          ...currentAccounts,
          [normalizedEmail]: {
            email: normalizedEmail,
            password: trimmedPassword,
            profile: nextProfile,
            notifications: DEFAULT_NOTIFICATIONS,
          },
        }));
        setCurrentEmail(normalizedEmail);
        setProfileState(nextProfile);
        setNotificationPreferences(DEFAULT_NOTIFICATIONS);

        return { ok: true };
      },
      logIn: ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        if (!normalizedEmail || !trimmedPassword) {
          return {
            ok: false,
            error: "Email and password are required.",
          };
        }

        const matchedAccount = accountsByEmail[normalizedEmail];

        if (!matchedAccount) {
          return {
            ok: false,
            error: "No account found for that email.",
          };
        }

        if (matchedAccount.password !== trimmedPassword) {
          return {
            ok: false,
            error: "Incorrect password.",
          };
        }

        setCurrentEmail(normalizedEmail);
        setProfileState(normalizeProfile(matchedAccount.profile));
        setNotificationPreferences(matchedAccount.notifications ?? DEFAULT_NOTIFICATIONS);

        return { ok: true };
      },
      signOut: () => {
        setCurrentEmail(null);
        setProfileState(EMPTY_PROFILE);
        setNotificationPreferences(DEFAULT_NOTIFICATIONS);
      },
    }),
    [
      account,
      accountsByEmail,
      heartRateZones,
      notificationPreferences,
      profile,
      resolvedMaxHeartRate,
      setProfile,
      updateNotificationPreferences,
      updateProfile,
      applyAutomaticPr,
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
