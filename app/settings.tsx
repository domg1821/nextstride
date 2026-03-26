import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Switch, Text, View } from "react-native";
import { useProfile } from "./profile-context";
import { useThemeColors } from "./theme-context";

type SettingsRowProps = {
  title: string;
  subtitle: string;
  accent: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  delay?: number;
};

function SettingsRow({
  title,
  subtitle,
  accent,
  onPress,
  trailing,
  delay = 0,
}: SettingsRowProps) {
  const { colors } = useThemeColors();
  const rowOpacity = useRef(new Animated.Value(0)).current;
  const rowTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rowOpacity, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rowTranslate, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, rowOpacity, rowTranslate]);

  return (
    <Animated.View
      style={{
        opacity: rowOpacity,
        transform: [{ translateY: rowTranslate }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: colors.card,
          borderRadius: 22,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 14 }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: accent,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>
                {title}
              </Text>
            </View>

            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
              {subtitle}
            </Text>
          </View>

          {trailing ?? (
            <Text style={{ color: colors.subtext, fontSize: 22, marginLeft: 12 }}>
              {">"}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Settings() {
  const { profile } = useProfile();
  const { mode, isDark, colors, toggleTheme } = useThemeColors();
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(20)).current;
  const backOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 340,
        delay: 60,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 360,
        delay: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backOpacity, heroOpacity, heroTranslate]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 28,
      }}
    >
      <Animated.View style={{ opacity: backOpacity, alignSelf: "flex-start" }}>
        <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>
            Back
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{
          marginTop: 18,
          opacity: heroOpacity,
          transform: [{ translateY: heroTranslate }],
        }}
      >
        <View
          style={{
            backgroundColor: colors.cardAlt,
            borderRadius: 28,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.subtext, fontSize: 13, letterSpacing: 0.4 }}>
            SETTINGS
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "700",
              marginTop: 8,
            }}
          >
            Make NextStride feel like yours.
          </Text>

          <Text
            style={{
              color: colors.subtext,
              marginTop: 10,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {profile.name || "Runner"}, your preferences are local for now and ready for
            future account settings.
          </Text>
        </View>
      </Animated.View>

      <View style={{ marginTop: 22, gap: 14 }}>
        <SettingsRow
          title="Day / Night"
          subtitle={`Currently in ${mode === "dark" ? "night" : "day"} mode. This updates the global app theme context.`}
          accent={colors.primary}
          onPress={toggleTheme}
          delay={120}
          trailing={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.primarySoft, true: colors.primary }}
              thumbColor="#ffffff"
            />
          }
        />

        <SettingsRow
          title="Edit Profile"
          subtitle="Placeholder row for editing your name, goal event, PRs, and weekly mileage."
          accent={colors.success}
          delay={180}
        />

        <SettingsRow
          title="Notifications"
          subtitle="Placeholder row for future reminders, workout alerts, and streak nudges."
          accent={colors.primary}
          delay={240}
        />

        <SettingsRow
          title="Sign Out"
          subtitle="Placeholder row for account sign out once auth is connected."
          accent={colors.danger}
          delay={300}
        />
      </View>
    </View>
  );
}
