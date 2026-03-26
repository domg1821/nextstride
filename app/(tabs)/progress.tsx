import { Text, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, StatCard } from "../components/ui-kit";
import { ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";

export default function Progress() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();

  const mileage = profile.mileage || "0";
  const goalEvent = profile.goalEvent || "Not set";
  const pr5k = profile.pr5k || "Not added yet";

  const totalMiles = workouts.reduce((sum, workout) => {
    const dist = parseFloat(workout.distance);
    return sum + (isNaN(dist) ? 0 : dist);
  }, 0);

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={profile.name} />

      <PageHeader
        eyebrow="Progress"
        title={`${totalMiles.toFixed(1)} miles logged`}
        subtitle="A clear view of your current volume, goal direction, and recent consistency."
      />

      <View style={{ flexDirection: "row", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <StatCard label="Weekly Goal" value={`${mileage} mi`} />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard label="Workouts" value={`${workouts.length}`} />
        </View>
      </View>

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Training Snapshot"
          subtitle="The essentials that shape your current plan."
        />

        <DataRow colors={colors} label="Goal Event" value={goalEvent} />
        <DataRow colors={colors} label="5K PR" value={pr5k} />
        <DataRow colors={colors} label="Total Miles" value={`${totalMiles.toFixed(1)} mi`} />
      </InfoCard>

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Recent Workouts"
          subtitle="Your latest sessions at a glance."
        />

        {workouts.length === 0 ? (
          <Text style={{ color: colors.subtext, marginTop: 14, fontSize: 14 }}>
            No workouts logged yet.
          </Text>
        ) : (
          workouts.slice(0, 3).map((workout, index) => (
            <View
              key={index}
              style={{
                marginTop: 14,
                paddingTop: index === 0 ? 0 : 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                {workout.type || "Workout"}
              </Text>
              <Text
                style={{
                  color: colors.subtext,
                  marginTop: 6,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {workout.distance} miles | {workout.time} | Effort {workout.effort}
              </Text>
            </View>
          ))
        )}
      </InfoCard>
    </ScreenScroll>
  );
}

function DataRow({
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
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}
