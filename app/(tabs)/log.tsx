import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton } from "../components/ui-kit";
import { AnimatedTabScene, ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { useWorkouts } from "../workout-context";

export default function Log() {
  const { addWorkout, shoes, addShoe, getShoeMileage } = useWorkouts();
  const { profile, applyAutomaticPr } = useProfile();
  const { colors } = useThemeColors();

  const [type, setType] = useState("");
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");
  const [splits, setSplits] = useState("");
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState("");
  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(shoes[0]?.id ?? null);
  const [newShoeName, setNewShoeName] = useState("");
  const formattedEffort = effort.toFixed(1);

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
      shoeId: selectedShoeId,
    });

    const prResult = applyAutomaticPr({ distance, time });

    if (prResult.updated && prResult.label) {
      Alert.alert(
        `New ${prResult.label} PR \uD83C\uDF89`,
        `Your ${prResult.label} PR was updated to ${prResult.time}.`
      );
    } else {
      Alert.alert("Workout Saved", "Your workout was saved.");
    }

    setType("");
    setDistance("");
    setTime("");
    setSplits("");
    setEffort(5);
    setNotes("");
  };

  const handleAddShoe = () => {
    const trimmed = newShoeName.trim();

    if (!trimmed) {
      return;
    }

    addShoe(trimmed);
    setNewShoeName("");
  };

  return (
    <AnimatedTabScene tabKey="log">
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
            Effort {formattedEffort}/10
          </Text>
          <Text style={{ color: colors.subtext, marginTop: 4, fontSize: 14 }}>
            {getEffortLabel(effort)}
          </Text>

          <Slider
            minimumValue={1}
            maximumValue={10}
            value={effort}
            onValueChange={setEffort}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            style={{ marginTop: 8 }}
          />

          <View
            style={{
              marginTop: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "600" }}>
              Easy
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "600" }}>
              Max
            </Text>
          </View>

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

        <InfoCard title="Shoes" subtitle="Assign runs to a shoe and keep mileage simple.">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {shoes.map((shoe) => {
            const active = selectedShoeId === shoe.id;
            const miles = getShoeMileage(shoe.id);

            return (
              <Pressable
                key={shoe.id}
                onPress={() => setSelectedShoeId(shoe.id)}
                style={{
                  minWidth: "47%",
                  backgroundColor: active ? colors.primarySoft : colors.cardAlt,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  padding: 14,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                  {shoe.name}
                </Text>
                <Text style={{ color: colors.subtext, marginTop: 4, fontSize: 13 }}>
                  {miles.toFixed(1)} mi
                </Text>
                {miles >= 300 ? (
                  <Text style={{ color: colors.primary, marginTop: 6, fontSize: 12, fontWeight: "700" }}>
                    Rotation check
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <FieldInput
              colors={colors}
              placeholder="Add a shoe"
              value={newShoeName}
              onChangeText={setNewShoeName}
            />
          </View>
          <View style={{ justifyContent: "flex-end" }}>
            <PrimaryButton label="Add" onPress={handleAddShoe} />
          </View>
        </View>
        </InfoCard>
      </ScreenScroll>
    </AnimatedTabScene>
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
