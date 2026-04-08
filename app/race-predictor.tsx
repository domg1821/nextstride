import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AdvancedRacePredictorCard } from "@/components/advanced-race-predictor-card";
import { FinishLineAccent, RunningSurfaceAccent } from "@/components/running-visuals";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { AnimatedProgressBar, FadeInView } from "@/components/ui-polish";
import { ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { usePremium } from "@/contexts/premium-context";
import { useProfile } from "@/contexts/profile-context";
import {
  getPredictionForEvent,
  getRacePredictions,
  listPredictorEvents,
  normalizePredictorEvent,
  PredictorEventKey,
} from "@/utils/race-predictor-engine";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { useResponsiveLayout } from "@/lib/responsive";

export default function RacePredictorScreen() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { hasAccess } = usePremium();
  const { colors } = useThemeColors();
  const layout = useResponsiveLayout();
  const quickEvents = listPredictorEvents();
  const defaultEvent = normalizePredictorEvent(profile.goalEvent || "") ?? "5k";
  const [selectedEvent, setSelectedEvent] = useState<PredictorEventKey>(defaultEvent);
  const [typedEvent, setTypedEvent] = useState("");

  const selectedPrediction = useMemo(
    () => getPredictionForEvent(selectedEvent, workouts, profile),
    [profile, selectedEvent, workouts]
  );
  const allPredictions = useMemo(() => getRacePredictions(workouts, profile), [profile, workouts]);
  const advancedUnlocked = hasAccess("race_prediction_advanced");
  const confidenceProgress =
    selectedPrediction.confidence === "High" ? 84 : selectedPrediction.confidence === "Medium" ? 62 : 36;

  const applyTypedEvent = () => {
    const nextEvent = normalizePredictorEvent(typedEvent);

    if (nextEvent) {
      setSelectedEvent(nextEvent);
    }
  };

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Race Predictor"
        title="Current race fitness"
        subtitle="A rule-based predictor that updates from your logged training, workout times, effort, mileage, and saved PRs."
      />

      <FadeInView delay={60}>
        <InfoCard>
        <SectionTitle
          colors={colors}
          title="Choose an event"
          subtitle="Tap a quick pick or type an event name to update the prediction."
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {quickEvents.map((event) => {
            const active = selectedEvent === event.key;

            return (
              <Pressable
                key={event.key}
                onPress={() => setSelectedEvent(event.key)}
                style={{
                  backgroundColor: active ? colors.primarySoft : colors.cardAlt,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{event.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 10, marginTop: 16 }}>
          <TextInput
            value={typedEvent}
            onChangeText={setTypedEvent}
            placeholder="Type 5k, mile, half marathon..."
            placeholderTextColor={colors.subtext}
            style={{
              flex: 1,
              backgroundColor: colors.background,
              color: colors.text,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              paddingVertical: 14,
              fontSize: 15,
            }}
          />
          <View style={{ width: layout.isPhone ? "100%" : 110 }}>
            <PrimaryButton label="Use Event" onPress={applyTypedEvent} />
          </View>
        </View>

        {typedEvent.trim() && !normalizePredictorEvent(typedEvent) ? (
          <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 10 }}>
            Supported events include 400m, 800m, mile, 2 mile, 5K, 10K, half marathon, and marathon.
          </Text>
        ) : null}
        </InfoCard>
      </FadeInView>

      <FadeInView delay={100}>
        <InfoCard>
        <View style={{ overflow: "hidden", borderRadius: 24 }}>
          <RunningSurfaceAccent variant="race" />
          <FinishLineAccent />
        <View style={{ flexDirection: layout.isPhone ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 0.9 }}>
              SELECTED EVENT
            </Text>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 10 }}>
              {selectedPrediction.label}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23, marginTop: 10 }}>
              {selectedPrediction.predictedTime
                ? "Prediction updated from recent tempo, interval, aerobic, and race-like sessions."
                : "Log more workouts to improve your race prediction."}
            </Text>
          </View>

          <ConfidenceBadge confidence={selectedPrediction.confidence} />
        </View>

        <View
          style={{
            marginTop: 20,
            backgroundColor: "#101e33",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.16)",
            padding: 18,
            overflow: "hidden",
          }}
        >
          <RunningSurfaceAccent variant="race" />
          <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>PREDICTED TIME</Text>
          <Text style={{ color: colors.text, fontSize: 36, fontWeight: "800", marginTop: 8 }}>
            {selectedPrediction.predictedTime ?? "Need more data"}
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 8 }}>
            Confidence score: {selectedPrediction.confidenceScore}/100
          </Text>
        </View>

        <View style={{ marginTop: 14, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
              READ CONFIDENCE
            </Text>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{selectedPrediction.confidence}</Text>
          </View>
          <AnimatedProgressBar
            progress={confidenceProgress}
            fillColor={colors.primary}
            trackColor={colors.cardAlt}
            height={8}
          />
        </View>

        <View style={{ marginTop: 18, gap: 10 }}>
          {selectedPrediction.explanation.map((line) => (
            <View
              key={line}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{line}</Text>
            </View>
          ))}
        </View>
        </View>
        </InfoCard>
      </FadeInView>

      <AdvancedRacePredictorCard />

      <FadeInView delay={140}>
        <InfoCard>
        <SectionTitle
          colors={colors}
          title={advancedUnlocked ? "Basic prediction influences" : "Prediction influences"}
          subtitle={advancedUnlocked ? "Your Pro-level baseline stays visible here under the Elite coaching layer." : "The strongest inputs that shaped this estimate."}
        />

        <View style={{ marginTop: 16, gap: 10 }}>
          {selectedPrediction.influences.map((influence) => (
            <View
              key={influence}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{influence}</Text>
            </View>
          ))}
        </View>
        </InfoCard>
      </FadeInView>

      <FadeInView delay={180}>
        <InfoCard>
        <SectionTitle
          colors={colors}
          title="Across events"
          subtitle="A quick view of current predicted fitness across the supported race distances."
        />

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          {allPredictions.map((prediction) => (
            <Pressable
              key={prediction.eventKey}
              onPress={() => setSelectedEvent(prediction.eventKey)}
              style={({ pressed }) => ({
                width: layout.isPhone ? "100%" : "47.8%",
                backgroundColor: prediction.eventKey === selectedEvent ? colors.primarySoft : colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: prediction.eventKey === selectedEvent ? colors.primary : colors.border,
                padding: 14,
                opacity: pressed ? 0.95 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }, { translateY: pressed ? 1 : 0 }],
              })}
            >
              <Text style={{ color: colors.subtext, fontSize: 12 }}>{prediction.label}</Text>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 6 }}>
                {prediction.predictedTime ?? "Need data"}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }}>
                {prediction.confidence} confidence
              </Text>
            </Pressable>
          ))}
        </View>
        </InfoCard>
      </FadeInView>
    </ScreenScroll>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: ReturnType<typeof getPredictionForEvent>["confidence"];
}) {
  const { colors } = useThemeColors();
  const palette =
    confidence === "High"
      ? { backgroundColor: colors.success, textColor: "#ffffff" }
      : confidence === "Medium"
        ? { backgroundColor: colors.primary, textColor: "#ffffff" }
        : { backgroundColor: colors.cardAlt, textColor: colors.text };

  return (
    <View
      style={{
        backgroundColor: palette.backgroundColor,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 92,
      }}
    >
      <Text style={{ color: palette.textColor, fontSize: 12, fontWeight: "800", textAlign: "center" }}>
        {confidence}
      </Text>
    </View>
  );
}
