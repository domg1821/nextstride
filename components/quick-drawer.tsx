import { router } from "expo-router";
import React, { createContext, useContext, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useThemeColors } from "@/contexts/theme-context";

type QuickDrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
  navigateFromDrawer: (href: string) => void;
};

const QuickDrawerContext = createContext<QuickDrawerContextValue | null>(null);
const DRAWER_ITEMS = [
  { label: "Settings", href: "/settings" },
  { label: "Profile", href: "/(tabs)/profile" },
  { label: "Race Predictor", href: "/race-predictor" },
];

export function QuickDrawerProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.44, 320);
  const [visible, setVisible] = useState(false);
  const translateX = useRef(new Animated.Value(-drawerWidth - 24)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setVisible(true);
    translateX.setValue(-drawerWidth - 24);
    overlayOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -drawerWidth - 24,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
      }
    });
  };

  const navigateFromDrawer = (href: string) => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -drawerWidth - 24,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      setVisible(false);

      if (finished) {
        router.push(href as never);
      }
    });
  };

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
                backgroundColor: "rgba(5, 10, 18, 0.52)",
                opacity: overlayOpacity,
              }}
            />
          </Pressable>

          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: drawerWidth,
              transform: [{ translateX }],
              backgroundColor: colors.card,
              borderTopRightRadius: 28,
              borderBottomRightRadius: 28,
              borderRightWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 18,
              paddingTop: 68,
              paddingBottom: 28,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
              QUICK MENU
            </Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 10 }}>
              Jump quickly
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20, marginTop: 10 }}>
              Fast access to the pages you are most likely to revisit.
            </Text>

            <View style={{ marginTop: 24, gap: 12 }}>
              {DRAWER_ITEMS.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigateFromDrawer(item.href)}
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </QuickDrawerContext.Provider>
  );
}

export function useQuickDrawer() {
  const context = useContext(QuickDrawerContext);

  if (!context) {
    throw new Error("useQuickDrawer must be used inside QuickDrawerProvider");
  }

  return context;
}
