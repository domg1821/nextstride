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
  const { profile } = useProfile();
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
  isLiked,
  completedCount,
  onToggleLike,
  onComplete,
}: {
  day: PlanDay;
  index: number;
  colors: ReturnType<typeof useThemeColors>["colors"];
  isLiked: boolean;
  completedCount: number;
  onToggleLike: () => void;
  onComplete: (day: PlanDay) => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isCompleting, setIsCompleting] = useState(false);

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
