import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ProfileType = {
  name: string;
  mileage: string;
  goalEvent: string;
  pr5k: string;
  age: string;
  restingHeartRate: string;
  maxHeartRate: string;
  image?: string;
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
};

type ProfileContextType = {
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
  updateProfile: (updates: Partial<ProfileType>) => void;
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

const EMPTY_PROFILE: ProfileType = {
  name: "",
  mileage: "",
  goalEvent: "",
  pr5k: "",
  age: "",
  restingHeartRate: "",
  maxHeartRate: "",
};

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
        const resolvedProfile =
          typeof nextProfile === "function" ? nextProfile(currentProfile) : nextProfile;

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
      setProfile((current) => ({
        ...current,
        ...updates,
      }));
    },
    [setProfile]
  );

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      updateProfile,
      account,
      displayName:
        formatDisplayName(profile.name) ||
        deriveNameFromEmail(account?.email || ""),
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

        const nextProfile: ProfileType = {
          ...EMPTY_PROFILE,
          name: resolvedName,
        };

        setAccountsByEmail((currentAccounts) => ({
          ...currentAccounts,
          [normalizedEmail]: {
            email: normalizedEmail,
            password: trimmedPassword,
            profile: nextProfile,
          },
        }));
        setCurrentEmail(normalizedEmail);
        setProfileState(nextProfile);

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
        setProfileState(matchedAccount.profile);

        return { ok: true };
      },
      signOut: () => {
        setCurrentEmail(null);
        setProfileState(EMPTY_PROFILE);
      },
    }),
    [
      account,
      accountsByEmail,
      heartRateZones,
      profile,
      resolvedMaxHeartRate,
      setProfile,
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
