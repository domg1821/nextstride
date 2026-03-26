import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton } from "../components/ui-kit";
import { ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";

export default function Log() {
  const { addWorkout } = useWorkouts();
  const { profile } = useProfile();
  const { colors } = useThemeColors();

  const [type, setType] = useState("");
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");
  const [splits, setSplits] = useState("");
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState("");

  const getEffortLabel = (value: number) => {
    if (value <= 3) return "Easy";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "Hard";
    return "All-out";
  };

  const handleSave = () => {
    addWorkout({
      type,
      distance,
      time,
      splits,
      effort,
      notes,
    });

    Alert.alert("Workout Saved", "Your workout was saved.");

    setType("");
    setDistance("");
    setTime("");
    setSplits("");
    setEffort(5);
    setNotes("");
  };

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={profile.name} />

      <PageHeader
        eyebrow="Log"
        title="Capture the work"
        subtitle="Save the session details that matter so your training stays honest and useful."
      />

      <SectionTitle
        colors={colors}
        title="Workout Details"
        subtitle="Keep entries quick, clear, and consistent."
      />

      <InfoCard>
        <FieldInput
          colors={colors}
          placeholder="Workout Type (easy, tempo, intervals)"
          value={type}
          onChangeText={setType}
        />
        <FieldInput
          colors={colors}
          placeholder="Distance (miles)"
          value={distance}
          onChangeText={setDistance}
          keyboardType="numeric"
        />
        <FieldInput
          colors={colors}
          placeholder="Time (e.g. 25:30)"
          value={time}
          onChangeText={setTime}
        />
        <FieldInput
          colors={colors}
          placeholder="Splits (example: 5:10, 5:15, 5:05)"
          value={splits}
          onChangeText={setSplits}
        />

        <View
          style={{
            marginTop: 14,
            backgroundColor: colors.cardAlt,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
            Effort {effort}/10
          </Text>
          <Text style={{ color: colors.subtext, marginTop: 4, fontSize: 14 }}>
            {getEffortLabel(effort)}
          </Text>

          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={effort}
            onValueChange={setEffort}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            style={{ marginTop: 8 }}
          />

          <Text style={{ color: colors.subtext, marginTop: 4, fontSize: 13 }}>
            1 = very easy, 10 = max effort
          </Text>
        </View>

        <TextInput
          placeholder="Notes"
          placeholderTextColor={colors.subtext}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{
            marginTop: 14,
            backgroundColor: colors.background,
            color: colors.text,
            padding: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            height: 110,
            textAlignVertical: "top",
            fontSize: 15,
          }}
        />

        <View style={{ marginTop: 18 }}>
          <PrimaryButton label="Save Workout" onPress={handleSave} />
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}

function FieldInput({
  colors,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.subtext}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 18,
        marginTop: 14,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 15,
      }}
    />
  );
}
