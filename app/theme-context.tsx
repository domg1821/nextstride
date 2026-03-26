import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
    background: "#f4f7fb",
    card: "#ffffff",
    cardAlt: "#eef4ff",
    text: "#0f172a",
    subtext: "#52627a",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    border: "#d7e3f4",
    success: "#16a34a",
    danger: "#dc2626",
  },
  dark: {
    background: "#09111f",
    card: "#111c31",
    cardAlt: "#16243d",
    text: "#f8fafc",
    subtext: "#94a3b8",
    primary: "#60a5fa",
    primarySoft: "#1d4ed8",
    border: "#22314a",
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
  const [mode, setMode] = useState<ThemeType>("dark");

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
      setMode,
      toggleTheme: () => {
        setMode((prev) => (prev === "dark" ? "light" : "dark"));
      },
    }),
    [mode]
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
