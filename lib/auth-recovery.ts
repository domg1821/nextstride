import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

function mergeUrlParams(url: string) {
  const parsedUrl = new URL(url);
  const merged = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.startsWith("#") ? parsedUrl.hash.slice(1) : parsedUrl.hash);

  hashParams.forEach((value, key) => {
    merged.set(key, value);
  });

  return merged;
}

export async function recoverSessionFromUrl(url: string | null | undefined) {
  if (!url) {
    return { ok: false, error: "Missing recovery link." as string };
  }

  const params = mergeUrlParams(url);
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  return { ok: false, error: "This recovery link is missing the required auth tokens." };
}

export async function getInitialRecoveryUrl() {
  return Linking.getInitialURL() ?? globalThis.location?.href ?? null;
}
