import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";

export default function ForgotPassword() {
  const { requestPasswordReset } = useProfile();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (loading) {
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (!result.ok) {
        setError(result.error || "Unable to send password reset email.");
        return;
      }

      setMessage(result.message || "Password reset email sent.");
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
        <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: "#93c5fd", fontSize: 14, fontWeight: "700" }}>Back</Text>
        </Pressable>

        <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 14 }}>
          ACCOUNT RECOVERY
        </Text>
        <Text style={{ color: "#f8fbff", fontSize: 30, fontWeight: "800", marginTop: 12 }}>
          Reset your password
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 23, marginTop: 10 }}>
          Enter the email for your NextStride account and we&apos;ll send a secure reset link.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
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

        {!!error ? (
          <Text style={{ color: "#f87171", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {error}
          </Text>
        ) : null}

        {!error && !!message ? (
          <Text style={{ color: "#93c5fd", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {message}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSendReset}
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
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
