import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  TextInput,
  TextInputProps,
  UIManager,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "@/lib/responsive";
import type { ThemeColors } from "@/contexts/theme-context";

export const MotionTokens = {
  instant: 120,
  fast: 170,
  base: 230,
  slow: 300,
  tab: 260,
  panel: 250,
  overlay: 210,
  easeOut: Easing.bezier(0.2, 0.9, 0.22, 1),
  easeInOut: Easing.bezier(0.32, 0.08, 0.24, 1),
  easeIn: Easing.bezier(0.45, 0, 0.78, 0.2),
  spring: {
    damping: 22,
    stiffness: 300,
    mass: 0.9,
    overshootClamping: true,
    useNativeDriver: true as const,
  },
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function FadeInView({
  children,
  delay = 0,
  distance = 10,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: MotionTokens.base,
        delay,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: MotionTokens.slow,
        delay,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function AnimatedProgressBar({
  progress,
  fillColor,
  trackColor,
  height = 10,
  emphasize = false,
}: {
  progress: number;
  fillColor: string;
  trackColor: string;
  height?: number;
  emphasize?: boolean;
}) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(emphasize ? 0.7 : 0.5)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(progress, 100));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: clamped,
        duration: 340,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: clamped >= 72 ? 1 : emphasize ? 0.76 : 0.58,
        duration: MotionTokens.base,
        easing: MotionTokens.easeInOut,
        useNativeDriver: false,
      }),
    ]).start();

    sheen.setValue(0);
    Animated.timing(sheen, {
      toValue: 1,
      duration: 620,
      easing: MotionTokens.easeOut,
      useNativeDriver: true,
    }).start();
  }, [animatedWidth, clamped, emphasize, glow, sheen]);

  return (
    <View
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: 999,
        overflow: "hidden",
        borderWidth: emphasize ? 1 : 0,
        borderColor: emphasize ? "rgba(255,255,255,0.08)" : "transparent",
      }}
    >
      <Animated.View
        style={{
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
          height: "100%",
          borderRadius: 999,
          backgroundColor: fillColor,
          shadowColor: fillColor,
          shadowOpacity: glow.interpolate({
            inputRange: [0.5, 1],
            outputRange: [emphasize ? 0.18 : 0.12, emphasize ? 0.34 : 0.24],
          }),
          shadowRadius: glow.interpolate({
            inputRange: [0.5, 1],
            outputRange: [emphasize ? 8 : 6, emphasize ? 16 : 11],
          }),
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "34%",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.12)",
            opacity: clamped > 8 ? 1 : 0,
            transform: [
              {
                translateX: sheen.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-90, 240],
                }),
              },
            ],
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 1,
            left: 8,
            right: 8,
            height: Math.max(2, height * 0.3),
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.22)",
            opacity: clamped >= 72 ? 0.9 : 0.65,
          }}
        />
      </Animated.View>
    </View>
  );
}

export function AnimatedNumber({
  value,
  duration = 260,
  decimals = 0,
  prefix = "",
  suffix = "",
  style,
  formatter,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  formatter?: (value: number) => string;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: nextValue }) => {
      setDisplayValue(nextValue);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: MotionTokens.easeOut,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, duration, value]);

  const roundedValue =
    decimals > 0 ? Number(displayValue.toFixed(decimals)) : Math.round(displayValue);
  const formattedValue = formatter
    ? formatter(roundedValue)
    : decimals > 0
      ? roundedValue.toFixed(decimals)
      : roundedValue.toLocaleString();

  return <Text style={style}>{`${prefix}${formattedValue}${suffix}`}</Text>;
}

export function AnimatedScoreRing({
  value,
  max = 10,
  size = 96,
  strokeWidth = 10,
  fillColor,
  trackColor,
  glowColor,
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  fillColor: string;
  trackColor: string;
  glowColor?: string;
  children?: React.ReactNode;
}) {
  const progress = Math.max(0, Math.min(value / max, 1));
  const rightRotation = useRef(new Animated.Value(0)).current;
  const leftRotation = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(progress > 0.7 ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rightRotation, {
        toValue: progress <= 0.5 ? progress * 360 : 180,
        duration: 420,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }),
      Animated.timing(leftRotation, {
        toValue: progress <= 0.5 ? 0 : (progress - 0.5) * 360,
        duration: 420,
        easing: MotionTokens.easeOut,
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: progress > 0.7 ? 1 : 0.72,
        duration: 320,
        easing: MotionTokens.easeInOut,
        useNativeDriver: false,
      }),
    ]).start();
  }, [glow, leftRotation, progress, rightRotation]);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderRadius: 999,
          backgroundColor: glowColor || fillColor,
          opacity: glow.interpolate({
            inputRange: [0.72, 1],
            outputRange: [0.09, 0.18],
          }),
          transform: [
            {
              scale: glow.interpolate({
                inputRange: [0.72, 1],
                outputRange: [0.94, 1.02],
              }),
            },
          ],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: 999,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          transform: [{ rotate: "-90deg" }],
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: size / 2,
            height: size,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: -size / 2,
              width: size,
              height: size,
              borderRadius: 999,
              borderWidth: strokeWidth,
              borderColor: fillColor,
              transform: [
                {
                  rotate: rightRotation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            }}
          />
        </View>

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size / 2,
            height: size,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: 999,
              borderWidth: strokeWidth,
              borderColor: fillColor,
              transform: [
                {
                  rotate: leftRotation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            }}
          />
        </View>
      </View>

      <View
        style={{
          width: size - strokeWidth * 2.5,
          height: size - strokeWidth * 2.5,
          borderRadius: 999,
          backgroundColor: "rgba(8, 15, 26, 0.9)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export function InteractivePressable({
  onPress,
  children,
  style,
  scaleTo = 0.97,
  hoverLift = 4,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hoverLift?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: "button" | "link" | "tab";
  accessibilityState?: { disabled?: boolean; selected?: boolean };
}) {
  const press = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const focus = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(press, {
      toValue,
      ...MotionTokens.spring,
    }).start();
  };

  const animateHover = (toValue: number) => {
    Animated.timing(hover, {
      toValue,
      duration: MotionTokens.fast,
      easing: MotionTokens.easeOut,
      useNativeDriver: false,
    }).start();
  };

  const animateFocus = (toValue: number) => {
    Animated.timing(focus, {
      toValue,
      duration: MotionTokens.fast,
      easing: MotionTokens.easeOut,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      accessible={Boolean(onPress)}
      accessibilityRole={accessibilityRole || (onPress ? "button" : undefined)}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      onHoverIn={() => animateHover(1)}
      onHoverOut={() => animateHover(0)}
      onFocus={() => animateFocus(1)}
      onBlur={() => animateFocus(0)}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [
              {
                translateY: Animated.add(
                  hover.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -hoverLift],
                  }),
                  press.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1.35],
                  })
                ),
              },
              {
                scale: hover.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.012],
                }),
              },
              {
                scale: press.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, scaleTo],
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
                outputRange: [0, -0.016],
              }),
            ),
            shadowOpacity: hover.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.2],
            }),
            shadowRadius: hover.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 18],
            }),
            shadowOffset: { width: 0, height: 8 },
            shadowColor: "#56b6ff",
            borderColor: focus.interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(255,255,255,0)", "rgba(215, 239, 255, 0.9)"],
            }),
            borderWidth: focus.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2],
            }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function ExpandablePanel({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  style,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  style?: StyleProp<ViewStyle>;
  headerRight?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mounted, setMounted] = useState(defaultExpanded);
  const contentOpacity = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const contentTranslateY = useRef(new Animated.Value(defaultExpanded ? 0 : -6)).current;
  const contentScale = useRef(new Animated.Value(defaultExpanded ? 1 : 0.988)).current;
  const headerPress = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    animateNextLayout();
    if (!expanded) {
      setMounted(true);
      setExpanded(true);
      return;
    }

    setExpanded(false);
  };

  useEffect(() => {
    if (expanded) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: MotionTokens.base,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
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
      return;
    }

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: -6,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.988,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [contentOpacity, contentScale, contentTranslateY, expanded]);

  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={expanded ? "Collapse section" : "Expand section"}
        accessibilityState={{ expanded }}
        onPress={toggle}
        onPressIn={() =>
          Animated.timing(headerPress, {
            toValue: 1,
            duration: MotionTokens.fast,
            easing: MotionTokens.easeOut,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.timing(headerPress, {
            toValue: 0,
            duration: MotionTokens.fast,
            easing: MotionTokens.easeInOut,
            useNativeDriver: true,
          }).start()
        }
      >
        <Animated.View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            transform: [
              {
                scale: headerPress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.992],
                }),
              },
            ],
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: "#f8fbff", fontSize: 18, fontWeight: "800" }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: "#94a3b8", fontSize: 13, lineHeight: 18 }}>{subtitle}</Text>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {headerRight}
            <Animated.View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(15, 23, 42, 0.72)",
                transform: [
                  {
                    rotate: expanded ? "0deg" : "0deg",
                  },
                  {
                    scale: expanded ? 1 : 0.985,
                  },
                ],
              }}
            >
              <Text style={{ color: "#cbd5e1", fontSize: 11, fontWeight: "800" }}>
                {expanded ? "HIDE" : "OPEN"}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>
      {mounted ? (
        <Animated.View
          style={{
            marginTop: 14,
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }, { scale: contentScale }],
          }}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

export function PulseView({
  children,
  scaleRange = [1, 1.03],
}: {
  children: React.ReactNode;
  scaleRange?: [number, number];
}) {
  const scale = useRef(new Animated.Value(scaleRange[0])).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: scaleRange[1],
          duration: 1400,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: scaleRange[0],
          duration: 1400,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scale, scaleRange]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

export function SuccessBadge({
  label,
  detail,
  autoHideMs = 2200,
  onHidden,
}: {
  label: string;
  detail?: string;
  autoHideMs?: number;
  onHidden?: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const showAnimation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        ...MotionTokens.spring,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: MotionTokens.easeOut,
        useNativeDriver: true,
      }),
    ]);

    showAnimation.start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.97,
          duration: 220,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -6,
          duration: 220,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onHidden?.();
        }
      });
    }, autoHideMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [autoHideMs, onHidden, opacity, scale, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }, { translateY }],
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "rgba(22, 163, 74, 0.12)",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(74, 222, 128, 0.24)",
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: "#16a34a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "800" }}>OK</Text>
      </View>

      <View style={{ flex: 1, gap: detail ? 3 : 0 }}>
        <Text style={{ color: "#f0fdf4", fontSize: 13, fontWeight: "800" }}>{label}</Text>
        {detail ? (
          <Text style={{ color: "rgba(220, 252, 231, 0.82)", fontSize: 12, lineHeight: 17 }}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function AnimatedTextField({
  colors,
  helper,
  containerStyle,
  inputStyle,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  colors: ThemeColors;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const focusValue = useRef(new Animated.Value(0)).current;
  const hoverValue = useRef(new Animated.Value(0)).current;

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    Animated.timing(focusValue, {
      toValue: 1,
      duration: MotionTokens.fast,
      easing: MotionTokens.easeOut,
      useNativeDriver: false,
    }).start();
    onFocus?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (event) => {
    Animated.timing(focusValue, {
      toValue: 0,
      duration: MotionTokens.fast,
      easing: MotionTokens.easeInOut,
      useNativeDriver: false,
    }).start();
    onBlur?.(event);
  };

  return (
    <View style={containerStyle}>
      <Pressable
        onHoverIn={() =>
          Animated.timing(hoverValue, {
            toValue: 1,
            duration: MotionTokens.fast,
            easing: MotionTokens.easeOut,
            useNativeDriver: false,
          }).start()
        }
        onHoverOut={() =>
          Animated.timing(hoverValue, {
            toValue: 0,
            duration: MotionTokens.fast,
            easing: MotionTokens.easeInOut,
            useNativeDriver: false,
          }).start()
        }
      >
      <Animated.View
        style={[
          {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: focusValue.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.border, colors.primary],
            }),
            backgroundColor: focusValue.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.background, colors.cardAlt],
            }),
            transform: [
              {
                scale: Animated.add(
                  hoverValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.004],
                  }),
                  focusValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.012],
                  })
                ),
              },
              {
                translateY: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -1],
                }),
              },
            ],
            shadowColor: colors.primary,
            shadowOpacity: Animated.add(
              hoverValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.06, 0.04],
              }),
              focusValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.16],
              })
            ),
            shadowRadius: Animated.add(
              hoverValue.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 4],
              }),
              focusValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 14],
              })
            ),
            shadowOffset: { width: 0, height: 4 },
            outlineWidth: focusValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2],
            }),
            outlineColor: "#d7efff",
            outlineOffset: 2,
          },
          inputStyle,
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel || props.placeholder || "Input field"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={props.placeholderTextColor ?? colors.subtext}
          style={{
            color: colors.text,
            paddingHorizontal: 14,
            paddingVertical: 15,
            minHeight: 56,
            fontSize: 15,
            lineHeight: 22,
          }}
        />
      </Animated.View>
      </Pressable>
      {helper ? <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 18, marginTop: 6 }}>{helper}</Text> : null}
    </View>
  );
}

export function animateNextLayout() {
  LayoutAnimation.configureNext({
    duration: MotionTokens.panel,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
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
        Animated.spring(translateY, {
          toValue: 0,
          ...MotionTokens.spring,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: MotionTokens.overlay,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: MotionTokens.instant,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 26,
          duration: MotionTokens.panel,
          easing: MotionTokens.easeInOut,
          useNativeDriver: true,
        }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, contentOpacity, mounted, translateY, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable onPress={onClose} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(2, 6, 23, 0.74)",
              opacity: backdropOpacity,
            }}
          />
        </Pressable>
        <Animated.View
          style={{
            opacity: contentOpacity,
            transform: [
              { translateY },
              {
                scale: contentOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.985, 1],
                }),
              },
            ],
            backgroundColor: "#0b1321",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.14)",
            paddingHorizontal: layout.modalInset,
            paddingTop: 12,
            paddingBottom: Math.max(22, insets.bottom + 10),
            shadowColor: "#020817",
            shadowOpacity: 0.28,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: -8 },
            maxHeight: `${Math.round(layout.modalMaxHeight * 100)}%`,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 999,
              backgroundColor: "rgba(148, 163, 184, 0.42)",
              marginBottom: 14,
            }}
          />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function FloatingModalCard({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
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
        Animated.timing(translateY, {
          toValue: 0,
          duration: MotionTokens.panel,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: MotionTokens.panel,
          easing: MotionTokens.easeOut,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
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
      Animated.timing(translateY, {
        toValue: 14,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.985,
        duration: MotionTokens.fast,
        easing: MotionTokens.easeInOut,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, contentOpacity, mounted, scale, translateY, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          justifyContent: "center",
          paddingHorizontal: layout.modalInset,
          paddingTop: Math.max(layout.modalInset, insets.top + 12),
          paddingBottom: Math.max(layout.modalInset, insets.bottom + 12),
        }}
      >
        <Pressable onPress={onClose} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(3, 8, 18, 0.72)",
              opacity: backdropOpacity,
            }}
          />
        </Pressable>
        <Animated.View
          style={{
            width: "100%",
            maxHeight: `${Math.round(layout.modalMaxHeight * 100)}%`,
            opacity: contentOpacity,
            transform: [{ translateY }, { scale }],
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
