import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ConditionTrainingCard } from "@/components/condition-training-card";
import { ThemeTokens } from "@/constants/theme";
import { GlowBackground, RunningSurfaceAccent } from "@/components/running-visuals";
import { WorkoutEffortChip } from "@/components/workout-effort-chip";
import { AnimatedNumber, AnimatedProgressBar, FadeInView, FloatingModalCard, InteractivePressable } from "@/components/ui-polish";
import { useEngine } from "@/contexts/engine-context";
import { getFuelingStrategyForWorkout } from "@/lib/fueling-guidance";
import { getRecoveryFuelingConnection, getUnifiedRecoveryState, getWorkoutAdjustment, getWorkoutStructure } from "@/lib/recovery-engine";
import type { PlanDay } from "@/lib/training-plan";
import {
  getTodayWorkout,
  getWorkoutGuidance,
  getWorkoutTypeLabel,
  getWorkoutWhyItMatters,
} from "@/lib/today-workout";
import type { HeartRateZone } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { PrimaryButton, SecondaryButton, getSurfaceCardStyle } from "@/components/ui-kit";
import { useResponsiveLayout } from "@/lib/responsive";

export function TodayWorkoutCard({
  plan,
  completedWorkoutIds,
  heartRateZones,
}: {
  plan: PlanDay[];
  completedWorkoutIds: string[];
  heartRateZones: HeartRateZone[];
}) {
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();
  const { engine } = useEngine();
  const { workouts } = useWorkouts();
  const [activeDetail, setActiveDetail] = useState<"fueling" | "structure" | "conditions" | "recovery" | null>(null);
  const today = getTodayWorkout(plan, completedWorkoutIds);
  const workout = today.workout;
  const guidance = getWorkoutGuidance(workout, heartRateZones);
  const typeLabel = getWorkoutTypeLabel(workout);
  const whyItMatters = getWorkoutWhyItMatters(workout);
  const fueling = getFuelingStrategyForWorkout(workout);
  const recovery = getUnifiedRecoveryState(engine, workouts);
  const adjustment = getWorkoutAdjustment(workout, recovery);
  const structure = getWorkoutStructure(workout, recovery);
  const recoveryFueling = getRecoveryFuelingConnection(workout, recovery);
  const accent = getWorkoutAccent(workout?.category);
  const buttonLabel =
    today.state === "completed"
      ? "View Details"
      : today.state === "none"
        ? "Open Plan"
        : today.state === "rest"
          ? "View Recovery"
          : "Start Workout";
  const statusLabel =
    today.state === "completed"
      ? "Completed"
      : today.state === "rest"
        ? "Recovery Day"
        : today.state === "none"
          ? "Open Day"
          : "Ready to Run";

  const dayProgress =
    today.state === "completed" ? 100 : today.state === "rest" ? 40 : today.state === "none" ? 18 : 72;
  const readinessSummary =
    today.state === "completed"
      ? "Session logged. Let the rest of the day stay calm."
      : today.state === "rest"
        ? "Recovery is the win today. Keep the load low."
        : today.state === "none"
          ? "No workout is scheduled. Open the plan or log what you did."
          : adjustment.adjustmentRecommended
            ? adjustment.reason
            : `${recovery.title} readiness. ${guidance.shortDescription}`;

  return (
    <FadeInView delay={40}>
      <>
      <View
        style={{
          backgroundColor: colors.cardAlt,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: `${accent}52`,
          padding: layout.isPhone ? 20 : 24,
          gap: 18,
          shadowColor: accent,
          shadowOpacity: today.state === "completed" ? 0.1 : 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          opacity: today.state === "completed" ? 0.88 : 1,
          overflow: "hidden",
        }}
      >
        <GlowBackground variant={today.state === "completed" ? "race" : workout?.category === "intervals" ? "track" : "road"} />
        <RunningSurfaceAccent variant={today.state === "completed" ? "race" : workout?.category === "intervals" ? "track" : "road"} />
        <View
          style={{
            position: "absolute",
            top: -34,
            right: -16,
            width: 170,
            height: 170,
            borderRadius: 999,
            backgroundColor: `${accent}18`,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 18,
            right: 18,
            height: 2,
            borderRadius: 999,
            backgroundColor: `${accent}55`,
          }}
        />

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>TODAY&apos;S WORKOUT</Text>
            <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginTop: 10 }}>
              {workout?.title || "No workout scheduled for today"}
            </Text>
            <Text style={{ color: "#f8fbff", fontSize: layout.isPhone ? 28 : 34, fontWeight: "800", lineHeight: layout.isPhone ? 34 : 40, marginTop: 10, letterSpacing: -0.4 }}>
              {typeLabel}
            </Text>
            <Text style={{ color: "#b8cae0", fontSize: 15, lineHeight: 22, marginTop: 10 }}>
              {workout?.details || "Take the day as it comes, or open your plan to look ahead at the rest of the week."}
            </Text>
          </View>

          <View
            style={{
              minWidth: layout.isPhone ? "100%" : 118,
              alignSelf: layout.isPhone ? "stretch" : "auto",
              backgroundColor: "rgba(8, 17, 29, 0.66)",
              borderRadius: ThemeTokens.radii.lg,
              borderWidth: 1,
              borderColor: `${accent}33`,
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 8,
            }}
          >
            <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "700", textAlign: "center" }}>STATUS</Text>
            <Text style={{ color: "#f8fbff", fontSize: 20, fontWeight: "800", textAlign: "center" }}>{statusLabel}</Text>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "700", textAlign: "center" }}>{guidance.effortLabel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
          <WorkoutStatTile label="Effort" value={guidance.effortRange} detail={guidance.effortLabel} accent={accent} />
          <WorkoutStatTile label="Pace" value={guidance.paceGuidance} detail={guidance.heartRateGuidance || "Effort-led guidance"} />
          <WorkoutStatTile label="Readiness" value={`${dayProgress}%`} detail={adjustment.title} wide />
        </View>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <WorkoutTag label={workout?.category?.toUpperCase() || "OPEN"} accent={accent} />
          <WorkoutEffortChip guidance={guidance.effortGuidance} />
          <WorkoutTag label={whyItMatters} subtle={true} />
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
              DAY READINESS
            </Text>
            <AnimatedNumber value={dayProgress} suffix="%" style={{ color: accent, fontSize: 12, fontWeight: "800" }} />
          </View>
          <AnimatedProgressBar
            progress={dayProgress}
            fillColor={accent}
            trackColor="rgba(255,255,255,0.08)"
            height={8}
            emphasize
          />
        </View>

        <View
          style={{
            backgroundColor: "rgba(8, 17, 29, 0.62)",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: today.state === "completed" ? "rgba(103, 232, 249, 0.28)" : `${accent}2d`,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
            TODAY&apos;S APPROACH
          </Text>
          <Text style={{ color: "#f8fbff", fontSize: 15, fontWeight: "700", lineHeight: 22 }}>
            {today.state === "completed"
              ? "Today is done."
              : today.state === "rest"
                ? "Keep today light."
                : today.state === "none"
                  ? "Nothing is scheduled today."
                  : "Run the purpose, not the ego."}
          </Text>
          <Text style={{ color: "#dcecff", fontSize: 14, lineHeight: 21 }}>
            {readinessSummary}
          </Text>

          <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={buttonLabel} onPress={() => router.push("/(solo)/explore")} emphasis />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                label={today.state === "completed" ? "View Week" : "View Details"}
                onPress={() => router.push(today.state === "completed" ? "/(solo)/progress" : "/(solo)/explore")}
              />
            </View>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
            QUICK DETAILS
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <WorkoutDetailLauncher
              label="Fueling"
              summary={fueling.quickNote}
              accent={accent}
              onPress={() => setActiveDetail("fueling")}
            />
            <WorkoutDetailLauncher
              label="Workout Structure"
              summary={`${structure.main.length} main blocks`}
              onPress={() => setActiveDetail("structure")}
            />
            <WorkoutDetailLauncher
              label="Condition Training"
              summary="Weather and treadmill adjustments"
              onPress={() => setActiveDetail("conditions")}
            />
            <WorkoutDetailLauncher
              label="Recovery Notes"
              summary={recovery.title}
              onPress={() => setActiveDetail("recovery")}
            />
          </View>
        </View>
      </View>
      <FloatingModalCard visible={Boolean(activeDetail)} onClose={() => setActiveDetail(null)}>
        <View
          style={[
            getSurfaceCardStyle(colors, { padding: ThemeTokens.spacing.ml, radius: ThemeTokens.radii.xl }),
            { maxHeight: "88%", gap: 14 },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {activeDetail === "fueling" ? (
              <DetailSheet title="Fueling" subtitle="Keep the main card clean, but keep the fueling read easy to open.">
                <DetailInfoBlock label="Before" body={fueling.before} accent={accent} />
                <DetailInfoBlock label="During" body={fueling.during} />
                <DetailInfoBlock label="After" body={fueling.after} />
                <DetailInfoBlock label="Recovery support" body={recoveryFueling} accent="#67e8f9" />
              </DetailSheet>
            ) : null}

            {activeDetail === "structure" ? (
              <DetailSheet title="Workout Structure" subtitle="Open the full workout flow only when you want the deeper execution read.">
                <WorkoutStructureBlock title="Warm-up" items={structure.warmup} accent={accent} />
                <WorkoutStructureBlock title="Main workout" items={structure.main} />
                <WorkoutStructureBlock title="Cooldown" items={structure.cooldown} />
                <WorkoutStructureBlock title="Post-run work" items={structure.postRun} accent={adjustment.skipExtras ? "#fbbf24" : "#67e8f9"} />
              </DetailSheet>
            ) : null}

            {activeDetail === "conditions" ? (
              <DetailSheet title="Condition Training" subtitle="Adjust the workout for real-world conditions without bloating the main card.">
                <ConditionTrainingCard workout={workout ? { category: workout.category, title: workout.title, details: workout.details } : null} />
              </DetailSheet>
            ) : null}

            {activeDetail === "recovery" ? (
              <DetailSheet title="Recovery Notes" subtitle="Use this space for the deeper coaching read, not the main hero.">
                <DetailInfoBlock label="How today should feel" body={guidance.shortDescription} accent={accent} />
                <DetailInfoBlock label="Recovery" body={`${recovery.title} readiness. ${recovery.explanation}.`} accent={recovery.status === "low" ? "#fbbf24" : "#67e8f9"} />
                {adjustment.adjustmentRecommended ? (
                  <>
                    <DetailInfoBlock label={adjustment.title} body={adjustment.reason} accent="#67e8f9" />
                    <DetailInfoBlock label="Pace adjustment" body={adjustment.paceAdjustment} />
                    <DetailInfoBlock label="Effort adjustment" body={adjustment.effortAdjustment} />
                  </>
                ) : null}
                <DetailInfoBlock label="Beginner tip" body={guidance.beginnerTip} />
                {today.state === "completed" && today.nextWorkout ? (
                  <DetailInfoBlock
                    label="Next up"
                    body={`Next: ${getWorkoutTypeLabel(today.nextWorkout)} ${today.nextWorkout.day.toLowerCase()}.`}
                    accent="#67e8f9"
                  />
                ) : null}
              </DetailSheet>
            ) : null}
          </ScrollView>
        </View>
      </FloatingModalCard>
      </>
    </FadeInView>
  );
}

function WorkoutStatTile({
  label,
  value,
  detail,
  accent,
  wide,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <View
      style={{
        flex: wide ? 1.3 : 1,
        backgroundColor: "rgba(8, 17, 29, 0.58)",
        borderRadius: ThemeTokens.radii.lg,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: accent || "#9fb5ce", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fbff", fontSize: wide ? 14 : 22, fontWeight: "800", lineHeight: wide ? 20 : 28 }}>
        {value}
      </Text>
      <Text style={{ color: "#a9bdd4", fontSize: 12, lineHeight: 17 }}>{detail}</Text>
    </View>
  );
}

function WorkoutStructureBlock({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ gap: 8 }}>
        {items.map((item) => (
          <View key={`${title}-${item}`} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: accent || "#67e8f9",
                marginTop: 7,
              }}
            />
            <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19, flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function WorkoutTag({
  label,
  accent,
  subtle,
}: {
  label: string;
  accent?: string;
  subtle?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: subtle ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.07)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: subtle ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
        paddingHorizontal: 12,
        paddingVertical: 9,
        maxWidth: "100%",
      }}
    >
      <Text style={{ color: accent || "#d9e9ff", fontSize: 12, fontWeight: "700", lineHeight: 16 }}>{label}</Text>
    </View>
  );
}

function WorkoutDetailLauncher({
  label,
  summary,
  onPress,
  accent,
}: {
  label: string;
  summary: string;
  onPress: () => void;
  accent?: string;
}) {
  return (
    <View style={{ width: "100%", maxWidth: 260, flexGrow: 1 }}>
      <InteractivePressable onPress={onPress}>
        <View
          style={{
            backgroundColor: "rgba(8, 17, 29, 0.56)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(148, 163, 184, 0.12)",
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 6,
          }}
        >
          <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
            {label.toUpperCase()}
          </Text>
          <Text style={{ color: "#f8fbff", fontSize: 14, fontWeight: "700", lineHeight: 19 }}>
            {summary}
          </Text>
          <Text style={{ color: "#9fb5ce", fontSize: 12, lineHeight: 17 }}>Open details</Text>
        </View>
      </InteractivePressable>
    </View>
  );
}

function DetailSheet({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
        WORKOUT DETAILS
      </Text>
      <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800", lineHeight: 34 }}>
        {title}
      </Text>
      <Text style={{ color: "#a9bdd4", fontSize: 14, lineHeight: 21 }}>
        {subtitle}
      </Text>
      {children}
    </View>
  );
}

function DetailInfoBlock({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(8, 17, 29, 0.6)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.12)",
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#dcecff", fontSize: 14, lineHeight: 21 }}>
        {body}
      </Text>
    </View>
  );
}

function getWorkoutAccent(category?: PlanDay["category"]) {
  switch (category) {
    case "intervals":
      return "#2563eb";
    case "threshold":
      return "#38bdf8";
    case "long":
      return "#4ade80";
    case "recovery":
      return "#22c55e";
    case "rest":
      return "#94a3b8";
    case "steady":
      return "#67e8f9";
    default:
      return "#93c5fd";
  }
}
