import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useSegments } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import TeamComments from "./comments";
import TeamHome from "./index";
import TeamProfile from "./profile";
import TeamWorkouts from "./workouts";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

type TabKey = "index" | "workouts" | "comments" | "profile";

const TAB_CONFIGS: {
  key: TabKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  component: React.ComponentType;
}[] = [
  { key: "index", title: "Home", icon: "home", href: "/(team)", component: TeamHome },
  { key: "workouts", title: "Team Workouts", icon: "barbell", href: "/(team)/workouts", component: TeamWorkouts },
  { key: "comments", title: "Comments", icon: "chatbubbles", href: "/(team)/comments", component: TeamComments },
  { key: "profile", title: "Profile", icon: "person", href: "/(team)/profile", component: TeamProfile },
];

export default function TeamLayout() {
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

    if (profile.accountType !== "team_runner") {
      router.replace(appHomeRoute);
    }
  }, [appHomeRoute, authReady, isAuthenticated, profile.accountType]);

  if (!authReady || !isAuthenticated || profile.accountType !== "team_runner") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>Loading team workspace</Text>
      </View>
    );
  }

  const ActiveComponent = TAB_CONFIGS.find((tab) => tab.key === activeTab)?.component ?? TeamHome;

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
              <Text style={{ color: active ? colors.text : colors.subtext, fontSize: 11, fontWeight: "700", marginTop: 4, textAlign: "center" }}>
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
    case "workouts":
    case "comments":
    case "profile":
      return segment;
    default:
      return "index";
  }
}
