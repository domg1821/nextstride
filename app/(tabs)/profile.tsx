import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import { AmbientTrackBackdrop, GlowBackground, RunningSurfaceAccent } from "@/components/running-visuals";
import { getSurfaceCardStyle, InfoCard, PageHeader, PrimaryButton, StatCard } from "@/components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";
import { uploadProfileImage } from "@/lib/profile-image";
import { useWorkouts } from "@/contexts/workout-context";
import { useResponsiveLayout } from "@/lib/responsive";
import { ThemeTokens } from "@/constants/theme";

export default function Profile() {
  const { profile, setProfile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();

  const spinValue = useRef(new Animated.Value(0)).current;
  const gearScale = useRef(new Animated.Value(1)).current;
  const gearGlow = useRef(new Animated.Value(0)).current;
  const imageUploadInFlight = useRef(false);

  const pickImage = async () => {
    if (imageUploadInFlight.current) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      imageUploadInFlight.current = true;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          return;
        }

        const uploadedUrl = await uploadProfileImage(user.id, uri);
        setProfile({
          ...profile,
          image: uploadedUrl,
        });
      } catch (error) {
        console.warn("Unable to upload profile image:", error);
      } finally {
        imageUploadInFlight.current = false;
      }
    }
  };

  const openSettings = () => {
    spinValue.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(gearScale, {
          toValue: 0.92,
          friction: 7,
          tension: 180,
          useNativeDriver: true,
        }),
        Animated.spring(gearScale, {
          toValue: 1,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(gearGlow, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(gearGlow, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/settings");
    });
  };

  const handleGearPressIn = () => {
    Animated.parallel([
      Animated.spring(gearScale, {
        toValue: 0.96,
        friction: 7,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.timing(gearGlow, {
        toValue: 0.8,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleGearPressOut = () => {
    Animated.parallel([
      Animated.spring(gearScale, {
        toValue: 1,
        friction: 7,
        tension: 170,
        useNativeDriver: true,
      }),
      Animated.timing(gearGlow, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "220deg"],
  });

  const glowBorderColor = gearGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const glowBackgroundColor = gearGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, colors.cardAlt],
  });

  const totalMiles = workouts.reduce((sum, workout) => {
    const dist = parseFloat(workout.distance);
    return sum + (isNaN(dist) ? 0 : dist);
  }, 0);

  return (
    <AnimatedTabScene tabKey="profile">
      <ScreenScroll colors={colors}>
        <AmbientTrackBackdrop variant="road" style={{ top: 64, height: 860 }} />
        <View
          style={{
            flexDirection: layout.isPhone ? "column" : "row",
            justifyContent: "space-between",
            alignItems: layout.isPhone ? "flex-start" : "center",
            gap: 16,
          }}
        >
        <View style={{ flexDirection: layout.isCompact ? "column" : "row", alignItems: layout.isCompact ? "flex-start" : "center", flex: 1 }}>
          {profile.image ? (
            <Image
              source={{ uri: profile.image }}
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                borderWidth: 3,
                borderColor: colors.primary,
              }}
            />
          ) : (
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.card,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700" }}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
          )}

          <View style={{ marginLeft: layout.isCompact ? 0 : 16, marginTop: layout.isCompact ? 14 : 0, flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
              {profile.name || "Runner"}
            </Text>
            <Text style={{ color: colors.subtext, marginTop: 6, fontSize: 15 }}>
              {profile.goalEvent || "Goal event not set"}
            </Text>
            <Text style={{ color: colors.subtext, marginTop: 3, fontSize: 15 }}>
              {profile.mileage || "0"} mi/week
            </Text>
          </View>
        </View>

        <Pressable
          onPress={openSettings}
          onPressIn={handleGearPressIn}
          onPressOut={handleGearPressOut}
          style={{ borderRadius: 24 }}
        >
          <Animated.View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: glowBackgroundColor,
              borderWidth: 1,
              borderColor: glowBorderColor,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: gearScale }],
            }}
          >
            <Animated.Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: "700",
                transform: [{ rotate: spin }],
              }}
            >
              *
            </Animated.Text>
          </Animated.View>
        </Pressable>
        </View>

        <PageHeader
          eyebrow="Profile"
          title="Your running identity"
          subtitle="A focused place for your photo, stats, and quick links into the rest of the app."
        />

        <View
          style={[
            getSurfaceCardStyle(colors, { tone: "accent", padding: ThemeTokens.spacing.ml }),
            { gap: ThemeTokens.spacing.m, overflow: "hidden" },
          ]}
        >
          <GlowBackground variant="road" />
          <RunningSurfaceAccent variant="road" />
          <View style={{ gap: 8 }}>
            <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>
              PROFILE OVERVIEW
            </Text>
            <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h2.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h2.lineHeight }}>
              Keep your runner identity and key links in one place
            </Text>
            <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight }}>
              Update your photo, jump to settings, and keep your most useful profile tools close.
            </Text>
          </View>
          <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Upload Profile Picture" onPress={pickImage} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Open Settings" onPress={openSettings} />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <StatCard label="Workouts" value={`${workouts.length}`} />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard label="Miles" value={totalMiles.toFixed(1)} />
        </View>
        </View>

        <InfoCard>
          <SectionTitle
            colors={colors}
            title="Quick links"
            subtitle="Jump into the places you are most likely to revisit."
          />

          <View style={{ marginTop: 16, gap: 12 }}>
            <RouteCard
              title="Activity Feed"
              subtitle="View your recent runs in a cleaner feed-style history."
              onPress={() => router.push("/activities")}
            />

            <RouteCard
              title="Statistics"
              subtitle="See mileage totals, benchmarks, and training trends."
              onPress={() => router.push("/statistics")}
            />

            <RouteCard
              title="Goals"
              subtitle="Track race countdowns, target times, and simple on-track guidance."
              onPress={() => router.push("/goals")}
            />

            <RouteCard
              title="Gear"
              subtitle="Track shoe mileage and keep your running rotation organized."
              onPress={() => router.push("/gear")}
            />

            <RouteCard
              title="Race Predictor"
              subtitle="Estimate current race fitness from recent training, effort, mileage, and saved PRs."
              onPress={() => router.push("/race-predictor")}
            />
          </View>
        </InfoCard>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function RouteCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "rgba(10, 21, 35, 0.82)",
        borderRadius: ThemeTokens.radii.lg,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        padding: ThemeTokens.spacing.m,
        gap: ThemeTokens.spacing.s,
        opacity: pressed ? 0.96 : 1,
        transform: [{ scale: pressed ? 0.988 : 1 }, { translateY: pressed ? 1 : 0 }],
      })}
    >
      <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h3.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h3.lineHeight }}>
        {title}
      </Text>
      <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight }}>
        {subtitle}
      </Text>
      <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
        Open
      </Text>
    </Pressable>
  );
}
