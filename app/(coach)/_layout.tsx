import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useSegments } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import CoachDashboard from "./index";
import CoachProfile from "./profile";
import CoachTeam from "./team";
import CoachWorkouts from "./workouts";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

type TabKey = "index" | "team" | "workouts" | "profile";

const TAB_CONFIGS: {
  key: TabKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  component: React.ComponentType;
}[] = [
  { key: "index", title: "Dashboard", icon: "grid", href: "/(coach)", component: CoachDashboard },
  { key: "team", title: "Team", icon: "people", href: "/(coach)/team", component: CoachTeam },
  { key: "workouts", title: "Workouts", icon: "barbell", href: "/(coach)/workouts", component: CoachWorkouts },
  { key: "profile", title: "Profile", icon: "person", href: "/(coach)/profile", component: CoachProfile },
];

export default function CoachLayout() {
  const { authReady, isAuthenticated, profile, appHomeRoute } = useProfile();
  const { colors, isDark } = useThemeColors();
  const segments = useSegments();
  const activeTab = getActiveTab(segments[1]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (profile.accountType !== "coach") {
      router.replace(appHomeRoute);
    }
  }, [appHomeRoute, authReady, isAuthenticated, profile.accountType]);

  if (!authReady || !isAuthenticated || profile.accountType !== "coach") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>Loading coach workspace</Text>
      </View>
    );
  }

  const ActiveComponent = TAB_CONFIGS.find((tab) => tab.key === activeTab)?.component ?? CoachDashboard;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <ActiveComponent />
      </View>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 6,
        }}
      >
        {TAB_CONFIGS.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!active) {
                  router.replace(tab.href as never);
                }
              }}
              style={{
                flex: 1,
                marginHorizontal: 5,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? (isDark ? colors.cardAlt : colors.primarySoft) : "transparent",
              }}
            >
              <Ionicons name={tab.icon} size={20} color={active ? colors.text : colors.subtext} />
              <Text style={{ color: active ? colors.text : colors.subtext, fontSize: 12, fontWeight: "700", marginTop: 4 }}>
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getActiveTab(segment?: string): TabKey {
  switch (segment) {
    case "team":
    case "workouts":
    case "profile":
      return segment;
    default:
      return "index";
  }
}
