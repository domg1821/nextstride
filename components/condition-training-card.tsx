import { useMemo } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useEngine } from "@/contexts/engine-context";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import {
  evaluateConditionTraining,
} from "@/lib/condition-training";
import type { PlanDay } from "@/lib/training-plan";
import { buildUpgradePath } from "@/lib/upgrade-route";
import { router } from "expo-router";

export function ConditionTrainingCard({
  workout,
}: {
  workout: Pick<PlanDay, "category" | "title" | "details"> | null;
}) {
  const { colors } = useThemeColors();
  const { hasAccess, getFeatureGate } = usePremium();
  const { engine, updateEngine } = useEngine();
  const unlocked = hasAccess("condition_training");
  const gate = getFeatureGate("condition_training");
  const conditions = engine.conditionPreferences;

  const setConditions = (updates: Partial<typeof conditions>) => {
    updateEngine({
      conditionPreferences: {
        ...conditions,
        ...updates,
      },
    });
  };

  const parsedTemperature = Number.parseFloat(conditions.temperature);
  const parsedHumidity = Number.parseFloat(conditions.humidity);
  const parsedWind = Number.parseFloat(conditions.windSpeed);
  const readyForAdjustment =
    Number.isFinite(parsedTemperature) &&
    Number.isFinite(parsedHumidity) &&
    Number.isFinite(parsedWind) &&
    workout;

  const result = useMemo(() => {
    if (!readyForAdjustment || !workout) {
      return null;
    }

    return evaluateConditionTraining({
      plannedWorkout: workout,
      conditions: {
        temperature: parsedTemperature,
        humidity: parsedHumidity,
        windSpeed: parsedWind,
        runType: conditions.runType,
        exposure: conditions.exposure,
        feelsLikeNote: conditions.feelsLikeNote.trim(),
      },
    });
  }, [conditions.exposure, conditions.feelsLikeNote, conditions.runType, parsedHumidity, parsedTemperature, parsedWind, readyForAdjustment, workout]);

  if (!workout) {
    return null;
  }

  if (!unlocked) {
    return (
      <View
        style={{
          backgroundColor: "#101f34",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.16)",
          padding: 16,
          gap: 10,
        }}
      >
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.9 }}>ELITE PREVIEW</Text>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Condition Training</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
          Unlock condition-based workout adjustments with Elite.
        </Text>

        <View
          style={{
            backgroundColor: "rgba(8, 17, 29, 0.62)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.12)",
            padding: 14,
            gap: 8,
          }}
        >
          <LockedPreviewLine label="Pace" value="Back off slightly in heat and humidity." />
          <LockedPreviewLine label="HR" value="Expect heart rate to run a little higher than normal." />
          <LockedPreviewLine label="Coach note" value={gate.preview} />
        </View>

        <Pressable
          onPress={() =>
            router.push(
              buildUpgradePath({
                plan: "elite",
                recommendation: "Unlock condition-based workout adjustments with Elite",
              })
            )
          }
          style={{
            alignSelf: "flex-start",
            borderRadius: 999,
            backgroundColor: colors.primarySoft,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>Upgrade to Elite</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#12243b",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: result ? `${getCautionAccent(result.cautionLevel)}44` : "rgba(103, 232, 249, 0.16)",
        padding: 18,
        gap: 14,
        shadowColor: result ? getCautionAccent(result.cautionLevel) : "#38bdf8",
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.9 }}>ELITE CONDITION TRAINING</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>Adjust today&apos;s guidance for real conditions</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
            Enter the conditions you expect and get a more coach-like read on pace, effort, heart rate, and hydration.
          </Text>
        </View>

        {result ? <CautionBadge level={result.cautionLevel} /> : null}
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <ConditionField
          colors={colors}
          label="Temp"
          value={conditions.temperature}
          onChangeText={(value) => setConditions({ temperature: value })}
          placeholder="72"
        />
        <ConditionField
          colors={colors}
          label="Humidity"
          value={conditions.humidity}
          onChangeText={(value) => setConditions({ humidity: value })}
          placeholder="60"
        />
        <ConditionField
          colors={colors}
          label="Wind"
          value={conditions.windSpeed}
          onChangeText={(value) => setConditions({ windSpeed: value })}
          placeholder="8"
        />
      </View>

      <View style={{ gap: 10 }}>
        <ToggleRow
          colors={colors}
          label="Run type"
          options={[
            { label: "Outside", value: "outside" as const },
            { label: "Treadmill", value: "treadmill" as const },
          ]}
          selectedValue={conditions.runType}
          onSelect={(value) => setConditions({ runType: value })}
        />

        <ToggleRow
          colors={colors}
          label="Exposure"
          options={[
            { label: "Sunny", value: "sunny" as const },
            { label: "Shaded", value: "shaded" as const },
            { label: "Cloudy", value: "cloudy" as const },
          ]}
          selectedValue={conditions.exposure}
          onSelect={(value) => setConditions({ exposure: value })}
        />
      </View>

      <TextInput
        value={conditions.feelsLikeNote}
        onChangeText={(value) => setConditions({ feelsLikeNote: value })}
        placeholder="Optional note: sticky, dry heat, exposed route..."
        placeholderTextColor={colors.subtext}
        style={{
          backgroundColor: "rgba(8, 17, 29, 0.68)",
          color: colors.text,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 14,
        }}
      />

      {result ? (
        <View
          style={{
            backgroundColor: "rgba(8, 17, 29, 0.66)",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: `${getCautionAccent(result.cautionLevel)}33`,
            padding: 16,
            gap: 10,
          }}
        >
          <ResultLine label="Adjusted pace" value={result.adjustedPaceText} accent={getCautionAccent(result.cautionLevel)} />
          <ResultLine label="Effort target" value={result.adjustedEffortText} />
          <ResultLine label="Heart rate read" value={result.adjustedHeartRateText} />
          <ResultLine label="Hydration" value={result.hydrationNote} />
          <ResultLine label="Recommendation" value={result.recommendation} accent="#67e8f9" />
        </View>
      ) : (
        <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
          Add temperature, humidity, and wind to generate today&apos;s adjusted guidance.
        </Text>
      )}
    </View>
  );
}

function ConditionField({
  colors,
  label,
  value,
  onChangeText,
  placeholder,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="numeric"
        placeholderTextColor={colors.subtext}
        style={{
          backgroundColor: "rgba(8, 17, 29, 0.68)",
          color: colors.text,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 14,
        }}
      />
    </View>
  );
}

function ToggleRow<TValue extends string>({
  colors,
  label,
  options,
  selectedValue,
  onSelect,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  options: { label: string; value: TValue }[];
  selectedValue: TValue;
  onSelect: (value: TValue) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {options.map((option) => {
          const active = selectedValue === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={{
                backgroundColor: active ? colors.primarySoft : "rgba(8, 17, 29, 0.68)",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ResultLine({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: accent || "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19 }}>{value}</Text>
    </View>
  );
}

function LockedPreviewLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19 }}>{value}</Text>
    </View>
  );
}

function CautionBadge({ level }: { level: "low" | "moderate" | "high" }) {
  const accent = getCautionAccent(level);

  return (
    <View
      style={{
        minWidth: 92,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(8, 17, 29, 0.7)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: `${accent}44`,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color: "#8ea5c2", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }}>IMPACT</Text>
      <Text style={{ color: accent, fontSize: 14, fontWeight: "800", marginTop: 4 }}>{level.toUpperCase()}</Text>
    </View>
  );
}

function getCautionAccent(level: "low" | "moderate" | "high") {
  switch (level) {
    case "high":
      return "#f97316";
    case "moderate":
      return "#fbbf24";
    default:
      return "#4ade80";
  }
}
