import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { useProfile } from "@/contexts/profile-context";
import { getInitialRecoveryUrl, recoverSessionFromUrl } from "@/lib/auth-recovery";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const { updatePassword } = useProfile();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"verifying" | "ready" | "done">("verifying");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Verifying your password reset link...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveRecovery = async (incomingUrl?: string | null) => {
      setError("");
      setMessage("Verifying your password reset link...");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (mounted) {
          setStatus("ready");
          setMessage("Your reset link is confirmed. Enter a new password.");
        }
        return;
      }

      const url = incomingUrl ?? (await getInitialRecoveryUrl());
      const result = await recoverSessionFromUrl(url);

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setError(result.error || "Unable to verify this password reset link.");
        setMessage("");
        return;
      }

      setStatus("ready");
      setMessage("Your reset link is confirmed. Enter a new password.");
    };

    void resolveRecovery();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void resolveRecovery(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (loading || status !== "ready") {
      return;
    }

    setError("");

    if (!password.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (!result.ok) {
        setError(result.error || "Unable to update password.");
        return;
      }

      setStatus("done");
      setMessage(result.message || "Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
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
        <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>
          ACCOUNT RECOVERY
        </Text>
        <Text style={{ color: "#f8fbff", fontSize: 30, fontWeight: "800", marginTop: 12 }}>
          Choose a new password
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 23, marginTop: 10 }}>
          {message}
        </Text>

        {status !== "done" ? (
          <>
            <TextInput
              placeholder="New password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
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
              editable={status === "ready"}
            />

            <TextInput
              placeholder="Confirm new password"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
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
              editable={status === "ready"}
            />
          </>
        ) : null}

        {!!error ? (
          <Text style={{ color: "#f87171", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {error}
          </Text>
        ) : null}

        {status !== "done" ? (
          <Pressable
            onPress={handleUpdatePassword}
            style={{
              backgroundColor: "#2563eb",
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: "center",
              marginTop: 18,
              opacity: loading || status !== "ready" ? 0.7 : 1,
            }}
            disabled={loading || status !== "ready"}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
              {loading ? "Updating..." : "Update Password"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.replace("/login")}
            style={{
              backgroundColor: "#2563eb",
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
              Back to Login
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
