import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { Platform } from "react-native";

export const supabaseUrl = "https://ugrkfsckyhvwojnqgsyz.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncmtmc2NreWh2d29qbnFnc3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDk2MTMsImV4cCI6MjA5MDM4NTYxM30.XyPRPk2RxI1Wf80IyjBPedS8V3A37agRiays0YQIg3M";

type SupabaseStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const webStorage: SupabaseStorage = {
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
