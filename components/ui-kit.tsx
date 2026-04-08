import React from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { RunningSurfaceAccent } from "@/components/running-visuals";
import { useThemeColors } from "@/contexts/theme-context";
import { ThemeTokens } from "@/constants/theme";
import { useResponsiveLayout } from "@/lib/responsive";
import { MotionTokens } from "@/components/ui-polish";

export function getSurfaceCardStyle(
  colors: ReturnType<typeof useThemeColors>["colors"],
  options?: {
    tone?: "default" | "contrast" | "accent";
    padding?: number;
    radius?: number;
  }
) {
  const tone = options?.tone ?? "default";
  const backgroundColor =
    tone === "accent" ? "#101d31" : tone === "contrast" ? "#101d2f" : colors.card;
  const borderColor =
    tone === "accent"
      ? "rgba(103, 232, 249, 0.18)"
      : tone === "contrast"
        ? "rgba(148, 163, 184, 0.14)"
        : colors.border;

  return {
    backgroundColor,
    borderRadius: options?.radius ?? ThemeTokens.radii.xl,
    borderWidth: 1,
    borderColor,
    padding: options?.padding ?? ThemeTokens.spacing.ml,
    shadowColor: tone === "accent" ? "#1d4ed8" : "#03101f",
    shadowOffset: { width: 0, height: tone === "accent" ? 14 : 12 },
    shadowOpacity: tone === "accent" ? 0.26 : tone === "contrast" ? 0.2 : 0.17,
    shadowRadius: tone === "accent" ? 30 : tone === "contrast" ? 24 : 22,
    elevation: tone === "accent" ? 9 : 7,
  } as const;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  rightContent,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}) {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        getSurfaceCardStyle(colors, { tone: "contrast", padding: ThemeTokens.spacing.ml }),
        { overflow: "hidden" },
      ]}
    >
      <RunningSurfaceAccent variant="road" />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          width: 72,
          height: 2,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.36)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -52,
          right: -30,
          width: 164,
          height: 164,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.06)",
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
          {eyebrow ? (
            <Text
              style={{
                color: colors.primary,
                fontSize: ThemeTokens.typography.caption.fontSize,
                fontWeight: "800",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Text>
          ) : null}

          <Text
            style={{
              color: colors.text,
              fontSize: layout.isDesktop ? ThemeTokens.typography.display.fontSize : layout.isPhone ? 28 : 32,
              fontWeight: "800",
              marginTop: eyebrow ? ThemeTokens.spacing.s : 0,
              lineHeight: layout.isDesktop ? ThemeTokens.typography.display.lineHeight : layout.isPhone ? 34 : 38,
              letterSpacing: -0.5,
              maxWidth: 760,
            }}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={{
                color: colors.subtext,
                fontSize: ThemeTokens.typography.body.fontSize,
                lineHeight: ThemeTokens.typography.body.lineHeight,
                marginTop: ThemeTokens.spacing.ms,
                maxWidth: 620,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightContent}
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  emphasis = false,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  emphasis?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const { colors } = useThemeColors();
  const press = React.useRef(new Animated.Value(0)).current;
  const hover = React.useRef(new Animated.Value(0)).current;
  const focus = React.useRef(new Animated.Value(0)).current;

  const animateTo = React.useCallback(
    (toValue: number) => {
      Animated.spring(press, {
        toValue,
        ...MotionTokens.spring,
      }).start();
    },
    [press]
  );

  const animateHover = React.useCallback(
    (toValue: number) => {
      Animated.timing(hover, {
        toValue,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }).start();
    },
    [hover]
  );

  const animateFocus = React.useCallback(
    (toValue: number) => {
      Animated.timing(focus, {
        toValue,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }).start();
    },
    [focus]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      onHoverIn={() => animateHover(1)}
      onHoverOut={() => animateHover(0)}
      onFocus={() => animateFocus(1)}
      onBlur={() => animateFocus(0)}
    >
      <Animated.View
        style={{
          backgroundColor: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.primary, "#77c1ff"],
          }),
          paddingHorizontal: ThemeTokens.spacing.m,
          minHeight: 56,
          paddingVertical: ThemeTokens.spacing.ms,
          borderRadius: ThemeTokens.radii.md,
          borderWidth: 1,
          borderColor: focus.interpolate({
            inputRange: [0, 1],
            outputRange: [emphasis ? "rgba(191, 239, 255, 0.34)" : "rgba(255,255,255,0.08)", "#d7efff"],
          }),
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.primary,
          shadowOpacity: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [emphasis ? 0.24 : 0.18, emphasis ? 0.34 : 0.28],
          }),
          shadowRadius: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [emphasis ? 18 : 14, emphasis ? 24 : 20],
          }),
          shadowOffset: {
            width: 0,
            height: 10,
          },
          transform: [
            {
              translateY: Animated.add(
                hover.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -2],
                }),
                press.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2],
                })
              ),
            },
            {
              scale: press.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.976],
              }),
            },
          ],
          opacity: Animated.add(
            hover.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.995],
            }),
            press.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -0.035],
            })
          ),
          borderBottomColor: hover.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(255,255,255,0.08)", "rgba(191, 239, 255, 0.22)"],
          }),
          outlineWidth: focus.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2],
          }),
          outlineColor: "#d7efff",
          outlineOffset: 2,
          overflow: "hidden",
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 1,
            left: 12,
            right: 12,
            height: 1.5,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.28)",
            opacity: hover.interpolate({
              inputRange: [0, 1],
              outputRange: [0.68, 1],
            }),
          }}
        />
        <Text style={{ color: "#ffffff", fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight, fontWeight: "700", textAlign: "center" }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const { colors } = useThemeColors();
  const press = React.useRef(new Animated.Value(0)).current;
  const hover = React.useRef(new Animated.Value(0)).current;
  const focus = React.useRef(new Animated.Value(0)).current;

  const animateTo = React.useCallback(
    (toValue: number) => {
      Animated.spring(press, {
        toValue,
        ...MotionTokens.spring,
      }).start();
    },
    [press]
  );

  const animateHover = React.useCallback(
    (toValue: number) => {
      Animated.timing(hover, {
        toValue,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }).start();
    },
    [hover]
  );

  const animateFocus = React.useCallback(
    (toValue: number) => {
      Animated.timing(focus, {
        toValue,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }).start();
    },
    [focus]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      onHoverIn={() => animateHover(1)}
      onHoverOut={() => animateHover(0)}
      onFocus={() => animateFocus(1)}
      onBlur={() => animateFocus(0)}
    >
      <Animated.View
        style={{
          backgroundColor: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.card, colors.cardAlt],
          }),
          paddingHorizontal: ThemeTokens.spacing.m,
          minHeight: 56,
          paddingVertical: ThemeTokens.spacing.ms,
          borderRadius: ThemeTokens.radii.md,
          borderWidth: 1,
          borderColor: focus.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.border, "#d7efff"],
          }),
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#020817",
          shadowOpacity: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [0.12, 0.18],
          }),
          shadowRadius: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 20],
          }),
          shadowOffset: { width: 0, height: 8 },
          transform: [
            {
              translateY: Animated.add(
                hover.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -2],
                }),
                press.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                })
              ),
            },
            {
              scale: press.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.98],
              }),
            },
          ],
          opacity: Animated.add(
            hover.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.996],
            }),
            press.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -0.025],
            })
          ),
          borderBottomColor: hover.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.border, "rgba(110, 180, 255, 0.24)"],
          }),
          outlineWidth: focus.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2],
          }),
          outlineColor: "#d7efff",
          outlineOffset: 2,
          overflow: "hidden",
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 1,
            left: 12,
            right: 12,
            height: 1,
            borderRadius: 999,
            backgroundColor: "rgba(188, 230, 255, 0.14)",
            opacity: hover.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            }),
          }}
        />
        <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight, fontWeight: "700", textAlign: "center" }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function InfoCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[getSurfaceCardStyle(colors, { padding: ThemeTokens.spacing.ml }), { overflow: "hidden" }]}
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
          backgroundColor: "rgba(188, 230, 255, 0.14)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -44,
          right: -22,
          width: 132,
          height: 132,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.04)",
        }}
      />
      {title ? (
        <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h3.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h3.lineHeight, letterSpacing: -0.1 }}>
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          style={{
            color: colors.subtext,
            fontSize: ThemeTokens.typography.small.fontSize,
            lineHeight: ThemeTokens.typography.small.lineHeight,
            marginTop: title ? ThemeTokens.spacing.s : 0,
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {children ? <View style={{ marginTop: title || subtitle ? ThemeTokens.spacing.m : 0 }}>{children}</View> : null}
    </View>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[getSurfaceCardStyle(colors, { padding: ThemeTokens.spacing.ml }), { overflow: "hidden" }]}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -28,
          right: -18,
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.05)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 1.5,
          borderRadius: 999,
          backgroundColor: "rgba(188, 230, 255, 0.16)",
        }}
      />
      <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, fontWeight: "700" }}>{label}</Text>
      <Text
        style={{
          color: colors.text,
          fontSize: ThemeTokens.typography.h2.fontSize,
          fontWeight: "800",
          lineHeight: ThemeTokens.typography.h2.lineHeight,
          marginTop: ThemeTokens.spacing.ms,
          letterSpacing: -0.35,
        }}
      >
        {value}
      </Text>
      {helper ? (
        <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, marginTop: ThemeTokens.spacing.s, lineHeight: ThemeTokens.typography.small.lineHeight }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
