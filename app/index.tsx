import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";
import { ThemeTokens } from "@/constants/theme";

export default function Index() {
  const { authReady, isAuthenticated, profile, sessionRestored, sessionStatusMessage, appHomeRoute } = useProfile();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const targetRoute = isAuthenticated
      ? !profile.onboardingComplete
        ? "/onboarding"
        : appHomeRoute
      : "/welcome";
    const timeout = setTimeout(
      () => {
        router.replace(targetRoute as never);
      },
      isAuthenticated && sessionRestored ? 450 : 0
    );

    return () => clearTimeout(timeout);
  }, [appHomeRoute, authReady, isAuthenticated, profile.onboardingComplete, sessionRestored]);

  if (!authReady || (isAuthenticated && sessionRestored)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: ThemeTokens.palette.textPrimary,
          alignItems: "center",
          justifyContent: "center",
          padding: ThemeTokens.spacing.l,
        }}
      >
        <ActivityIndicator size="large" color={ThemeTokens.palette.secondary} />
        <Text style={{ color: ThemeTokens.palette.surface, fontSize: 22, fontWeight: "800", marginTop: ThemeTokens.spacing.m }}>
          {authReady ? "Session restored" : "Opening NextStride"}
        </Text>
        <Text style={{ color: ThemeTokens.palette.textMuted, fontSize: 14, lineHeight: 22, marginTop: ThemeTokens.spacing.s, textAlign: "center" }}>
          {authReady
            ? sessionStatusMessage || "Jumping back into your saved account."
            : "Restoring your account, training profile, and recent session state."}
        </Text>
      </View>
    );
  }

  return null;
}
