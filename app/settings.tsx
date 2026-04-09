import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useResponsiveLayout } from "@/lib/responsive";
import { buildUpgradePath } from "@/lib/upgrade-route";

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
        style={({ pressed }) => ({
          backgroundColor: colors.card,
          borderRadius: 22,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.96 : 1,
          transform: [{ translateY: pressed ? 1 : 0 }],
        })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
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
                marginBottom: 10,
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
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.cardAlt,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 12,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 18, fontWeight: "700" }}>
                {">"}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Settings() {
  const { profile, updateProfile, heartRateZones, resolvedMaxHeartRate, signOut } = useProfile();
  const { status, statusTitle } = usePremium();
  const { mode, isDark, colors, toggleTheme } = useThemeColors();
  const layout = useResponsiveLayout();
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

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(solo)/profile");
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingHorizontal: layout.pagePadding,
        paddingTop: 24,
        paddingBottom: 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: backOpacity, alignSelf: "flex-start" }}>
        <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
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
            backgroundColor: "#101b2d",
            borderRadius: 30,
            padding: 22,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.12)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -24,
              right: -12,
              width: 150,
              height: 150,
              borderRadius: 999,
              backgroundColor: "rgba(37, 99, 235, 0.16)",
            }}
          />
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
            SETTINGS
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "800",
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
            {profile.name || "Runner"}, your profile, training preferences, and reminders stay tied to your account and sync back when you sign in again.
          </Text>

          <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10, marginTop: 18 }}>
            <HeaderMiniPill label="Profile" value={profile.goalEvent || "Runner setup"} />
            <HeaderMiniPill label="Premium" value={statusTitle} />
            <HeaderMiniPill label="Theme" value={mode === "dark" ? "Night mode" : "Day mode"} />
          </View>
        </View>
      </Animated.View>

      <View style={{ marginTop: 22, gap: 14 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>SETUP</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>Training details that shape the app</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
            These settings stay practical: profile basics, notifications, premium status, and heart rate setup.
          </Text>
        </View>

        <SettingsSection
          colors={colors}
          eyebrow="Heart Rate"
          title="Training zones"
          subtitle="Use your age or known max heart rate to make heart rate guidance more useful."
        >
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
        </SettingsSection>

        <SettingsSection
          colors={colors}
          eyebrow="Profile"
          title="Account and app setup"
          subtitle="Keep the rest of your setup easy to scan: profile, reminders, premium, theme, and session controls."
        >
          <SettingsRow
            title="Edit Profile"
            subtitle="Update your name, goal event, weekly mileage, and recent race times."
            accent={colors.success}
            delay={120}
            onPress={() => router.push("/edit-profile")}
          />

          <SettingsRow
            title="Notifications"
            subtitle="Control workout reminders, streak nudges, recovery prompts, and weekly goal reminders."
            accent={colors.primary}
            delay={180}
            onPress={() => router.push("/notifications")}
          />
        </SettingsSection>

        <SettingsSection
          colors={colors}
          eyebrow="Premium"
          title="Plan and access"
          subtitle="Your subscription status stays visible here without taking over the page."
        >
          <SettingsRow
            title="Premium"
            subtitle={
              status === "premium_active"
                ? "Your paid premium tier is active. Review plan access, locked features, and billing details."
                : status === "upgrade_pending"
                  ? "Upgrade started. Open plans to review pending status and next billing steps."
                  : "Unlock Pro or Elite for heart rate guidance, fueling, adaptive training, and premium feedback."
            }
            accent="#d97706"
            delay={240}
            onPress={() => router.push(buildUpgradePath({ plan: status === "premium_active" ? "elite" : "pro" }))}
            trailing={
              <View
                style={{
                  backgroundColor: status === "premium_active" ? "rgba(74, 222, 128, 0.16)" : status === "upgrade_pending" ? "rgba(245, 158, 11, 0.16)" : colors.primarySoft,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: status === "premium_active" ? colors.success : status === "upgrade_pending" ? "#f59e0b" : colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  marginLeft: 12,
                }}
              >
                <Text
                  style={{
                    color: status === "premium_active" ? colors.success : status === "upgrade_pending" ? "#f59e0b" : colors.primary,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {statusTitle}
                </Text>
              </View>
            }
          />
        </SettingsSection>

        <SettingsSection
          colors={colors}
          eyebrow="Appearance"
          title="Theme and session"
          subtitle="Keep visual preferences and account actions separate from training setup."
        >
          <SettingsRow
            title="Day / Night"
            subtitle={`Currently in ${mode === "dark" ? "night" : "day"} mode. This updates the global app theme.`}
            accent={colors.primary}
            onPress={toggleTheme}
            delay={300}
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
            title="Sign Out"
            subtitle="Clear the current session and return to the login screen."
            accent={colors.danger}
            delay={360}
            onPress={() => {
              signOut();
              router.replace("/login");
            }}
          />
        </SettingsSection>
      </View>
    </ScrollView>
  );
}

function SettingsSection({
  colors,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{eyebrow.toUpperCase()}</Text>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>{title}</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{subtitle}</Text>
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function HeaderMiniPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: "rgba(226, 232, 240, 0.72)", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "700" }} numberOfLines={2}>
        {value}
      </Text>
    </View>
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
        backgroundColor: "#101b2d",
        borderRadius: 26,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.12)",
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
          fontWeight: "800",
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
        Age is required for estimated heart rate zones. Resting heart rate is saved for later, and max heart rate overrides the estimate if you know it.
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
