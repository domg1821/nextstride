import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ThemeTokens } from "@/constants/theme";
import { MotionTokens } from "@/components/ui-polish";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { useResponsiveLayout } from "@/lib/responsive";
import { getStreakSummary } from "@/utils/workout-utils";

type QuickDrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
  navigateFromDrawer: (href: string) => void;
};

type DrawerItem = {
  label: string;
  href?: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  accent?: string;
  onPress?: () => void;
};

const QuickDrawerContext = createContext<QuickDrawerContextValue | null>(null);

export function QuickDrawerProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeColors();
  const { width, height } = useWindowDimensions();
  const layout = useResponsiveLayout();
  const drawerWidth = Math.min(width - (layout.isDesktop ? 48 : 24), layout.isDesktop ? 420 : 388);
  const panelMaxHeight = Math.min(height - (layout.isDesktop ? 132 : 112), 620);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-14)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.98)).current;
  const { profile, signOut } = useProfile();
  const { status, tierLabel } = usePremium();
  const { workouts } = useWorkouts();

  const streak = useMemo(() => getStreakSummary(workouts.map((workout) => workout.date)), [workouts]);
  const weeklyMiles = useMemo(
    () =>
      workouts.reduce((sum, workout) => {
        const miles = Number.parseFloat(workout.distance);
        return sum + (Number.isFinite(miles) ? miles : 0);
      }, 0),
    [workouts]
  );
  const nextRace = profile.raceGoals[0] ?? null;

  const openDrawer = useCallback(() => {
    setVisible(true);
    translateY.setValue(-14);
    overlayOpacity.setValue(0);
    contentOpacity.setValue(0);
    contentScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: MotionTokens.panel,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: MotionTokens.overlay,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: MotionTokens.panel,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 1,
        duration: MotionTokens.panel,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentScale, overlayOpacity, translateY]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -14,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: MotionTokens.overlay,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.985,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
      }
    });
  }, [contentOpacity, contentScale, overlayOpacity, translateY]);

  const navigateFromDrawer = useCallback((href: string) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -14,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: MotionTokens.overlay,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.985,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      setVisible(false);

      if (finished) {
        router.push(href as never);
      }
    });
  }, [contentOpacity, contentScale, overlayOpacity, translateY]);

  const handleSignOut = useCallback(() => {
    closeDrawer();
    signOut();
    router.replace("/welcome");
  }, [closeDrawer, signOut]);

  const drawerItems = useMemo<DrawerItem[]>(() => {
    const items: DrawerItem[] = [
      {
        label: "Profile",
        href: "/(solo)/profile",
        icon: "person-circle-outline",
        description: "Update your photo, goals, and runner profile.",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: "settings-outline",
        description: "Manage notifications, plan details, and account settings.",
      },
      {
        label: "Progress",
        href: "/(solo)/progress",
        icon: "stats-chart-outline",
        description: "Check streaks, milestones, and weekly training trends.",
      },
      {
        label: "Race Predictor",
        href: "/race-predictor",
        icon: "speedometer-outline",
        description: "Estimate current race fitness from your recent running.",
      },
      {
        label: "AI Coach",
        href: "/(solo)/guide",
        icon: "sparkles-outline",
        description: "Open guidance and next-step reads built around your training.",
      },
    ];

    if (status === "premium_active") {
      items.push({
        label: "Premium",
        href: "/premium",
        icon: "diamond-outline",
        description: `${tierLabel} is active. Review premium tools and plan details.`,
        accent: "#67e8f9",
      });
    } else {
      items.push({
        label: "Upgrade",
        href: "/upgrade",
        icon: "rocket-outline",
        description: "Unlock the premium layer for deeper guidance and smarter feedback.",
        accent: "#67e8f9",
      });
    }

    items.push({
      label: "Sign Out",
      icon: "log-out-outline",
      description: "Sign out of your account.",
      onPress: handleSignOut,
    });

    return items;
  }, [handleSignOut, status, tierLabel]);

  return (
    <QuickDrawerContext.Provider
      value={{
        openDrawer,
        closeDrawer,
        navigateFromDrawer,
      }}
    >
      {children}
      <Modal visible={visible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={{ flex: 1 }}>
          <Pressable onPress={closeDrawer} style={{ flex: 1 }}>
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: "rgba(5, 10, 18, 0.62)",
                opacity: overlayOpacity,
              }}
            />
          </Pressable>

          <Animated.View
            style={{
              position: "absolute",
              top: layout.isDesktop ? 88 : 76,
              left: layout.isDesktop ? 24 : 12,
              width: drawerWidth,
              maxHeight: panelMaxHeight,
              transform: [{ translateY }, { scale: contentScale }],
              opacity: contentOpacity,
              backgroundColor: colors.card,
              borderRadius: ThemeTokens.radii.xl,
              borderWidth: 1,
              borderColor: "rgba(103, 232, 249, 0.14)",
              paddingHorizontal: 18,
              paddingTop: 24,
              paddingBottom: 24,
              shadowColor: "#38bdf8",
              shadowOpacity: 0.16,
              shadowRadius: 26,
              shadowOffset: { width: 0, height: 12 },
              elevation: 20,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -30,
                right: -20,
                width: 180,
                height: 180,
                borderRadius: 999,
                backgroundColor: "rgba(103, 232, 249, 0.07)",
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>QUICK ACCESS</Text>
                <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 10, letterSpacing: -0.2 }}>
                  {profile.name || "Runner"}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
                  Fast shortcuts and a quick read on where your training stands.
                </Text>
              </View>

              <Pressable
                onPress={closeDrawer}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(8, 17, 29, 0.7)",
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.94 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                })}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 18,
                backgroundColor: "rgba(8, 17, 29, 0.66)",
                borderRadius: ThemeTokens.radii.lg,
                borderWidth: 1,
                borderColor: "rgba(103, 232, 249, 0.12)",
                padding: 18,
                gap: 12,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
                {status === "premium_active" ? `${tierLabel} active` : "Free plan"}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <SummaryPill label="Streak" value={streak.current > 0 ? `${streak.current} days` : "Fresh week"} accent="#67e8f9" />
                <SummaryPill label="Mileage" value={`${weeklyMiles.toFixed(1)} mi`} accent="#93c5fd" />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>NEXT RACE</Text>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                  {nextRace ? nextRace.event : "No goal race set"}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                  {nextRace?.raceDate ? nextRace.raceDate : "Set a race goal to unlock countdown and sharper progress feedback."}
                </Text>
              </View>
            </View>

            <ScrollView
              style={{ marginTop: 18, flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled
              indicatorStyle="white"
            >
              {drawerItems.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={item.onPress ? item.onPress : item.href ? () => navigateFromDrawer(item.href as string) : undefined}
                  style={({ pressed }) => ({
                    backgroundColor: item.accent ? "rgba(19, 36, 56, 0.96)" : colors.cardAlt,
                    borderRadius: ThemeTokens.radii.lg,
                    borderWidth: 1,
                    borderColor: item.accent ? "rgba(103, 232, 249, 0.2)" : colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    opacity: pressed ? 0.94 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }, { translateY: pressed ? 1 : 0 }],
                  })}
                >
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: ThemeTokens.radii.md,
                        backgroundColor: item.accent ? "rgba(103, 232, 249, 0.12)" : "rgba(8, 17, 29, 0.68)",
                        borderWidth: 1,
                        borderColor: item.accent ? "rgba(103, 232, 249, 0.18)" : "rgba(103, 232, 249, 0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={item.icon} size={20} color={item.accent || colors.text} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{item.label}</Text>
                      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 18, marginTop: 4 }}>
                        {item.description}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={item.accent || colors.subtext} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </QuickDrawerContext.Provider>
  );
}

function SummaryPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View
      style={styles.summaryPill}
    >
      <Text style={{ color: accent, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#f8fbff", fontSize: 14, fontWeight: "800", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

export function useQuickDrawer() {
  const context = useContext(QuickDrawerContext);

  if (!context) {
    throw new Error("useQuickDrawer must be used inside QuickDrawerProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  summaryPill: {
    flex: 1,
    backgroundColor: "rgba(15, 27, 45, 0.92)",
    borderRadius: ThemeTokens.radii.md,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
