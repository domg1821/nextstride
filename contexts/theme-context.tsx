import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/contexts/profile-context";

export type ThemeType = "light" | "dark";

export type ThemeColors = {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  subtext: string;
  primary: string;
  primarySoft: string;
  border: string;
  success: string;
  danger: string;
};

const themes: Record<ThemeType, ThemeColors> = {
  light: {
    background: "#f6f8fc",
    card: "#ffffff",
    cardAlt: "#eef3fb",
    text: "#0d1726",
    subtext: "#5b6b80",
    primary: "#2274f3",
    primarySoft: "#dceaff",
    border: "#d9e3f1",
    success: "#16a34a",
    danger: "#dc2626",
  },
  dark: {
    background: "#06101a",
    card: "#0c1828",
    cardAlt: "#112133",
    text: "#f5f9ff",
    subtext: "#b8c7da",
    primary: "#69bcff",
    primarySoft: "#183758",
    border: "#233952",
    success: "#22c55e",
    danger: "#f87171",
  },
};

type ThemeContextType = {
  mode: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeType) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { authReady, isAuthenticated, themePreference, updateThemePreference } = useProfile();
  const [mode, setMode] = useState<ThemeType>("dark");

  useEffect(() => {
    if (!authReady) {
      return;
    }

    setMode(themePreference);
  }, [authReady, themePreference]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(themes[mode].background).catch(() => {
      // Keep the app usable even if the platform ignores background updates.
    });
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      colors: themes[mode],
      setMode: (nextMode: ThemeType) => {
        setMode(nextMode);

        if (authReady && isAuthenticated) {
          updateThemePreference(nextMode);
        }
      },
      toggleTheme: () => {
        setMode((prev) => {
          const nextMode = prev === "dark" ? "light" : "dark";

          if (authReady && isAuthenticated) {
            updateThemePreference(nextMode);
          }

          return nextMode;
        });
      },
    }),
    [authReady, isAuthenticated, mode, updateThemePreference]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeColors = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeColors must be used inside ThemeProvider");
  }

  return context;
};
