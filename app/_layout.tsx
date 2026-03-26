import { Stack } from "expo-router";
import { ProfileProvider } from "./profile-context";
import { ThemeProvider } from "./theme-context";
import { WorkoutProvider } from "./workout-context";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <WorkoutProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </WorkoutProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}