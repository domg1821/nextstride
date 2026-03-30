import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";

export default function Login() {
  const { logIn, isAuthenticated, profile, sessionStatusMessage, appHomeRoute } = useProfile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogIn = async () => {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);
    let nextRoute: "/(tabs)" | "/coach-app" | "/team-app" | "/onboarding" | null = null;

    try {
      const result = await logIn({ email, password });

      if (!result.ok) {
        setError(result.error || "Unable to log in.");
        return;
      }

      setError("");
      nextRoute = result.nextStep === "onboarding" ? "/onboarding" : result.appRoute || appHomeRoute;
    } finally {
      setLoading(false);

      if (nextRoute) {
        router.replace(nextRoute);
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#08111d",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "#0f1b2d",
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "#22344b",
          padding: 24,
        }}
      >
        <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>
          NEXTSTRIDE ACCOUNT
        </Text>
        <Text style={{ color: "#f8fbff", fontSize: 32, fontWeight: "800", marginTop: 12 }}>
          Log in
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 23, marginTop: 10 }}>
          Welcome back. Your account, training profile, and session memory now stay tied together.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: "#122033",
            color: "#f8fbff",
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderRadius: 18,
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#22344b",
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: "#122033",
            color: "#f8fbff",
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderRadius: 18,
            marginTop: 14,
            borderWidth: 1,
            borderColor: "#22344b",
          }}
        />

        {!!error ? (
          <Text style={{ color: "#f87171", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {error}
          </Text>
        ) : null}

        {!error && !!sessionStatusMessage ? (
          <Text style={{ color: "#93c5fd", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {sessionStatusMessage}
          </Text>
        ) : null}

        <Pressable
          onPress={handleLogIn}
          style={{
            backgroundColor: "#2563eb",
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: "center",
            marginTop: 18,
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            {loading ? "Logging In..." : "Log In"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/signup")}
          style={{
            backgroundColor: "#132339",
            paddingVertical: 15,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#22344b",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Text style={{ color: "#dbeafe", fontSize: 15, fontWeight: "700" }}>
            Need an account? Create one
          </Text>
        </Pressable>

        {isAuthenticated ? (
          <Pressable
            onPress={() =>
              router.replace(profile.accountType === "solo_runner" && !profile.onboardingComplete ? "/onboarding" : appHomeRoute)
            }
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: "#9db2ca", textAlign: "center", fontSize: 14, fontWeight: "600" }}>
              Continue with remembered account
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
