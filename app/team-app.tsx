import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

const TEAM_NEXT_STEPS = [
  "Joining a team roster and invitation flow",
  "Shared team workouts and training visibility",
  "Coach communication and announcements",
];

export default function TeamApp() {
  const { colors } = useThemeColors();
  const { authReady, displayName, isAuthenticated, profile, signOut } = useProfile();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (profile.accountType !== "team_runner") {
      router.replace(profile.accountType === "coach" ? "/coach-app" : "/(tabs)");
    }
  }, [authReady, isAuthenticated, profile.accountType]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 24,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>
          TEAM RUNNER MODE
        </Text>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: "800", marginTop: 12 }}>
          Team Dashboard
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23, marginTop: 10 }}>
          {displayName}, your account is now routed into the team runner experience. This Phase 1 shell confirms the
          route foundation is working and leaves a clean place for team-linked training later.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
          <ActionButton label="View Website" onPress={() => router.push("/welcome")} colors={colors} />
          <ActionButton label="Log Out" onPress={() => {
            signOut();
            router.replace("/login");
          }} colors={colors} variant="secondary" />
        </View>
      </View>

      <SectionCard title="What this shell confirms" colors={colors}>
        <BulletLine text="You are signed in and staying authenticated as a team runner." colors={colors} />
        <BulletLine text="Your `account_type` is being used for post-auth routing." colors={colors} />
        <BulletLine text="You are not being dropped into the solo runner tabs by default." colors={colors} />
      </SectionCard>

      <SectionCard title="Coming next" colors={colors}>
        {TEAM_NEXT_STEPS.map((item) => (
          <BulletLine key={item} text={item} colors={colors} />
        ))}
      </SectionCard>
    </ScrollView>
  );
}

function SectionCard({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useThemeColors>["colors"];
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        gap: 12,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{title}</Text>
      {children}
    </View>
  );
}

function BulletLine({
  text,
  colors,
}: {
  text: string;
  colors: ReturnType<typeof useThemeColors>["colors"];
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.primary,
          marginTop: 7,
        }}
      />
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, flex: 1 }}>{text}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  colors,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>["colors"];
  variant?: "primary" | "secondary";
}) {
  const primary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: primary ? colors.primary : colors.cardAlt,
        borderRadius: 18,
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        paddingHorizontal: 18,
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: primary ? "#ffffff" : colors.text, fontSize: 14, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}
