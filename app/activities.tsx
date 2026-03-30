import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getWeeklyGoalProgress } from "@/utils/training-insights";
import { formatFeedDate, getWorkoutPace } from "@/utils/workout-utils";

export default function Activities() {
  const { workouts, shoes } = useWorkouts();
  const { colors } = useThemeColors();
  const recentWorkout = workouts[0];
  const weeklyProgress = getWeeklyGoalProgress(workouts, 30);

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Activity Feed"
        title={workouts.length === 0 ? "No runs yet" : "Your recent training feed"}
        subtitle="A scrollable feed of completed workouts with distance, time, effort, notes, and simple social-style placeholders."
      />

      {workouts.length === 0 ? (
        <InfoCard
          title="Nothing in the feed yet"
          subtitle="Log a workout or complete a planned session and it will show up here as part of your running history."
        />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FeedHighlight colors={colors} label="Logged" value={`${workouts.length}`} helper="Total activities" />
            </View>
            <View style={{ flex: 1 }}>
              <FeedHighlight
                colors={colors}
                label="This Week"
                value={`${weeklyProgress.currentMiles.toFixed(1)} mi`}
                helper={`${Math.round(weeklyProgress.progressPercent)}% of 30 mi`}
              />
            </View>
          </View>

          <InfoCard>
            <SectionTitle
              colors={colors}
              title="Latest activity"
              subtitle="Your most recent completed workout stays pinned at the top."
            />

            {recentWorkout ? (
              <FeaturedFeedCard
                colors={colors}
                workout={recentWorkout}
                shoeName={shoes.find((shoe) => shoe.id === recentWorkout.shoeId)?.name}
              />
            ) : null}
          </InfoCard>

          <View style={{ gap: 14 }}>
            {workouts.slice(1).map((workout) => (
              <FeedCard
                key={workout.id}
                colors={colors}
                workout={workout}
                shoeName={shoes.find((shoe) => shoe.id === workout.shoeId)?.name}
              />
            ))}
          </View>
        </>
      )}
    </ScreenScroll>
  );
}

function FeedHighlight({
  colors,
  label,
  value,
  helper,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 }}>{value}</Text>
      <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }}>{helper}</Text>
    </View>
  );
}

function FeaturedFeedCard({
  colors,
  workout,
  shoeName,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  workout: ReturnType<typeof useWorkouts>["workouts"][number];
  shoeName?: string;
}) {
  const pace = getWorkoutPace(workout.distance, workout.time);

  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: colors.cardAlt,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 0.9 }}>
            JUST FINISHED
          </Text>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 }}>
            {workout.type || "Workout"}
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, marginTop: 8 }}>
            {formatFeedDate(workout.date)}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{workout.distance} mi</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <FeedMetric colors={colors} label="Time" value={workout.time || "Logged"} />
        <FeedMetric colors={colors} label="Pace" value={pace ?? "N/A"} />
        <FeedMetric colors={colors} label="Effort" value={`${workout.effort.toFixed(1)}/10`} />
      </View>

      {shoeName ? (
        <Text style={{ color: colors.subtext, fontSize: 13 }}>In rotation: {shoeName}</Text>
      ) : null}

      {workout.notes ? (
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>{workout.notes}</Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <SocialPill colors={colors} label="Heart" value="0" />
        <SocialPill colors={colors} label="Comment" value="0" />
        <SocialPill colors={colors} label="Share" value="0" />
      </View>
    </View>
  );
}

function FeedCard({
  colors,
  workout,
  shoeName,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  workout: ReturnType<typeof useWorkouts>["workouts"][number];
  shoeName?: string;
}) {
  const pace = getWorkoutPace(workout.distance, workout.time);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: colors.primary,
              marginTop: 6,
            }}
          />
          <View style={{ width: 2, flex: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ flex: 1, gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                {workout.type || "Workout"}
              </Text>
              <Text style={{ color: colors.subtext, marginTop: 6, fontSize: 14 }}>
                {formatFeedDate(workout.date)}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                {workout.distance} mi
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <FeedMetric colors={colors} label="Time" value={workout.time || "Logged"} />
            <FeedMetric colors={colors} label="Pace" value={pace ?? "N/A"} />
            <FeedMetric colors={colors} label="Effort" value={`${workout.effort.toFixed(1)}/10`} />
          </View>

          {shoeName ? (
            <Text style={{ color: colors.subtext, fontSize: 13 }}>Shoe: {shoeName}</Text>
          ) : null}

          {workout.notes ? (
            <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>{workout.notes}</Text>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <SocialPill colors={colors} label="Heart" value="0" />
            <SocialPill colors={colors} label="Comment" value="0" />
          </View>
        </View>
      </View>
    </View>
  );
}

function FeedMetric({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        minWidth: "30%",
        backgroundColor: colors.cardAlt,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function SocialPill({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
        {label} {value}
      </Text>
    </View>
  );
}
