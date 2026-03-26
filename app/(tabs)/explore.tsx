import { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, StatCard } from "../components/ui-kit";
import { ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { PlanDay, buildWeeklyPlan } from "../training-plan";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Plan() {
  const { profile, heartRateZones } = useProfile();
  const {
    likedWorkoutCategories,
    toggleLikedWorkout,
    isWorkoutLiked,
    completedWorkoutIds,
    completePlannedWorkout,
    isWorkoutCompleted,
    planCycle,
    advancePlanWeek,
  } = useWorkouts();
  const { colors } = useThemeColors();
  const mileage = parseFloat(profile.mileage) || 30;

  const weekPlan = buildWeeklyPlan(
    profile.goalEvent || "",
    mileage,
    profile.pr5k || "",
    likedWorkoutCategories,
    planCycle
  );

  const visibleWeekPlan = weekPlan.filter((day) => !isWorkoutCompleted(day.id));

  const handleComplete = (day: PlanDay) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    completePlannedWorkout(day);

    if (day.day === "Sunday") {
      advancePlanWeek();
      return;
    }
  };

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={profile.name} />

      <PageHeader
        eyebrow="Weekly Plan"
        title={profile.goalEvent || "Build Your Block"}
        subtitle={`A structured seven-day view built around ${mileage} miles per week.`}
      />

      <StatCard label="Target Volume" value={`${mileage} mi`} helper="This week" />

      <SectionTitle
        colors={colors}
        title="This Week"
        subtitle="Two quality touches, one long run, and clear recovery space."
      />

      {visibleWeekPlan.map((day, index) => (
        <PlanWorkoutCard
          key={day.id}
          day={day}
          index={index}
          colors={colors}
          heartRateZones={heartRateZones}
          isLiked={isWorkoutLiked(day.id)}
          completedCount={completedWorkoutIds.length}
          onToggleLike={() => toggleLikedWorkout(day.id, day.category)}
          onComplete={handleComplete}
        />
      ))}
    </ScreenScroll>
  );
}

function PlanWorkoutCard({
  day,
  index,
  colors,
  heartRateZones,
  isLiked,
  completedCount,
  onToggleLike,
  onComplete,
}: {
  day: PlanDay;
  index: number;
  colors: ReturnType<typeof useThemeColors>["colors"];
  heartRateZones: ReturnType<typeof useProfile>["heartRateZones"];
  isLiked: boolean;
  completedCount: number;
  onToggleLike: () => void;
  onComplete: (day: PlanDay) => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isCompleting, setIsCompleting] = useState(false);
  const heartRateGuidance = getHeartRateGuidance(day, heartRateZones);
  const fuelingTips = getFuelingSuggestions(day.category);

  useEffect(() => {
    opacity.setValue(1);
    translateY.setValue(0);
    setIsCompleting(false);
  }, [completedCount, day.id, opacity, translateY]);

  const handleCompletePress = () => {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -8,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete(day);
    });
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <InfoCard>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {day.day || day.title || `Day ${index + 1}`}
            </Text>
            <Text
              style={{
                color: colors.primary,
                fontSize: 13,
                fontWeight: "700",
                marginTop: 6,
                textTransform: "uppercase",
              }}
            >
              {day.title || "Session"}
            </Text>
            <Text
              style={{
                color: colors.subtext,
                marginTop: 10,
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {day.details || "Session details will appear here."}
            </Text>

            <View
              style={{
                marginTop: 14,
                backgroundColor: colors.cardAlt,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                gap: 8,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
                {heartRateGuidance}
              </Text>
              {fuelingTips.map((tip) => (
                <Text key={tip} style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                  {`\u2022 ${tip}`}
                </Text>
              ))}
            </View>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>{day.distance} mi</Text>
            </View>

            <View style={{ alignItems: "flex-end", gap: 8 }}>
              <Pressable
                onPress={onToggleLike}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: isLiked ? colors.primary : colors.border,
                  backgroundColor: isLiked ? colors.primary : colors.cardAlt,
                }}
              >
                <Text
                  style={{
                    color: isLiked ? colors.background : colors.subtext,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {isLiked ? "Liked" : "Like"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCompletePress}
                disabled={isCompleting}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.cardAlt,
                  opacity: isCompleting ? 0.65 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Complete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </InfoCard>
    </Animated.View>
  );
}

function getHeartRateGuidance(
  day: PlanDay,
  heartRateZones: ReturnType<typeof useProfile>["heartRateZones"]
) {
  if (day.category === "rest") {
    return "Target HR: No specific target on rest day";
  }

  if (heartRateZones.length === 0) {
    return "Target HR: Add age in Settings to calculate zones";
  }

  const zone1 = heartRateZones.find((zone) => zone.name === "Zone 1");
  const zone2 = heartRateZones.find((zone) => zone.name === "Zone 2");
  const zone3 = heartRateZones.find((zone) => zone.name === "Zone 3");
  const zone4 = heartRateZones.find((zone) => zone.name === "Zone 4");
  const zone5 = heartRateZones.find((zone) => zone.name === "Zone 5");

  switch (day.category) {
    case "easy":
      return zone2
        ? `Target HR: ${zone2.min}-${zone2.max} bpm (${zone2.name})`
        : "Target HR: Zone 2";
    case "recovery":
      return zone1 && zone2
        ? `Target HR: ${zone1.min}-${zone2.max} bpm (Zone 1-2)`
        : "Target HR: Zone 1-2";
    case "threshold":
      return zone3 && zone4
        ? `Target HR: ${zone3.min}-${zone4.max} bpm (Zone 3-4)`
        : "Target HR: Zone 3-4";
    case "intervals":
      return zone4 && zone5
        ? `Target HR: ${zone4.min}-${zone5.max} bpm (Zone 4-5)`
        : "Target HR: Zone 4-5";
    case "steady":
      return zone2 && zone3
        ? `Target HR: ${zone2.min}-${zone3.max} bpm (Zone 2-3)`
        : "Target HR: Zone 2-3";
    case "long":
      return zone2
        ? `Target HR: ${zone2.min}-${zone2.max} bpm (${zone2.name})`
        : "Target HR: Zone 2";
  }
}

function getFuelingSuggestions(category: PlanDay["category"]) {
  switch (category) {
    case "easy":
    case "recovery":
    case "rest":
      return ["Focus on balanced meals, no special fueling needed."];
    case "threshold":
    case "steady":
      return ["Moderate carbs before run.", "Light recovery meal after."];
    case "intervals":
      return ["Carb-focused pre-run fuel.", "Protein + carbs after workout."];
    case "long":
      return [
        "Carb load before run.",
        "Consider mid-run fueling (gels, electrolytes).",
        "Recovery meal within 30-60 minutes.",
      ];
  }
}
