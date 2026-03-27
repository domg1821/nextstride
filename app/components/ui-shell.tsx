import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";
import { ThemeColors } from "../theme-context";

type TabKey = "index" | "explore" | "log" | "progress" | "profile";

const TAB_ORDER: TabKey[] = ["index", "explore", "log", "progress", "profile"];

type TabTransitionContextValue = {
  activeTab: TabKey;
  previousTab: TabKey;
};

const TabTransitionContext = createContext<TabTransitionContextValue | null>(null);

export function TabTransitionProvider({
  activeTab,
  children,
}: {
  activeTab: TabKey;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TabTransitionContextValue>({
    activeTab,
    previousTab: activeTab,
  });

  useEffect(() => {
    setState((current) => {
      if (current.activeTab === activeTab) {
        return current;
      }

      return {
        activeTab,
        previousTab: current.activeTab,
      };
    });
  }, [activeTab]);

  return <TabTransitionContext.Provider value={state}>{children}</TabTransitionContext.Provider>;
}

export function AnimatedTabScene({
  tabKey,
  children,
}: {
  tabKey: TabKey;
  children: React.ReactNode;
}) {
  const context = useContext(TabTransitionContext);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!context || context.activeTab !== tabKey) {
      return;
    }

    const previousIndex = TAB_ORDER.indexOf(context.previousTab);
    const currentIndex = TAB_ORDER.indexOf(tabKey);
    const direction = currentIndex >= previousIndex ? 1 : -1;

    opacity.setValue(0);
    translateX.setValue(direction * 18);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [context, opacity, tabKey, translateX]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}

export function ScreenScroll({
  colors,
  children,
}: {
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 40,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function SectionCard({
  colors,
  children,
  padded = true,
}: {
  colors: ThemeColors;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: colors.border,
        padding: padded ? 20 : 0,
      }}
    >
      {children}
    </View>
  );
}

export function HeroCard({
  colors,
  eyebrow,
  title,
  subtitle,
  rightContent,
}: {
  colors: ThemeColors;
  eyebrow: string;
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "800",
              marginTop: 10,
              lineHeight: 36,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: 15,
              lineHeight: 23,
              marginTop: 12,
            }}
          >
            {subtitle}
          </Text>
        </View>
        {rightContent}
      </View>
    </View>
  );
}

export function SectionTitle({
  colors,
  title,
  subtitle,
}: {
  colors: ThemeColors;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
