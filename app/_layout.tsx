import { Stack } from "expo-router";
import { EngineProvider } from "@/contexts/engine-context";
import { PremiumProvider } from "@/contexts/premium-context";
import { ProfileProvider } from "@/contexts/profile-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { WorkoutProvider } from "@/contexts/workout-context";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <PremiumProvider>
          <WorkoutProvider>
            <EngineProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </EngineProvider>
          </WorkoutProvider>
        </PremiumProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
