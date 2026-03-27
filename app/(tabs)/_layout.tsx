import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useSegments } from "expo-router";
import { TabTransitionProvider } from "../components/ui-shell";
import { useThemeColors } from "../theme-context";

export default function TabLayout() {
  const { colors, isDark } = useThemeColors();
  const segments = useSegments();
  const activeTab = getActiveTab(segments[1]);

  return (
    <TabTransitionProvider activeTab={activeTab}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 78,
            paddingTop: 10,
            paddingBottom: 12,
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.subtext,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700",
          },
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarItemStyle: {
            borderRadius: 18,
            marginHorizontal: 5,
          },
          tabBarActiveBackgroundColor: isDark ? colors.cardAlt : colors.primarySoft,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Plan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: "Log",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TabTransitionProvider>
  );
}

function getActiveTab(segment?: string) {
  switch (segment) {
    case "explore":
    case "log":
    case "progress":
    case "profile":
      return segment;
    default:
      return "index";
  }
}
