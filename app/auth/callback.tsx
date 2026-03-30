import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

function getHashParams() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return new URLSearchParams();
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;

  return new URLSearchParams(hash);
}

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error_description?: string;
  }>();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        if (typeof params.error_description === "string" && params.error_description) {
          throw new Error(params.error_description);
        }

        const hashParams = getHashParams();
        const code = typeof params.code === "string" ? params.code : undefined;
        const tokenHash =
          typeof params.token_hash === "string"
            ? params.token_hash
            : hashParams.get("token_hash") || undefined;
        const type =
          typeof params.type === "string" ? params.type : hashParams.get("type") || undefined;
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });

          if (verifyError) {
            throw verifyError;
          }
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }
        } else {
          throw new Error("This verification link is missing the required auth details.");
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.email_confirmed_at) {
          throw new Error("Your email is not confirmed yet. Try the newest verification email.");
        }

        await supabase.auth.signOut();

        if (!cancelled) {
          router.replace("/login?verified=1");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to verify this email.");
        }
      }
    };

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [params.code, params.error_description, params.token_hash, params.type]);

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
        {error ? "Verification failed" : "Verifying your email"}
      </Text>
      <Text
        style={{
          color: error ? "#fca5a5" : "#9db2ca",
          fontSize: 14,
          lineHeight: 22,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        {error || "Finishing your confirmation and sending you back to login."}
      </Text>
    </View>
  );
}
