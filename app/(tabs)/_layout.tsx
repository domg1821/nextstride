import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useSegments } from "expo-router";
import { type ComponentType, memo, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, Text, View, useWindowDimensions } from "react-native";
import EngineTab from "./engine";
import Plan from "./explore";
import GuideTab from "./guide";
import Home from "./index";
import Profile from "./profile";
import Progress from "./progress";
import { QuickDrawerProvider } from "@/components/quick-drawer";
import { MotionTokens } from "@/components/ui-polish";
import { TabMotionProvider } from "@/components/ui-shell";
import { ThemeTokens } from "@/constants/theme";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

type TabKey = "index" | "explore" | "engine" | "guide" | "progress" | "profile";

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
  { key: "engine", title: "Engine", icon: "fitness", href: "/(solo)/engine", component: EngineTab },
  { key: "guide", title: "Guide", icon: "chatbubble-ellipses", href: "/(solo)/guide", component: GuideTab },
  { key: "progress", title: "Progress", icon: "stats-chart", href: "/(solo)/progress", component: Progress },
  { key: "profile", title: "Profile", icon: "person", href: "/(solo)/profile", component: Profile },
];

const VISIBLE_TAB_KEYS: TabKey[] = ["index", "explore", "engine", "guide", "progress"];
const VISIBLE_TAB_CONFIGS = TAB_CONFIGS.filter((tab) => VISIBLE_TAB_KEYS.includes(tab.key));
const TAB_BAR_HORIZONTAL_PADDING = 10;
const TAB_BAR_INNER_GAP = 6;
const TAB_BAR_HEIGHT = 60;
const TAB_TRANSITION_SPRING = {
  duration: MotionTokens.tab,
  easing: MotionTokens.easeOut,
  useNativeDriver: true as const,
};

export default function TabLayout() {
  const { authReady, isAuthenticated, profile } = useProfile();
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const activeTab = getActiveTab(segments[1]);
  const activeScreenIndex = Math.max(TAB_CONFIGS.findIndex((tab) => tab.key === activeTab), 0);
  const activeVisibleIndex = Math.max(VISIBLE_TAB_CONFIGS.findIndex((tab) => tab.key === activeTab), 0);

  const screenPosition = useRef(new Animated.Value(activeScreenIndex)).current;
  const visibleTabPosition = useRef(new Animated.Value(activeVisibleIndex)).current;
  const hasMounted = useRef(false);
  const [visitedTabs, setVisitedTabs] = useState<TabKey[]>([activeTab]);

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
    }
  }, [authReady, isAuthenticated, profile.onboardingComplete]);

  useEffect(() => {
    if (!hasMounted.current) {
      screenPosition.setValue(activeScreenIndex);
      visibleTabPosition.setValue(activeVisibleIndex);
      hasMounted.current = true;
      return;
    }

    Animated.parallel([
      Animated.timing(screenPosition, {
        toValue: activeScreenIndex,
        ...TAB_TRANSITION_SPRING,
      }),
      Animated.timing(visibleTabPosition, {
        toValue: activeVisibleIndex,
        ...TAB_TRANSITION_SPRING,
      }),
    ]).start();
  }, [activeScreenIndex, activeVisibleIndex, screenPosition, visibleTabPosition]);

  useEffect(() => {
    setVisitedTabs((current) => (current.includes(activeTab) ? current : [...current, activeTab]));
  }, [activeTab]);

  const contentTranslateX = Animated.multiply(screenPosition, -width);
  const renderedTabKeys = useMemo(() => {
    const keys = new Set<TabKey>(visitedTabs);
    keys.add(activeTab);
    const previousTab = TAB_CONFIGS[activeScreenIndex - 1];
    const nextTab = TAB_CONFIGS[activeScreenIndex + 1];

    if (previousTab) {
      keys.add(previousTab.key);
    }

    if (nextTab) {
      keys.add(nextTab.key);
    }

    return keys;
  }, [activeScreenIndex, activeTab, visitedTabs]);

  if (!authReady || !isAuthenticated || !profile.onboardingComplete) {
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
      <TabMotionProvider activeIndex={activeScreenIndex}>
        <View style={{ flex: 1, minHeight: 0, backgroundColor: colors.background }}>
          <View style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <Animated.View
              style={{
                flexDirection: "row",
                width: width * TAB_CONFIGS.length,
                flex: 1,
                minHeight: 0,
                transform: [{ translateX: contentTranslateX }],
              }}
            >
              {TAB_CONFIGS.map((tab) => {
                return (
                  <TabSceneSlot
                    key={tab.key}
                    ScreenComponent={tab.component}
                    shouldRender={renderedTabKeys.has(tab.key)}
                    width={width}
                    backgroundColor={colors.background}
                  />
                );
              })}
            </Animated.View>
          </View>

          <AnimatedTabBar
            activeTab={activeTab}
            visibleTabPosition={visibleTabPosition}
            tabs={VISIBLE_TAB_CONFIGS}
          />
        </View>
      </TabMotionProvider>
    </QuickDrawerProvider>
  );
}

const TabSceneSlot = memo(function TabSceneSlot({
  ScreenComponent,
  shouldRender,
  width,
  backgroundColor,
}: {
  ScreenComponent: ComponentType;
  shouldRender: boolean;
  width: number;
  backgroundColor: string;
}) {
  return (
    <View
      style={{
        width,
        flex: 1,
        minHeight: 0,
        backgroundColor,
      }}
    >
      {shouldRender ? <ScreenComponent /> : null}
    </View>
  );
},
(prev, next) =>
  prev.ScreenComponent === next.ScreenComponent &&
  prev.shouldRender === next.shouldRender &&
  prev.width === next.width &&
  prev.backgroundColor === next.backgroundColor);

function AnimatedTabBar({
  activeTab,
  visibleTabPosition,
  tabs,
}: {
  activeTab: TabKey;
  visibleTabPosition: Animated.Value;
  tabs: TabConfig[];
}) {
  const { colors, isDark } = useThemeColors();
  const { width } = useWindowDimensions();
  const pressProgress = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(tabs.map((tab) => [tab.key, new Animated.Value(tab.key === activeTab ? 1 : 0)]))
  ).current;

  const tabWidth = useMemo(() => {
    const availableWidth = width - TAB_BAR_HORIZONTAL_PADDING * 2;
    const totalGap = TAB_BAR_INNER_GAP * (tabs.length - 1);
    return (availableWidth - totalGap) / tabs.length;
  }, [tabs.length, width]);
  const indicatorTranslateX = Animated.multiply(visibleTabPosition, tabWidth + TAB_BAR_INNER_GAP);

  useEffect(() => {
    tabs.forEach((tab) => {
      const animatedValue = pressProgress[tab.key];
      Animated.timing(animatedValue, {
        toValue: tab.key === activeTab ? 1 : 0,
        duration: MotionTokens.tab,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }).start();
    });
  }, [activeTab, pressProgress, tabs]);

  return (
    <View
      style={{
        paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
        paddingTop: 8,
        paddingBottom: 14,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: "rgba(110, 180, 255, 0.08)",
      }}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: ThemeTokens.radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 6,
          shadowColor: "#020817",
          shadowOpacity: isDark ? 0.18 : 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        }}
      >
        <View
          style={{
            position: "relative",
            flexDirection: "row",
            gap: TAB_BAR_INNER_GAP,
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: tabWidth,
              height: TAB_BAR_HEIGHT,
              borderRadius: 22,
              transform: [{ translateX: indicatorTranslateX }],
              backgroundColor: colors.primarySoft,
              borderWidth: 1,
              borderColor: "rgba(110, 180, 255, 0.28)",
              shadowColor: colors.primary,
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <View
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                top: 0,
                height: 2,
                borderRadius: 999,
                backgroundColor: "rgba(110, 180, 255, 0.72)",
              }}
            />
          </Animated.View>

          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            const tabActiveProgress = pressProgress[tab.key];

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.title} tab`}
                accessibilityHint={`Open the ${tab.title} screen`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  if (!active) {
                    router.replace(tab.href as never);
                  }
                }}
                style={({ pressed, focused }) => ({
                  width: tabWidth,
                  height: TAB_BAR_HEIGHT,
                  borderRadius: 22,
                  minHeight: TAB_BAR_HEIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  opacity: pressed ? 0.96 : 1,
                  transform: [{ scale: pressed ? 0.976 : 1 }, { translateY: pressed ? 1.2 : 0 }],
                  backgroundColor: focused
                    ? "rgba(110, 180, 255, 0.10)"
                    : pressed
                      ? "rgba(148, 163, 184, 0.07)"
                      : "transparent",
                  borderWidth: focused ? 2 : 0,
                  borderColor: focused ? "#d7efff" : "transparent",
                })}
              >
                <Animated.View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    transform: [
                      {
                        translateY: tabActiveProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, -0.5],
                        }),
                      },
                    ],
                    opacity: tabActiveProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.84, 1],
                    }),
                  }}
                >
                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale: tabActiveProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.04],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name={tab.icon} size={20} color={active ? colors.text : colors.subtext} />
                  </Animated.View>
                  <Animated.Text
                    style={{
                      color: active ? colors.text : colors.subtext,
                      fontSize: 12,
                      fontWeight: active ? "800" : "700",
                      letterSpacing: tabActiveProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.12],
                      }) as unknown as number,
                    }}
                  >
                    {tab.title}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function getActiveTab(segment?: string): TabKey {
  switch (segment) {
    case "explore":
    case "guide":
    case "progress":
    case "engine":
    case "profile":
      return segment;
    default:
      return "index";
  }
}
