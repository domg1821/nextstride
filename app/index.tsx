import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";

export default function Index() {
  const { authReady, isAuthenticated, profile, sessionRestored, sessionStatusMessage, appHomeRoute } = useProfile();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const targetRoute = isAuthenticated
      ? profile.accountType === "solo_runner" && !profile.onboardingComplete
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
  }, [appHomeRoute, authReady, isAuthenticated, profile.accountType, profile.onboardingComplete, sessionRestored]);

  if (!authReady || (isAuthenticated && sessionRestored)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#08111d",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800", marginTop: 18 }}>
          {authReady ? "Session restored" : "Opening NextStride"}
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8, textAlign: "center" }}>
          {authReady
            ? sessionStatusMessage || "Jumping back into your saved account."
            : "Restoring your account, training profile, and recent session state."}
        </Text>
      </View>
    );
  }

  return null;
}
