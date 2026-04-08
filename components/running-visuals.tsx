import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export function RunningSurfaceAccent({
  variant = "road",
}: {
  variant?: "road" | "track" | "race";
}) {
  const stripeColor =
    variant === "track"
      ? "rgba(245, 158, 11, 0.12)"
      : variant === "race"
        ? "rgba(103, 232, 249, 0.12)"
        : "rgba(148, 163, 184, 0.11)";
  const glowColor =
    variant === "track"
      ? "rgba(245, 158, 11, 0.14)"
      : variant === "race"
        ? "rgba(37, 99, 235, 0.18)"
        : "rgba(74, 222, 128, 0.1)";
  const secondaryGlow =
    variant === "track"
      ? "rgba(59, 130, 246, 0.08)"
      : variant === "race"
        ? "rgba(168, 85, 247, 0.08)"
        : "rgba(103, 232, 249, 0.08)";
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={[
          styles.glowOrb,
          {
            top: -34,
            right: -18,
            backgroundColor: glowColor,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.75, 1],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.secondaryOrb,
          {
            bottom: -36,
            left: -20,
            backgroundColor: secondaryGlow,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.55, 0.9],
            }),
          },
        ]}
      />
      <View style={[styles.curve, { borderColor: stripeColor, top: 22, right: -30 }]} />
      <View style={[styles.curve, { borderColor: stripeColor, top: 52, right: -52, transform: [{ rotate: "-6deg" }] }]} />
      <Animated.View
        style={[
          styles.trackLine,
          {
            backgroundColor: stripeColor,
            bottom: 24,
            left: 22,
            right: 64,
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.45, 0.9],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.trackLine,
          {
            backgroundColor: stripeColor,
            bottom: 12,
            left: 52,
            right: 28,
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.28, 0.68],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.motionStreak,
          {
            top: 18,
            left: 18,
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.18],
            }),
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function FinishLineAccent() {
  return (
    <View pointerEvents="none" style={styles.finishWrap}>
      <View style={styles.finishPost} />
      <View style={styles.finishFlag}>
        <View style={styles.checkRow}>
          <View style={[styles.check, styles.checkDark]} />
          <View style={[styles.check, styles.checkLight]} />
          <View style={[styles.check, styles.checkDark]} />
          <View style={[styles.check, styles.checkLight]} />
        </View>
        <View style={styles.checkRow}>
          <View style={[styles.check, styles.checkLight]} />
          <View style={[styles.check, styles.checkDark]} />
          <View style={[styles.check, styles.checkLight]} />
          <View style={[styles.check, styles.checkDark]} />
        </View>
      </View>
    </View>
  );
}

export function TrackLinesBackdrop({
  variant = "road",
  style,
}: {
  variant?: "road" | "track" | "race";
  style?: StyleProp<ViewStyle>;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const lanePalette =
    variant === "track"
      ? ["rgba(59, 130, 246, 0.08)", "rgba(45, 212, 191, 0.08)", "rgba(168, 85, 247, 0.06)"]
      : variant === "race"
        ? ["rgba(103, 232, 249, 0.09)", "rgba(37, 99, 235, 0.08)", "rgba(168, 85, 247, 0.07)"]
        : ["rgba(103, 232, 249, 0.07)", "rgba(45, 212, 191, 0.07)", "rgba(96, 165, 250, 0.06)"];
  const glowPalette =
    variant === "track"
      ? ["rgba(56, 189, 248, 0.08)", "rgba(20, 184, 166, 0.06)"]
      : variant === "race"
        ? ["rgba(37, 99, 235, 0.08)", "rgba(168, 85, 247, 0.06)"]
        : ["rgba(14, 165, 233, 0.06)", "rgba(45, 212, 191, 0.05)"];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [drift]);

  return (
    <View pointerEvents="none" style={[styles.trackBackdropWrap, style]}>
      <Animated.View
        style={[
          styles.trackGlow,
          {
            top: -42,
            right: -58,
            backgroundColor: glowPalette[0],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -14],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.trackGlowSecondary,
          {
            bottom: -54,
            left: -48,
            backgroundColor: glowPalette[1],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />

      {lanePalette.map((color, index) => (
        <Animated.View
          key={`${variant}-lane-${index}`}
          style={[
            styles.trackLane,
            {
              borderColor: color,
              top: 28 + index * 64,
              left: -120 - index * 38,
              width: 540 + index * 90,
              height: 260 + index * 24,
              opacity: 1 - index * 0.18,
              transform: [
                { rotate: `${-9 + index * 2}deg` },
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 16 - index * 5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function GlowBackground({
  variant = "road",
  style,
}: {
  variant?: "road" | "track" | "race";
  style?: StyleProp<ViewStyle>;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const palette =
    variant === "track"
      ? ["rgba(56, 189, 248, 0.12)", "rgba(45, 212, 191, 0.08)", "rgba(168, 85, 247, 0.06)"]
      : variant === "race"
        ? ["rgba(37, 99, 235, 0.12)", "rgba(103, 232, 249, 0.1)", "rgba(168, 85, 247, 0.07)"]
        : ["rgba(59, 130, 246, 0.1)", "rgba(45, 212, 191, 0.08)", "rgba(96, 165, 250, 0.06)"];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [drift]);

  return (
    <View pointerEvents="none" style={[styles.glowBackgroundWrap, style]}>
      <Animated.View
        style={[
          styles.glowLayerLarge,
          {
            top: -46,
            right: -28,
            backgroundColor: palette[0],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
              {
                scale: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.04],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowLayerMedium,
          {
            bottom: -42,
            left: -24,
            backgroundColor: palette[1],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowLayerSmall,
          {
            top: 52,
            left: "28%",
            backgroundColor: palette[2],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function AmbientTrackBackdrop({
  variant = "road",
  style,
}: {
  variant?: "road" | "track" | "race";
  style?: StyleProp<ViewStyle>;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const palette =
    variant === "track"
      ? ["rgba(56, 189, 248, 0.08)", "rgba(45, 212, 191, 0.06)", "rgba(168, 85, 247, 0.05)"]
      : variant === "race"
        ? ["rgba(37, 99, 235, 0.09)", "rgba(103, 232, 249, 0.07)", "rgba(168, 85, 247, 0.06)"]
        : ["rgba(59, 130, 246, 0.08)", "rgba(45, 212, 191, 0.06)", "rgba(139, 92, 246, 0.05)"];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [drift]);

  return (
    <View pointerEvents="none" style={[styles.ambientBackdropWrap, style]}>
      <TrackLinesBackdrop variant={variant} style={StyleSheet.absoluteFillObject} />
      <GlowBackground variant={variant} style={StyleSheet.absoluteFillObject} />

      <Animated.View
        style={[
          styles.ambientBlobLarge,
          {
            top: -52,
            left: -36,
            backgroundColor: palette[0],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
              {
                scale: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.03],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientBlobMedium,
          {
            top: 200,
            right: -44,
            backgroundColor: palette[1],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientBlobSmall,
          {
            bottom: -42,
            left: "26%",
            backgroundColor: palette[2],
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function AppAmbientBackground({
  tone = "default",
  style,
}: {
  tone?: "default" | "focused";
  style?: StyleProp<ViewStyle>;
}) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 22000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 22000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [drift]);

  const glowStrength = tone === "focused" ? 1 : 0.82;

  return (
    <View pointerEvents="none" style={[styles.appAmbientWrap, style]}>
      <Animated.View
        style={[
          styles.appEdgeGlow,
          styles.appEdgeGlowTop,
          {
            opacity: 0.2 * glowStrength,
            transform: [
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appEdgeGlow,
          styles.appEdgeGlowBottom,
          {
            opacity: 0.14 * glowStrength,
            transform: [
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appMeshPrimary,
          {
            opacity: 0.9 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appMeshSecondary,
          {
            opacity: 0.75 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 16],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appMeshAccent,
          {
            opacity: 0.6 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appCenterGlow,
          {
            opacity: 0.16 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />

      {[0, 1, 2].map((index) => (
        <Animated.View
          key={`ambient-ribbon-${index}`}
          style={[
            styles.appRibbon,
            {
              top: 80 + index * 180,
              left: -120 - index * 44,
              width: 680 + index * 90,
              height: 290 + index * 30,
              opacity: (0.22 - index * 0.04) * glowStrength,
              transform: [
                { rotate: `${-7 + index * 1.8}deg` },
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 18 - index * 5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {[0, 1, 2].map((index) => (
        <Animated.View
          key={`ambient-contour-${index}`}
          style={[
            styles.appContourLine,
            {
              top: 158 + index * 210,
              right: -150 + index * 24,
              width: 560 - index * 36,
              opacity: (0.16 - index * 0.03) * glowStrength,
              transform: [
                { rotate: `${7 - index * 1.2}deg` },
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12 + index * 3],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {[0, 1].map((index) => (
        <Animated.View
          key={`ambient-route-${index}`}
          style={[
            styles.appRouteLine,
            {
              top: 260 + index * 260,
              left: -40 + index * 22,
              width: 680 - index * 80,
              opacity: (0.12 - index * 0.02) * glowStrength,
              transform: [
                { rotate: `${-5 + index * 1.8}deg` },
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10 - index * 2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.appStreak,
          {
            top: 116,
            right: 48,
            opacity: 0.14 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appStreakSecondary,
          {
            top: 132,
            right: 82,
            opacity: 0.12 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.appStreakTertiary,
          {
            bottom: 168,
            left: 34,
            opacity: 0.08 * glowStrength,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function MarketingBackdrop({
  tone = "hero",
  style,
}: {
  tone?: "hero" | "pricing" | "cta" | "panel";
  style?: StyleProp<ViewStyle>;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const linePalette =
    tone === "pricing"
      ? ["rgba(103, 232, 249, 0.11)", "rgba(59, 130, 246, 0.08)", "rgba(168, 85, 247, 0.07)"]
      : tone === "cta"
        ? ["rgba(45, 212, 191, 0.11)", "rgba(37, 99, 235, 0.09)", "rgba(168, 85, 247, 0.08)"]
        : tone === "panel"
          ? ["rgba(103, 232, 249, 0.09)", "rgba(59, 130, 246, 0.07)", "rgba(45, 212, 191, 0.06)"]
          : ["rgba(103, 232, 249, 0.12)", "rgba(45, 212, 191, 0.09)", "rgba(168, 85, 247, 0.08)"];
  const meshPalette =
    tone === "pricing"
      ? ["rgba(37, 99, 235, 0.14)", "rgba(103, 232, 249, 0.09)", "rgba(168, 85, 247, 0.08)"]
      : tone === "cta"
        ? ["rgba(45, 212, 191, 0.12)", "rgba(59, 130, 246, 0.1)", "rgba(168, 85, 247, 0.08)"]
        : tone === "panel"
          ? ["rgba(59, 130, 246, 0.11)", "rgba(103, 232, 249, 0.08)", "rgba(45, 212, 191, 0.06)"]
          : ["rgba(37, 99, 235, 0.16)", "rgba(45, 212, 191, 0.1)", "rgba(168, 85, 247, 0.09)"];
  const streakOpacity = tone === "panel" ? 0.4 : 1;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [drift]);

  return (
    <View pointerEvents="none" style={[styles.marketingBackdropWrap, style]}>
      <Animated.View
        style={[
          styles.meshRibbonPrimary,
          {
            top: tone === "panel" ? -34 : -62,
            right: tone === "cta" ? -120 : -88,
            backgroundColor: meshPalette[0],
            transform: [
              { rotate: tone === "cta" ? "-18deg" : "-14deg" },
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -16],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.meshRibbonSecondary,
          {
            bottom: tone === "panel" ? -90 : -132,
            left: tone === "pricing" ? -96 : -68,
            backgroundColor: meshPalette[1],
            transform: [
              { rotate: tone === "pricing" ? "18deg" : "13deg" },
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.meshRibbonAccent,
          {
            top: tone === "pricing" ? 112 : 90,
            left: "22%",
            backgroundColor: meshPalette[2],
            transform: [
              { rotate: "-10deg" },
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />

      {[0, 1, 2].map((index) => (
        <Animated.View
          key={`${tone}-ribbon-${index}`}
          style={[
            styles.marketingRibbon,
            {
              borderColor: linePalette[index],
              top: 12 + index * (tone === "panel" ? 34 : 58),
              left: -140 - index * 34,
              width: 620 + index * 120,
              height: 250 + index * 30,
              opacity: 0.95 - index * 0.16,
              transform: [
                { rotate: `${-10 + index * 2}deg` },
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 18 - index * 4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {[0, 1, 2, 3].map((index) => (
        <Animated.View
          key={`${tone}-topo-${index}`}
          style={[
            styles.topographyLine,
            {
              top: tone === "panel" ? 42 + index * 18 : 86 + index * 20,
              right: -60,
              width: 360 + index * 20,
              borderColor: "rgba(207, 236, 255, 0.05)",
              opacity: 0.7 - index * 0.1,
              transform: [
                { rotate: `${-7 + index}deg` },
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8 + index * 2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.speedStreak,
          {
            top: tone === "panel" ? 26 : 42,
            right: tone === "pricing" ? 38 : 56,
            opacity: 0.12 * streakOpacity,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.speedStreakSecondary,
          {
            top: tone === "panel" ? 46 : 66,
            right: tone === "pricing" ? 16 : 30,
            opacity: 0.08 * streakOpacity,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 18],
                }),
              },
            ],
          },
        ]}
      />

      {tone === "cta" ? (
        <View style={styles.finishTextureWrap}>
          <View style={styles.finishTextureGrid}>
            {Array.from({ length: 12 }).map((_, index) => (
              <View
                key={`finish-${index}`}
                style={[
                  styles.finishTextureCell,
                  index % 2 === 0 ? styles.finishTextureCellLight : styles.finishTextureCellDark,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function RunnerEmptyState({
  title,
  body,
  icon = "footsteps-outline",
}: {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(15, 27, 45, 0.88)",
        borderRadius: 26,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.12)",
        padding: 20,
        overflow: "hidden",
      }}
    >
      <RunningSurfaceAccent variant="road" />
      <View
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
        style={{
          width: 54,
          height: 54,
          borderRadius: 20,
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={24} color="#dff7ff" />
      </View>
      <Text style={{ color: "#f8fbff", fontSize: 20, fontWeight: "800", lineHeight: 26, marginTop: 14 }}>{title}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8 }}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
  },
  secondaryOrb: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
  },
  trackBackdropWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 620,
    overflow: "hidden",
  },
  trackGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
  },
  trackGlowSecondary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  trackLane: {
    position: "absolute",
    borderWidth: 1.25,
    borderRadius: 999,
  },
  ambientBackdropWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 860,
    overflow: "hidden",
  },
  glowBackgroundWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glowLayerLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  glowLayerMedium: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  glowLayerSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
  },
  ambientBlobLarge: {
    position: "absolute",
    width: 340,
    height: 280,
    borderRadius: 999,
  },
  ambientBlobMedium: {
    position: "absolute",
    width: 280,
    height: 230,
    borderRadius: 999,
  },
  ambientBlobSmall: {
    position: "absolute",
    width: 180,
    height: 150,
    borderRadius: 999,
  },
  appAmbientWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1400,
    overflow: "hidden",
  },
  appMeshPrimary: {
    position: "absolute",
    top: -120,
    right: -180,
    width: 620,
    height: 240,
    borderRadius: 220,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
  },
  appMeshSecondary: {
    position: "absolute",
    top: 300,
    left: -150,
    width: 520,
    height: 210,
    borderRadius: 220,
    backgroundColor: "rgba(45, 212, 191, 0.075)",
  },
  appMeshAccent: {
    position: "absolute",
    bottom: 220,
    right: -100,
    width: 420,
    height: 180,
    borderRadius: 220,
    backgroundColor: "rgba(139, 92, 246, 0.065)",
  },
  appCenterGlow: {
    position: "absolute",
    top: 180,
    left: "18%",
    width: 320,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(103, 232, 249, 0.08)",
  },
  appRibbon: {
    position: "absolute",
    borderWidth: 1.1,
    borderRadius: 999,
    borderColor: "rgba(103, 232, 249, 0.18)",
  },
  appContourLine: {
    position: "absolute",
    height: 120,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  appRouteLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(188, 230, 255, 0.92)",
  },
  appEdgeGlow: {
    position: "absolute",
    left: -140,
    right: -140,
    height: 220,
    borderRadius: 240,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  appEdgeGlowTop: {
    top: -170,
  },
  appEdgeGlowBottom: {
    bottom: -170,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  appStreak: {
    position: "absolute",
    width: 150,
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(219, 243, 255, 0.95)",
  },
  appStreakSecondary: {
    position: "absolute",
    width: 96,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: "rgba(188, 230, 255, 0.85)",
  },
  appStreakTertiary: {
    position: "absolute",
    width: 126,
    height: 1,
    borderRadius: 999,
    backgroundColor: "rgba(125, 211, 252, 0.75)",
  },
  marketingBackdropWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 880,
    overflow: "hidden",
  },
  meshRibbonPrimary: {
    position: "absolute",
    width: 420,
    height: 260,
    borderRadius: 999,
  },
  meshRibbonSecondary: {
    position: "absolute",
    width: 380,
    height: 240,
    borderRadius: 999,
  },
  meshRibbonAccent: {
    position: "absolute",
    width: 210,
    height: 150,
    borderRadius: 999,
  },
  marketingRibbon: {
    position: "absolute",
    borderWidth: 1.2,
    borderRadius: 999,
  },
  topographyLine: {
    position: "absolute",
    height: 110,
    borderWidth: 1,
    borderRadius: 999,
  },
  speedStreak: {
    position: "absolute",
    width: 124,
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(219, 243, 255, 0.9)",
  },
  speedStreakSecondary: {
    position: "absolute",
    width: 92,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: "rgba(188, 230, 255, 0.85)",
  },
  finishTextureWrap: {
    position: "absolute",
    right: 40,
    bottom: 28,
    opacity: 0.12,
  },
  finishTextureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 60,
    gap: 0,
  },
  finishTextureCell: {
    width: 10,
    height: 10,
  },
  finishTextureCellLight: {
    backgroundColor: "rgba(226, 242, 255, 0.95)",
  },
  finishTextureCellDark: {
    backgroundColor: "rgba(8, 17, 29, 0.88)",
  },
  curve: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 1,
    opacity: 1,
  },
  trackLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
  },
  motionStreak: {
    position: "absolute",
    width: 84,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: "rgba(224, 242, 254, 0.9)",
  },
  finishWrap: {
    position: "absolute",
    top: 20,
    right: 20,
    alignItems: "flex-end",
  },
  finishPost: {
    position: "absolute",
    right: 2,
    top: 10,
    width: 2,
    height: 42,
    backgroundColor: "rgba(220, 236, 255, 0.55)",
  },
  finishFlag: {
    width: 30,
    height: 20,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(220, 236, 255, 0.16)",
  },
  checkRow: {
    flexDirection: "row",
  },
  check: {
    width: 7.5,
    height: 10,
  },
  checkDark: {
    backgroundColor: "rgba(8, 17, 29, 0.88)",
  },
  checkLight: {
    backgroundColor: "rgba(220, 236, 255, 0.85)",
  },
});
