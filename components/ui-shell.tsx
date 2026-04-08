import React, { createContext, useContext, useMemo, useRef } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAmbientBackground } from "@/components/running-visuals";
import { ThemeColors } from "@/contexts/theme-context";
import { FadeInView, MotionTokens } from "@/components/ui-polish";
import { useResponsiveLayout } from "@/lib/responsive";

type TabMotionContextValue = {
  activeIndex: number;
  previousIndex: number;
};

const TAB_ORDER = ["index", "explore", "engine", "guide", "progress", "profile"] as const;
const TabMotionContext = createContext<TabMotionContextValue | null>(null);

export function TabMotionProvider({
  activeIndex,
  children,
}: {
  activeIndex: number;
  children: React.ReactNode;
}) {
  const previousIndexRef = useRef(activeIndex);

  const value = useMemo(
    () => ({
      activeIndex,
      previousIndex: previousIndexRef.current,
    }),
    [activeIndex]
  );

  previousIndexRef.current = activeIndex;

  return <TabMotionContext.Provider value={value}>{children}</TabMotionContext.Provider>;
}

export function AnimatedTabScene({
  tabKey,
  children,
}: {
  tabKey?: string;
  children: React.ReactNode;
}) {
  const motion = useContext(TabMotionContext);
  const ownIndex = TAB_ORDER.indexOf((tabKey as (typeof TAB_ORDER)[number]) || "index");
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!motion || ownIndex < 0) {
      return;
    }

    const isActive = motion.activeIndex === ownIndex;
    const direction = motion.activeIndex > motion.previousIndex ? 1 : motion.activeIndex < motion.previousIndex ? -1 : 0;

    if (isActive) {
      translateX.setValue(direction === 0 ? 0 : direction * 14);
      translateY.setValue(4);
      opacity.setValue(0.92);
      scale.setValue(0.996);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: MotionTokens.tab,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: MotionTokens.tab,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: MotionTokens.base,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: MotionTokens.base,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    const offsetDirection = ownIndex < motion.activeIndex ? -1 : 1;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: offsetDirection * 6,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 1,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.985,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.999,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [motion, opacity, ownIndex, scale, translateX, translateY]);

  return (
    <Animated.View
      key={tabKey}
      style={{
        flex: 1,
        minHeight: 0,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function ScreenScroll({
  colors,
  children,
  maxWidth,
}: {
  colors: ThemeColors;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(layout.isDesktop ? 24 : 20, insets.top + 12);
  const bottomPadding = 104 + insets.bottom;

  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      scrollIndicatorInsets={{ top: topPadding, bottom: bottomPadding }}
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingHorizontal: layout.pagePadding,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
        },
        maxWidth
          ? {
              width: "100%",
              maxWidth,
              alignSelf: "center",
            }
          : null,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <AppAmbientBackground tone="default" />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 180,
          backgroundColor: "rgba(255,255,255,0.01)",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(148, 163, 184, 0.03)",
        }}
      />
      <FadeInView distance={8} style={{ gap: layout.sectionGap }}>
        {children}
      </FadeInView>
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
  const layout = useResponsiveLayout();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#03101f",
        shadowOpacity: 0.24,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 14 },
        padding: padded ? (layout.isDesktop ? 24 : 20) : 0,
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 1.5,
          borderRadius: 999,
          backgroundColor: "rgba(188, 230, 255, 0.18)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -36,
          right: -18,
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.035)",
        }}
      />
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
  const layout = useResponsiveLayout();

  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.border,
        padding: layout.isDesktop ? 28 : 24,
        shadowColor: "#041120",
        shadowOpacity: 0.24,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -42,
          right: -28,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.08)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -36,
          left: -16,
          width: 148,
          height: 148,
          borderRadius: 999,
          backgroundColor: "rgba(37, 99, 235, 0.09)",
        }}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: layout.isPhone ? "wrap" : "nowrap",
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
              fontSize: layout.isDesktop ? 32 : layout.isPhone ? 26 : 29,
              fontWeight: "800",
              marginTop: 8,
              lineHeight: layout.isDesktop ? 38 : layout.isPhone ? 31 : 35,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 10,
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
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.2 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
