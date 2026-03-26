import React, { createContext, useContext, useMemo, useState } from "react";

export type ProfileType = {
  name: string;
  mileage: string;
  goalEvent: string;
  pr5k: string;
  image?: string;
};

type AuthAccount = {
  name: string;
  email: string;
  password: string;
};

type ProfileContextType = {
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
  updateProfile: (updates: Partial<ProfileType>) => void;
  account: AuthAccount | null;
  displayName: string;
  signUp: (input: {
    name?: string;
    email: string;
    password: string;
  }) => { ok: boolean; error?: string };
  logIn: (input: { email: string; password: string }) => {
    ok: boolean;
    error?: string;
  };
};

const ProfileContext = createContext<ProfileContextType | null>(null);

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
  const [profile, setProfile] = useState<ProfileType>({
    name: "",
    mileage: "",
    goalEvent: "",
    pr5k: "",
  });
  const [account, setAccount] = useState<AuthAccount | null>(null);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      updateProfile: (updates: Partial<ProfileType>) => {
        setProfile((current) => ({
          ...current,
          ...updates,
        }));
      },
      account,
      displayName:
        formatDisplayName(profile.name) ||
        formatDisplayName(account?.name || "") ||
        deriveNameFromEmail(account?.email || ""),
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

        setAccount({
          name: resolvedName,
          email: normalizedEmail,
          password: trimmedPassword,
        });
        setProfile((current) => ({
          ...current,
          name: current.name.trim() || resolvedName,
        }));

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

        if (!account) {
          return {
            ok: false,
            error: "No account found. Create an account first.",
          };
        }

        if (account.email !== normalizedEmail || account.password !== trimmedPassword) {
          return {
            ok: false,
            error: "Incorrect email or password.",
          };
        }

        setProfile((current) => ({
          ...current,
          name: current.name.trim() || account.name,
        }));

        return { ok: true };
      },
    }),
    [account, profile]
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
