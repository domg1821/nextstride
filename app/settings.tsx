import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
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
  const { profile, updateProfile, heartRateZones, resolvedMaxHeartRate, signOut } = useProfile();
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
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 28,
      }}
      showsVerticalScrollIndicator={false}
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
        <HeartRateSetupCard
          age={profile.age}
          restingHeartRate={profile.restingHeartRate}
          maxHeartRate={profile.maxHeartRate}
          resolvedMaxHeartRate={resolvedMaxHeartRate}
          heartRateZones={heartRateZones}
          onChangeAge={(value) => updateProfile({ age: value })}
          onChangeRestingHeartRate={(value) => updateProfile({ restingHeartRate: value })}
          onChangeMaxHeartRate={(value) => updateProfile({ maxHeartRate: value })}
        />

        <SettingsRow
          title="Premium"
          subtitle="See premium features, pricing, and the upgrade placeholder."
          accent={colors.primary}
          onPress={() => router.push("/premium")}
          delay={120}
        />

        <SettingsRow
          title="Day / Night"
          subtitle={`Currently in ${mode === "dark" ? "night" : "day"} mode. This updates the global app theme context.`}
          accent={colors.primary}
          onPress={toggleTheme}
          delay={180}
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
          delay={240}
        />

        <SettingsRow
          title="Notifications"
          subtitle="Placeholder row for future reminders, workout alerts, and streak nudges."
          accent={colors.primary}
          delay={300}
        />

        <SettingsRow
          title="Sign Out"
          subtitle="Clear the current session and return to the welcome page."
          accent={colors.danger}
          delay={360}
          onPress={() => {
            signOut();
            router.replace("/welcome");
          }}
        />
      </View>
    </ScrollView>
  );
}

function HeartRateSetupCard({
  age,
  restingHeartRate,
  maxHeartRate,
  resolvedMaxHeartRate,
  heartRateZones,
  onChangeAge,
  onChangeRestingHeartRate,
  onChangeMaxHeartRate,
}: {
  age: string;
  restingHeartRate: string;
  maxHeartRate: string;
  resolvedMaxHeartRate: number | null;
  heartRateZones: ReturnType<typeof useProfile>["heartRateZones"];
  onChangeAge: (value: string) => void;
  onChangeRestingHeartRate: (value: string) => void;
  onChangeMaxHeartRate: (value: string) => void;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: colors.primary,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>
          Heart Rate Setup
        </Text>
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "700",
          marginTop: 14,
        }}
      >
        Set up training zones
      </Text>

      <Text
        style={{
          color: colors.subtext,
          fontSize: 14,
          lineHeight: 21,
          marginTop: 8,
        }}
      >
        Age is required for estimated heart rate zones. Resting heart rate is saved for later,
        and max heart rate overrides the estimate if you know it.
      </Text>

      <View style={{ gap: 12, marginTop: 18 }}>
        <HeartRateInput
          label="Age"
          value={age}
          placeholder="28"
          colors={colors}
          onChangeText={onChangeAge}
        />
        <HeartRateInput
          label="Resting Heart Rate"
          value={restingHeartRate}
          placeholder="52"
          colors={colors}
          onChangeText={onChangeRestingHeartRate}
        />
        <HeartRateInput
          label="Max Heart Rate"
          value={maxHeartRate}
          placeholder="Optional"
          colors={colors}
          onChangeText={onChangeMaxHeartRate}
        />
      </View>

      <Text style={{ color: colors.subtext, marginTop: 16, fontSize: 13 }}>
        {resolvedMaxHeartRate
          ? maxHeartRate
            ? `Using provided max heart rate: ${resolvedMaxHeartRate} bpm`
            : `Using estimated max heart rate: ${resolvedMaxHeartRate} bpm (220 - age)`
          : "Enter your age to calculate zones."}
      </Text>

      <View style={{ gap: 10, marginTop: 16 }}>
        {heartRateZones.length > 0 ? (
          heartRateZones.map((zone) => (
            <View
              key={zone.name}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                {zone.name}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700", marginTop: 4 }}>
                {zone.min}-{zone.max} bpm
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>
                {zone.label} of max heart rate
              </Text>
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: colors.cardAlt,
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 14 }}>
              Heart rate zones will appear here once age is added.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function HeartRateInput({
  label,
  value,
  placeholder,
  colors,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  colors: ReturnType<typeof useThemeColors>["colors"];
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        keyboardType="numeric"
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontSize: 15,
        }}
      />
    </View>
  );
}
