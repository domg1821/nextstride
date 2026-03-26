import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useProfile } from "./profile-context";

export default function Login() {
  const { logIn, isAuthenticated } = useProfile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogIn = () => {
    const result = logIn({ email, password });

    if (!result.ok) {
      setError(result.error || "Unable to log in.");
      return;
    }

    setError("");
    router.replace("/(tabs)");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0f172a",
        padding: 24,
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
        Log In
      </Text>

      <Text style={{ color: "#94a3b8", marginTop: 8, marginBottom: 24 }}>
        Welcome back to NextStride
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 14,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 20,
        }}
      />

      {!!error && (
        <Text style={{ color: "#f87171", marginTop: -6, marginBottom: 18, fontSize: 14 }}>
          {error}
        </Text>
      )}

      <Pressable
        onPress={handleLogIn}
        style={{
          backgroundColor: "#2563eb",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Log In
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signup")} style={{ marginTop: 18 }}>
        <Text style={{ color: "#93c5fd", textAlign: "center", fontSize: 15, fontWeight: "600" }}>
          Need an account? Create one
        </Text>
      </Pressable>

      {isAuthenticated ? (
        <Pressable onPress={() => router.replace("/(tabs)")} style={{ marginTop: 12 }}>
          <Text style={{ color: "#cbd5e1", textAlign: "center", fontSize: 14 }}>
            Continue to the app
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
