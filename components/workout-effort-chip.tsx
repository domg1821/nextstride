import { Text, View } from "react-native";
import type { WorkoutEffortGuidance } from "@/lib/workout-effort";

export function WorkoutEffortChip({
  guidance,
  compact,
}: {
  guidance: WorkoutEffortGuidance;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: `${guidance.accent}33`,
        paddingHorizontal: compact ? 10 : 12,
        paddingVertical: compact ? 7 : 8,
      }}
    >
      <Text style={{ color: guidance.accent, fontSize: compact ? 11 : 12, fontWeight: "800" }}>
        {`${guidance.label} ${guidance.effortRange}`}
      </Text>
    </View>
  );
}
