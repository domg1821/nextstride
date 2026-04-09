import * as Linking from "expo-linking";
import { Platform } from "react-native";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    return trimTrailingSlash(parsed.origin);
  } catch {
    return null;
  }
}

function getRuntimeWebOrigin() {
  if (typeof globalThis === "undefined" || !("location" in globalThis) || !globalThis.location?.origin) {
    return null;
  }

  return trimTrailingSlash(globalThis.location.origin);
}

function joinUrl(origin: string, path: string) {
  return `${trimTrailingSlash(origin)}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getWebAuthRedirectUrl(path: string) {
  const configuredOrigin =
    normalizeOrigin(process.env.EXPO_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.EXPO_PUBLIC_APP_URL) ??
    normalizeOrigin(process.env.EXPO_PUBLIC_VERCEL_URL ? `https://${process.env.EXPO_PUBLIC_VERCEL_URL}` : null);
  const runtimeOrigin = getRuntimeWebOrigin();
  const resolvedOrigin = configuredOrigin ?? runtimeOrigin;

  if (!resolvedOrigin) {
    return null;
  }

  return joinUrl(resolvedOrigin, path);
}

export function getAuthRedirectUrl(path: string) {
  if (Platform.OS === "web") {
    return getWebAuthRedirectUrl(path) ?? Linking.createURL(path);
  }

  return Linking.createURL(path);
}
