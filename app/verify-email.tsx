import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";

export default function VerifyEmail() {
  const {
    authReady,
    isAuthenticated,
    requiresEmailVerification,
    verificationEmail,
    sessionStatusMessage,
    completeEmailVerification,
    resendEmailVerification,
    signOut,
  } = useProfile();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (isAuthenticated && !requiresEmailVerification) {
      router.replace("/(tabs)");
    }
  }, [authReady, isAuthenticated, requiresEmailVerification]);

  const handleVerified = async () => {
    setError("");
    setSuccess("");
    setRefreshing(true);

    try {
      const result = await completeEmailVerification();

      if (!result.ok) {
        setError(result.error || "We couldn't confirm your verification yet.");
        return;
      }

      setSuccess(result.message || "Email verified. You can log in now.");
      router.replace("/login?verified=1");
    } finally {
      setRefreshing(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const result = await resendEmailVerification();

      if (!result.ok) {
        setError(result.error || "Unable to resend the verification email.");
        return;
      }

      setSuccess(result.message || "Verification email sent.");
    } finally {
      setResending(false);
    }
  };

  const hasVerificationTarget = Boolean(verificationEmail);

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
          VERIFY EMAIL
        </Text>
        <Text style={{ color: "#f8fbff", fontSize: 32, fontWeight: "800", marginTop: 12 }}>
          Check your inbox before logging in
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 23, marginTop: 12 }}>
          {hasVerificationTarget
            ? `We sent a verification email to ${verificationEmail}. Open that link, then come back and log in once your email is confirmed.`
            : "Create an account first so we know where to send your verification email."}
        </Text>

        <View
          style={{
            backgroundColor: "#132339",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#22344b",
            padding: 16,
            marginTop: 18,
          }}
        >
          <Text style={{ color: "#dbeafe", fontSize: 13, fontWeight: "700" }}>What happens next</Text>
          <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20, marginTop: 8 }}>
            1. Open the verification email.
          </Text>
          <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20, marginTop: 4 }}>
            2. Tap the confirmation link.
          </Text>
          <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 20, marginTop: 4 }}>
            3. You&apos;ll return to NextStride, then you can log in.
          </Text>
          {!!sessionStatusMessage ? (
            <Text style={{ color: "#93c5fd", fontSize: 13, lineHeight: 20, marginTop: 10 }}>
              {sessionStatusMessage}
            </Text>
          ) : null}
        </View>

        {!!error ? (
          <Text style={{ color: "#f87171", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {error}
          </Text>
        ) : null}

        {!!success ? (
          <Text style={{ color: "#4ade80", marginTop: 14, fontSize: 14, fontWeight: "600" }}>
            {success}
          </Text>
        ) : null}

        <Pressable
          onPress={handleResend}
          style={{
            backgroundColor: hasVerificationTarget ? "#2563eb" : "#132339",
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: "center",
            marginTop: 18,
            opacity: resending || !hasVerificationTarget ? 0.7 : 1,
          }}
          disabled={resending || !hasVerificationTarget}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            {resending ? "Sending..." : "Resend Verification Email"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleVerified}
          style={{
            backgroundColor: "#132339",
            paddingVertical: 15,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#22344b",
            alignItems: "center",
            marginTop: 12,
            opacity: refreshing ? 0.7 : 1,
          }}
          disabled={refreshing}
        >
          <Text style={{ color: "#dbeafe", fontSize: 15, fontWeight: "700" }}>
            {refreshing ? "Checking..." : "I've Verified My Email"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/login")}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: "#9db2ca", textAlign: "center", fontSize: 14, fontWeight: "600" }}>
            Back to login
          </Text>
        </Pressable>

        {isAuthenticated ? (
          <Pressable
            onPress={() => {
              signOut();
              router.replace("/login");
            }}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: "#9db2ca", textAlign: "center", fontSize: 14, fontWeight: "600" }}>
              Sign out and use a different account
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
