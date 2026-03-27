import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton, SecondaryButton, StatCard } from "../components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { PlanDay, buildAdaptiveWeeklyPlan } from "../training-plan";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EFFORT_OPTIONS = [
  { label: "Easy", value: 3 },
  { label: "Moderate", value: 5 },
  { label: "Hard", value: 7 },
  { label: "All-out", value: 9 },
];

export default function Plan() {
  const { profile, heartRateZones } = useProfile();
  const {
    workouts,
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

  const { plan: weekPlan, feedback: adaptationFeedback } = buildAdaptiveWeeklyPlan(
    profile.goalEvent || "",
    mileage,
    profile.pr5k || "",
    likedWorkoutCategories,
    planCycle,
    {
      workouts: workoutsToAdaptiveContext(workouts),
      completedWorkoutIds,
    }
  );

  const visibleWeekPlan = weekPlan.filter((day) => !isWorkoutCompleted(day.id));

  const handleComplete = (day: PlanDay, effort: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    completePlannedWorkout(day, effort);

    if (day.day === "Sunday") {
      advancePlanWeek();
    }
  };

  return (
    <AnimatedTabScene tabKey="explore">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={profile.name} />
        <PageHeader
          eyebrow="Weekly Plan"
          title={profile.goalEvent || "Build Your Block"}
          subtitle={`A structured seven-day view built around ${mileage} miles per week.`}
        />

        <View style={{ flexDirection: "row", gap: 12, alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <StatCard label="Target Volume" value={`${mileage} mi`} helper="This week" />
          </View>
          <View style={{ width: 140, justifyContent: "center" }}>
            <SecondaryButton label="Open Calendar" onPress={() => router.push("/calendar")} />
          </View>
        </View>

        <InfoCard>
        <SectionTitle
          colors={colors}
          title="Week Calendar"
          subtitle="See the whole week at a glance with completed days highlighted."
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {weekPlan.map((day) => {
            const completed = completedWorkoutIds.includes(day.id);

            return (
              <View
                key={day.id}
                style={{
                  width: "30.8%",
                  backgroundColor: completed ? colors.primarySoft : colors.cardAlt,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: completed ? colors.primary : colors.border,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
                  {day.day.slice(0, 3).toUpperCase()}
                </Text>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 8 }}>
                  {day.title}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }}>
                  {completed ? "Completed" : day.kind === "rest" ? "Planned rest" : "Planned"}
                </Text>
              </View>
            );
          })}
        </View>
        </InfoCard>

        <SectionTitle
          colors={colors}
          title="This Week"
          subtitle="Structured sessions first, with lightweight adjustments based on what you actually do."
        />

        {adaptationFeedback.length > 0 ? (
          <InfoCard>
            <SectionTitle
              colors={colors}
              title="Coach adjustments"
              subtitle="Simple rule-based changes to keep the week responsive."
            />
            <View style={{ marginTop: 14, gap: 10 }}>
              {adaptationFeedback.map((message) => (
                <View
                  key={message}
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 14,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{message}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        ) : null}

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
    </AnimatedTabScene>
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
  onComplete: (day: PlanDay, effort: number) => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isCompleting, setIsCompleting] = useState(false);
  const [showEffortPrompt, setShowEffortPrompt] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState(getDefaultEffort(day.category));
  const premiumPreview = getPremiumPreview(day, heartRateZones);

  useEffect(() => {
    opacity.setValue(1);
    translateY.setValue(0);
    setIsCompleting(false);
    setShowEffortPrompt(false);
    setSelectedEffort(getDefaultEffort(day.category));
  }, [completedCount, day.category, day.id, opacity, translateY]);

  const handlePromptConfirm = (effort: number) => {
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
      onComplete(day, effort);
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

            {day.adjustmentNote ? (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: colors.primarySoft,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
                  Coach note
                </Text>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                  {day.adjustmentNote}
                </Text>
              </View>
            ) : null}

            <PremiumLockedPanel
              colors={colors}
              title="Premium guidance"
              preview={premiumPreview}
            />
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
                onPress={() => setShowEffortPrompt(true)}
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

      <EffortPromptModal
        visible={showEffortPrompt}
        colors={colors}
        workoutTitle={day.title || "Workout"}
        selectedEffort={selectedEffort}
        onSelectEffort={setSelectedEffort}
        onCancel={() => setShowEffortPrompt(false)}
        onConfirm={() => {
          setShowEffortPrompt(false);
          handlePromptConfirm(selectedEffort);
        }}
      />
    </Animated.View>
  );
}

function workoutsToAdaptiveContext(workouts: ReturnType<typeof useWorkouts>["workouts"]) {
  return workouts.map((workout) => ({
    date: workout.date,
    effort: workout.effort,
    notes: workout.notes,
    distance: workout.distance,
  }));
}

function PremiumLockedPanel({
  colors,
  title,
  preview,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  title: string;
  preview: {
    badge: string;
    teaser: string;
    bullets: string[];
  };
}) {
  return (
    <View
      style={{
        marginTop: 14,
        backgroundColor: colors.cardAlt,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{title}</Text>
        <View
          style={{
            backgroundColor: colors.primarySoft,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>
            Premium Locked
          </Text>
        </View>
      </View>

      <View
        style={{
          gap: 8,
          paddingRight: 84,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
          {preview.badge}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>
          {preview.teaser}
        </Text>
        <View
          style={{
            gap: 7,
          }}
        >
          {preview.bullets.map((bullet) => (
            <Text key={bullet} style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
              {`\u2022 ${bullet}`}
            </Text>
          ))}
        </View>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: 38,
          backgroundColor: `${colors.card}F2`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: colors.border,
            maxWidth: 250,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "800",
              textAlign: "center",
              letterSpacing: 0.8,
            }}
          >
            LOCKED
          </Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "center" }}>
            Unlock heart rate guidance, fueling tips, and smarter training insight.
          </Text>
        </View>
      </View>
    </View>
  );
}

function EffortPromptModal({
  visible,
  colors,
  workoutTitle,
  selectedEffort,
  onSelectEffort,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  colors: ReturnType<typeof useThemeColors>["colors"];
  workoutTitle: string;
  selectedEffort: number;
  onSelectEffort: (effort: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(3, 8, 18, 0.66)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>
            COMPLETE WORKOUT
          </Text>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700", marginTop: 10 }}>
            How hard did {workoutTitle.toLowerCase()} feel?
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 10 }}>
            Pick an effort before the workout is marked complete and added to your history.
          </Text>

          <View style={{ gap: 10, marginTop: 20 }}>
            {EFFORT_OPTIONS.map((option) => {
              const active = selectedEffort === option.value;

              return (
                <Pressable
                  key={option.label}
                  onPress={() => onSelectEffort(option.value)}
                  style={{
                    backgroundColor: active ? colors.primarySoft : colors.cardAlt,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    padding: 14,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                    {option.label}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>
                    Effort {option.value}/10
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton label="Cancel" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Confirm" onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getDefaultEffort(category: PlanDay["category"]) {
  switch (category) {
    case "intervals":
      return 8;
    case "threshold":
      return 7;
    case "steady":
      return 6;
    case "long":
      return 6;
    case "easy":
      return 4;
    case "recovery":
      return 3;
    case "rest":
      return 1;
  }
}

function getPremiumPreview(
  day: PlanDay,
  heartRateZones: ReturnType<typeof useProfile>["heartRateZones"]
) {
  const heartRateReady = heartRateZones.length > 0;

  switch (day.category) {
    case "intervals":
      return {
        badge: "Requires Premium",
        teaser: "Unlock interval-specific heart rate targets and sharper fueling guidance for hard sessions.",
        bullets: [
          heartRateReady ? "Zone-based workout targets personalized to your profile." : "Add your heart rate setup to unlock personalized zone targets.",
          "Pre-workout carbs and post-session recovery suggestions.",
        ],
      };
    case "threshold":
    case "steady":
      return {
        badge: "Requires Premium",
        teaser: "Unlock guided threshold effort ranges and smarter steady-day fueling suggestions.",
        bullets: [
          heartRateReady ? "Tempo heart rate coaching matched to your saved zones." : "Set up heart rate in Settings to enable zone-based guidance.",
          "Simple pre-run and recovery nutrition support.",
        ],
      };
    case "long":
      return {
        badge: "Requires Premium",
        teaser: "Unlock long-run heart rate ranges and mid-run fueling recommendations.",
        bullets: [
          heartRateReady ? "Long-run effort targets built from your saved zones." : "Add your age or max heart rate to unlock long-run zone guidance.",
          "Carb timing, electrolytes, and recovery reminders.",
        ],
      };
    case "recovery":
    case "easy":
      return {
        badge: "Requires Premium",
        teaser: "Unlock easy-day heart rate guidance and simple fueling reminders.",
        bullets: [
          heartRateReady ? "Easy-run heart rate targets matched to your current zones." : "Add heart rate info in Settings to unlock personalized easy-day targets.",
          "Light fueling notes for recovery and aerobic days.",
        ],
      };
    case "rest":
      return {
        badge: "Requires Premium",
        teaser: "Unlock recovery-focused coaching and nutrition reminders between key workouts.",
        bullets: [
          "Gentle guidance for rest and reset days.",
          "Simple recovery fueling suggestions for the next session.",
        ],
      };
  }
}
