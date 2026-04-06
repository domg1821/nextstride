import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useSegments } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, Text, View, useWindowDimensions } from "react-native";
import Plan from "./explore";
import GuideTab from "./guide";
import Home from "./index";
import Profile from "./profile";
import Progress from "./progress";
import { QuickDrawerProvider } from "@/components/quick-drawer";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

type TabKey = "index" | "explore" | "guide" | "progress" | "profile";

type TabConfig = {
  key: TabKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  component: React.ComponentType;
};

const TAB_CONFIGS: TabConfig[] = [
  { key: "index", title: "Home", icon: "home", href: "/(solo)", component: Home },
  { key: "explore", title: "Plan", icon: "calendar", href: "/(solo)/explore", component: Plan },
  { key: "guide", title: "Guide", icon: "chatbubble-ellipses", href: "/(solo)/guide", component: GuideTab },
  { key: "progress", title: "Progress", icon: "stats-chart", href: "/(solo)/progress", component: Progress },
  { key: "profile", title: "Profile", icon: "person", href: "/(solo)/profile", component: Profile },
];

const VISIBLE_TAB_KEYS: TabKey[] = ["index", "explore", "guide", "progress"];
const VISIBLE_TAB_CONFIGS = TAB_CONFIGS.filter((tab) => VISIBLE_TAB_KEYS.includes(tab.key));

export default function TabLayout() {
  const { authReady, isAuthenticated, profile } = useProfile();
  const { colors, isDark } = useThemeColors();
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const activeTab = getActiveTab(segments[1]);
  const activeIndex = TAB_CONFIGS.findIndex((tab) => tab.key === activeTab);
  const translateX = useRef(new Animated.Value(-Math.max(activeIndex, 0) * width)).current;
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!profile.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
  }, [authReady, isAuthenticated, profile.onboardingComplete]);

  useEffect(() => {
    const targetValue = -Math.max(activeIndex, 0) * width;

    if (!hasMounted.current) {
      translateX.setValue(targetValue);
      hasMounted.current = true;
      return;
    }

    Animated.timing(translateX, {
      toValue: targetValue,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, translateX, width]);

  const tabBar = useMemo(
    () => (
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
        {VISIBLE_TAB_CONFIGS.map((tab) => {
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
              <Text
                style={{
                  color: active ? colors.text : colors.subtext,
                  fontSize: 12,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ),
    [activeTab, colors, isDark]
  );

  if (
    !authReady ||
    !isAuthenticated ||
    !profile.onboardingComplete
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 18 }}>
          Preparing your account
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, marginTop: 8, textAlign: "center" }}>
          Checking your remembered session and runner access.
        </Text>
      </View>
    );
  }

  return (
    <QuickDrawerProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Animated.View
            style={{
              flexDirection: "row",
              width: width * TAB_CONFIGS.length,
              height: "100%",
              transform: [{ translateX }],
            }}
          >
            {TAB_CONFIGS.map((tab) => {
              const ScreenComponent = tab.component;

              return (
                <View
                  key={tab.key}
                  style={{
                    width,
                    flex: 1,
                    backgroundColor: colors.background,
                  }}
                >
                  <ScreenComponent />
                </View>
              );
            })}
          </Animated.View>
        </View>
        {tabBar}
      </View>
    </QuickDrawerProvider>
  );
}

function getActiveTab(segment?: string): TabKey {
  switch (segment) {
    case "explore":
    case "guide":
    case "progress":
    case "profile":
      return segment;
    default:
      return "index";
  }
}
