import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import { InfoCard, PageHeader, PrimaryButton, StatCard } from "../components/ui-kit";
import { ScreenScroll } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";

export default function Profile() {
  const { profile, setProfile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();

  const spinValue = useRef(new Animated.Value(0)).current;
  const gearScale = useRef(new Animated.Value(1)).current;
  const gearGlow = useRef(new Animated.Value(0)).current;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfile({
        ...profile,
        image: uri,
      });
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
    <ScreenScroll colors={colors}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
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

          <View style={{ marginLeft: 16, flex: 1 }}>
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

      <PrimaryButton label="Upload Profile Picture" onPress={pickImage} />

      <View style={{ flexDirection: "row", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <StatCard label="Workouts" value={`${workouts.length}`} />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard label="Miles" value={totalMiles.toFixed(1)} />
        </View>
      </View>

      <RouteCard
        title="Activities"
        subtitle="View your recent workouts and logged sessions."
        onPress={() => router.push("/activities")}
      />

      <RouteCard
        title="Statistics"
        subtitle="See mileage totals, benchmarks, and training trends."
        onPress={() => router.push("/statistics")}
      />
    </ScreenScroll>
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
    <Pressable onPress={onPress}>
      <InfoCard title={title} subtitle={subtitle}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
          Open
        </Text>
      </InfoCard>
    </Pressable>
  );
}
