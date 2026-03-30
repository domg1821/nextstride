import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const webStorage: StorageAdapter = {
  async getItem(key) {
    if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
      return null;
    }

    return globalThis.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
      return;
    }

    globalThis.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
      return;
    }

    globalThis.localStorage.removeItem(key);
  },
};

const storage = Platform.OS === "web" ? webStorage : AsyncStorage;

export async function readStoredJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const rawValue = await storage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export async function writeStoredJson<T>(key: string, value: T) {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the app usable even if local persistence is temporarily unavailable.
  }
}

export async function removeStoredValue(key: string) {
  try {
    await storage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures so sign-out still completes in memory.
  }
}
