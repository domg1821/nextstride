import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useWorkouts } from "./workout-context";

export default function Activities() {
  const { workouts } = useWorkouts();

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#0f172a",
      }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#3b82f6", marginBottom: 20 }}>← Back</Text>
      </Pressable>

      <Text style={{ color: "white", fontSize: 26, fontWeight: "bold" }}>
        Activities
      </Text>

      {workouts.length === 0 ? (
        <View
          style={{
            marginTop: 20,
            backgroundColor: "#1e293b",
            padding: 18,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "#94a3b8" }}>No activities logged yet.</Text>
        </View>
      ) : (
        workouts.map((workout, index) => (
          <View
            key={index}
            style={{
              marginTop: 14,
              backgroundColor: "#1e293b",
              padding: 18,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
              {workout.type || "Workout"}
            </Text>
            <Text style={{ color: "#94a3b8", marginTop: 6 }}>
              {workout.distance} miles • {workout.time}
            </Text>
            <Text style={{ color: "#94a3b8", marginTop: 4 }}>
              Effort: {workout.effort}
            </Text>
            {!!workout.splits && (
              <Text style={{ color: "#94a3b8", marginTop: 4 }}>
                Splits: {workout.splits}
              </Text>
            )}
            {!!workout.notes && (
              <Text style={{ color: "#94a3b8", marginTop: 4 }}>
                Notes: {workout.notes}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}