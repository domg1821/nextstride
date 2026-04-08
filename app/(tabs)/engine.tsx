import { router } from "expo-router";
import { Text, View } from "react-native";
import { AmbientTrackBackdrop, GlowBackground, RunningSurfaceAccent, TrackLinesBackdrop } from "@/components/running-visuals";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { getSurfaceCardStyle, PageHeader } from "@/components/ui-kit";
import { FadeInView, InteractivePressable } from "@/components/ui-polish";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { useEngine } from "@/contexts/engine-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { type EngineCard, getEngineCards, getEngineOverview } from "@/lib/engine-insights";
import { useResponsiveLayout } from "@/lib/responsive";
import { ThemeTokens } from "@/constants/theme";

export default function EngineTab() {
  const { profile, displayName } = useProfile();
  const { workouts } = useWorkouts();
  const { engine } = useEngine();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const layout = useResponsiveLayout();
  const overview = getEngineOverview(engine, workouts);
  const cards = getEngineCards(engine, workouts, profile);

  return (
    <AnimatedTabScene tabKey="engine">
      <ScreenScroll colors={colors}>
        <TrackLinesBackdrop variant="track" style={{ top: 88, height: 320 }} />
        <AmbientTrackBackdrop variant="track" style={{ top: 360, height: 620 }} />
        <GlowBackground variant="track" style={{ top: 640, height: 260 }} />
        <TopProfileBar imageUri={profile.image} name={displayName} onAvatarPress={openDrawer} />

        <PageHeader
          eyebrow="Engine"
          title="How your body is shaping the training"
          subtitle="Sleep, heart rate, fueling, and recovery kept focused on one question: how do they affect your running right now?"
        />

        <FadeInView delay={40}>
          <View
            style={[
              getSurfaceCardStyle(colors, { tone: "accent", padding: ThemeTokens.spacing.ml }),
              { gap: ThemeTokens.spacing.m, overflow: "hidden" },
            ]}
          >
            <RunningSurfaceAccent variant="road" />
            <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>ENGINE STATUS</Text>
            <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.display.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.display.lineHeight, maxWidth: 720 }}>
              {overview.title}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.body.fontSize, lineHeight: ThemeTokens.typography.body.lineHeight, maxWidth: 720 }}>{overview.summary}</Text>
            <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12, flexWrap: "wrap" }}>
              <EngineStatusPill label="Status" value={overview.status === "good" ? "Supportive" : overview.status === "moderate" ? "Watch closely" : "Dial back"} emphasis />
              <EngineStatusPill label="Primary read" value={cards[0]?.title || "Recovery"} />
              <EngineStatusPill label="Focus" value="Train with the body, not against it" />
            </View>
            <Text style={{ color: getStatusColor(overview.status), fontSize: ThemeTokens.typography.small.fontSize, fontWeight: "700" }}>
              {overview.status === "good"
                ? "Your internal signals look supportive for normal training."
                : overview.status === "moderate"
                  ? "A few body signals are asking for a little more care."
                  : "The body is asking for a more conservative training read right now."}
            </Text>
          </View>
        </FadeInView>

        <View style={{ gap: ThemeTokens.spacing.s }}>
          <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 1 }}>PERFORMANCE FACTORS</Text>
          <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h2.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h2.lineHeight }}>The parts of recovery and readiness that matter most</Text>
          <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, lineHeight: 21 }}>
            Tap into each one for a clearer read and a small coaching adjustment.
          </Text>
        </View>

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", flexWrap: "wrap", gap: 14 }}>
          {cards.map((card) => (
            <EngineCardTile key={card.key} card={card} isPhone={layout.isPhone} isTablet={layout.isTablet} />
          ))}
        </View>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}

function EngineCardTile({
  card,
  isPhone,
  isTablet,
}: {
  card: EngineCard;
  isPhone: boolean;
  isTablet: boolean;
}) {
  const { colors } = useThemeColors();

  return (
    <InteractivePressable
      onPress={() => router.push(`/engine/${card.key}` as never)}
      scaleTo={0.97}
      style={{
        width: isPhone || isTablet ? "100%" : "48.2%",
        backgroundColor: card.status === "good" ? "#12243b" : "rgba(10, 21, 35, 0.84)",
        borderRadius: ThemeTokens.radii.xl,
        borderWidth: 1,
        borderColor: card.status === "attention" ? colors.danger : card.status === "moderate" ? colors.primary : "rgba(103, 232, 249, 0.16)",
        padding: ThemeTokens.spacing.ml,
        gap: ThemeTokens.spacing.ms,
        minHeight: 204,
        overflow: "hidden",
        ...ThemeTokens.shadows.medium,
      }}
    >
      <RunningSurfaceAccent variant={card.key === "heart-rate" ? "track" : card.key === "fueling" ? "race" : "road"} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: "#67e8f9", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 0.8 }}>{card.title.toUpperCase()}</Text>
          <Text style={{ color: colors.text, fontSize: ThemeTokens.typography.h2.fontSize, fontWeight: "800", lineHeight: ThemeTokens.typography.h2.lineHeight }}>{card.value}</Text>
          <Text style={{ color: getStatusColor(card.status), fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "700" }}>{card.label}</Text>
          {card.secondaryValue ? (
            <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, lineHeight: ThemeTokens.typography.small.lineHeight }}>{card.secondaryValue}</Text>
          ) : null}
        </View>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "rgba(15, 23, 42, 0.72)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.subtext, fontSize: 18, fontWeight: "700" }}>{">"}</Text>
        </View>
      </View>
      <Text style={{ color: colors.subtext, fontSize: ThemeTokens.typography.small.fontSize, lineHeight: 21, marginTop: "auto" }}>{card.impact}</Text>
    </InteractivePressable>
  );
}

function EngineStatusPill({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: emphasis ? "rgba(37, 99, 235, 0.18)" : "rgba(255,255,255,0.05)",
        borderRadius: ThemeTokens.radii.md,
        borderWidth: 1,
        borderColor: emphasis ? "rgba(103, 232, 249, 0.18)" : "rgba(148, 163, 184, 0.12)",
        paddingHorizontal: ThemeTokens.spacing.m,
        paddingVertical: ThemeTokens.spacing.ms,
        gap: 4,
      }}
    >
      <Text style={{ color: emphasis ? "#67e8f9" : "rgba(226, 232, 240, 0.72)", fontSize: ThemeTokens.typography.caption.fontSize, fontWeight: "800", letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#f8fbff", fontSize: ThemeTokens.typography.small.fontSize, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: EngineCard["status"]) {
  switch (status) {
    case "good":
      return "#4ade80";
    case "moderate":
      return "#67e8f9";
    default:
      return "#fbbf24";
  }
}
