import { Text, View } from "react-native";
import { FadeInView, PulseView } from "@/components/ui-polish";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { useResponsiveLayout } from "@/lib/responsive";
import {
  getGoalProgressHighlights,
  getRaceCountdownSummary,
  getRetentionStreakSummary,
  getRetentionToneColor,
} from "@/lib/runner-retention";

export function RetentionHighlightsCard() {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const streak = getRetentionStreakSummary(workouts);
  const countdown = getRaceCountdownSummary(profile, workouts);
  const highlights = getGoalProgressHighlights(profile, workouts);

  return (
    <FadeInView delay={110}>
      <View
      style={{
        backgroundColor: "#12243b",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.16)",
        padding: 20,
        gap: 16,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -26,
          right: -18,
          width: 150,
          height: 150,
          borderRadius: 999,
          backgroundColor: "rgba(103, 232, 249, 0.08)",
        }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }}>RUNNER MOMENTUM</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 }}>Keep progress visible</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
            Small signals that keep training feeling real without turning the page into noise.
          </Text>
        </View>

        <PulseView scaleRange={[1, 1.02]}>
          <View
            style={{
              minWidth: 108,
              backgroundColor: "rgba(8, 17, 29, 0.62)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(103, 232, 249, 0.14)",
              paddingHorizontal: 14,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>CURRENT STREAK</Text>
            <Text style={{ color: "#f8fbff", fontSize: 26, fontWeight: "800", marginTop: 4 }}>{streak.current}</Text>
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "700", textAlign: "center" }}>{streak.best} day best</Text>
          </View>
        </PulseView>
      </View>

      <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
        <SummaryTile label="Streak" value={streak.label} detail={streak.detail} />
        <SummaryTile
          label="Race countdown"
          value={countdown.countdownLabel}
          detail={countdown.status === "none" ? countdown.progressLabel : `${countdown.event}${countdown.goalTime ? ` • Goal ${countdown.goalTime}` : ""}`}
          accent={countdown.status === "on-track" ? "#4ade80" : "#67e8f9"}
        />
      </View>

      <View
        style={{
          backgroundColor: "rgba(8, 17, 29, 0.62)",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "rgba(157, 178, 202, 0.12)",
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ color: "#9db2ca", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>CURRENT SIGNALS</Text>
        {highlights.map((highlight) => (
          <HighlightRow
            key={highlight.title}
            title={highlight.title}
            detail={highlight.detail}
            accent={getRetentionToneColor(highlight.tone)}
          />
        ))}
      </View>
      </View>
    </FadeInView>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(8, 17, 29, 0.62)",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.12)",
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: accent || "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#f8fbff", fontSize: 18, fontWeight: "800", lineHeight: 24 }}>{value}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 18 }}>{detail}</Text>
    </View>
  );
}

function HighlightRow({ title, detail, accent }: { title: string; detail: string; accent: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{title.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 20 }}>{detail}</Text>
    </View>
  );
}
