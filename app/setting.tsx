import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "./theme-context";

export default function Settings() {
  const { mode, colors, toggleTheme } = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
      }}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.primary, marginBottom: 20 }}>← Back</Text>
      </Pressable>

      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "bold" }}>
        Settings
      </Text>

      <View
        style={{
          marginTop: 20,
          backgroundColor: colors.card,
          padding: 18,
          borderRadius: 14,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
          Appearance
        </Text>
        <Text style={{ color: colors.subtext, marginTop: 6 }}>
          Current mode: {mode === "dark" ? "Night" : "Day"}
        </Text>

        <Pressable
          onPress={toggleTheme}
          style={{
            marginTop: 14,
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Switch to {mode === "dark" ? "Day" : "Night"} Mode
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={{
          marginTop: 16,
          backgroundColor: colors.card,
          padding: 18,
          borderRadius: 14,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
          Sign Out
        </Text>
        <Text style={{ color: colors.subtext, marginTop: 6 }}>
          Placeholder for now
        </Text>
      </Pressable>
    </View>
  );
}