import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";

export default function SignUp() {
  const { signUp } = useProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (loading) {
      return;
    }

    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const result = await signUp({
        name,
        email,
        password,
      });

      if (!result.ok) {
        setError(result.error || "Unable to create account.");
        return;
      }

      router.replace(result.nextStep === "onboarding" ? "/onboarding" : "/(tabs)");
    } catch {
      setError("Unable to create account.");
    } finally {
      setLoading(false);
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
        <Text
          style={{
            color: "#7dd3fc",
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.2,
          }}
        >
          NEXTSTRIDE ACCOUNT
        </Text>

        <Text
          style={{
            color: "#f8fbff",
            fontSize: 32,
            fontWeight: "800",
            marginTop: 12,
          }}
        >
          Create account
        </Text>

        <Text
          style={{
            color: "#9db2ca",
            fontSize: 15,
            lineHeight: 23,
            marginTop: 10,
          }}
        >
          Create your account to start training right away.
        </Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
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
            marginTop: 14,
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
          <Text
            style={{
              color: "#f87171",
              marginTop: 14,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleCreateAccount}
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
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/login")}
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
          <Text
            style={{
              color: "#dbeafe",
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Already have an account? Log in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
