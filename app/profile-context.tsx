import React, { createContext, useContext, useMemo, useState } from "react";

export type ProfileType = {
  name: string;
  mileage: string;
  goalEvent: string;
  pr5k: string;
  image?: string;
};

type ProfileContextType = {
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
  updateProfile: (updates: Partial<ProfileType>) => void;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

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
    }),
    [profile]
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
