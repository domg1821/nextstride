import { Text, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { useResponsiveLayout } from "@/lib/responsive";
import {
  formatPersonalRecordDate,
  getPersonalRecordSnapshots,
  getRaceCountdownSummary,
  getRetentionStreakSummary,
} from "@/lib/runner-retention";

export function PersonalRecordsCard() {
  const { colors } = useThemeColors();
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const layout = useResponsiveLayout();
  const records = getPersonalRecordSnapshots(profile, workouts);
  const streak = getRetentionStreakSummary(workouts);
  const countdown = getRaceCountdownSummary(profile, workouts);

  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>PERSONAL RECORDS</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 }}>Best marks that stay visible</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
              Saved PRs and recent best efforts make progress feel concrete even before your trend data gets deep.
            </Text>
          </View>

          <View
            style={{
              minWidth: 100,
              backgroundColor: colors.cardAlt,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>STREAK</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 4 }}>{streak.current}</Text>
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "700" }}>{streak.best} best</Text>
          </View>
        </View>

        {records.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.cardAlt,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Add recent race marks in your profile or log qualifying runs to start building a clearer PR history.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {records.map((record) => (
              <View
                key={record.eventKey}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{record.label}</Text>
                  {record.badge ? (
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: "rgba(74, 222, 128, 0.14)",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: "#4ade80", fontSize: 11, fontWeight: "800" }}>{record.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800" }}>{record.time}</Text>
                <Text style={{ color: colors.subtext, fontSize: 13 }}>
                  {record.recentDate ? `Matched from a logged effort on ${formatPersonalRecordDate(record.recentDate)}` : "Saved to your training profile"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 14 }}>
        <MiniProgressCard
          title="Race countdown"
          value={countdown.countdownLabel}
          detail={countdown.status === "none" ? countdown.detail : countdown.progressLabel}
          colors={colors}
        />
        <MiniProgressCard
          title="Goal progress"
          value={countdown.status === "none" ? "Set a goal" : countdown.event}
          detail={countdown.detail}
          colors={colors}
        />
      </View>
    </View>
  );
}

function MiniProgressCard({
  title,
  value,
  detail,
  colors,
}: {
  title: string;
  value: string;
  detail: string;
  colors: ReturnType<typeof useThemeColors>["colors"];
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 8,
      }}
    >
      <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>{title.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", lineHeight: 26 }}>{value}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>{detail}</Text>
    </View>
  );
}
