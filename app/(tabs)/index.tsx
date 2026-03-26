import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton, SecondaryButton } from "../components/ui-kit";
import { ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { buildWeeklyPlan } from "../training-plan";
import { useWorkouts } from "../workout-context";

export default function Home() {
  const { profile, setProfile, displayName } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();

  const [editingPr, setEditingPr] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingMileage, setEditingMileage] = useState(false);

  const [prInput, setPrInput] = useState(profile.pr5k || "");
  const [goalInput, setGoalInput] = useState(profile.goalEvent || "");
  const [mileageInput, setMileageInput] = useState(profile.mileage || "");

  const mileageGoal = parseFloat(profile.mileage) || 30;

  const totalMilesLogged = workouts.reduce((sum, workout) => {
    const dist = parseFloat(workout.distance);
    return sum + (isNaN(dist) ? 0 : dist);
  }, 0);

  const progressPercent = Math.min((totalMilesLogged / mileageGoal) * 100, 100);

  const weeklyPlan = buildWeeklyPlan(
    profile.goalEvent || "",
    mileageGoal,
    profile.pr5k || ""
  );

  const todaysWorkout = weeklyPlan[0];

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />

      <PageHeader
        eyebrow="Today"
        title={todaysWorkout?.title || "Workout"}
        subtitle={todaysWorkout?.details || "Your next session will appear here."}
        rightContent={
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
              {Math.round(progressPercent)}%
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>
              weekly
            </Text>
          </View>
        }
      />

      <InfoCard
        title="Weekly Progress"
        subtitle="Track how your logged miles stack up against the plan."
      >
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
              {totalMilesLogged.toFixed(1)} mi
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14 }}>
              of {mileageGoal} mi goal
            </Text>
          </View>

          <View
            style={{
              marginTop: 14,
              height: 12,
              backgroundColor: colors.border,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor: colors.primary,
                borderRadius: 999,
              }}
            />
          </View>

          <Text style={{ color: colors.subtext, marginTop: 10, fontSize: 13 }}>
            {progressPercent.toFixed(0)}% of your weekly goal completed
          </Text>
        </View>
      </InfoCard>

      <SectionTitle
        colors={colors}
        title="Training Profile"
        subtitle="Keep your race focus and benchmarks up to date."
      />

      <EditableField
        colors={colors}
        label="Goal Event"
        value={profile.goalEvent || "Not set"}
        editing={editingGoal}
        inputValue={goalInput}
        setInputValue={setGoalInput}
        placeholder="800, 5k, marathon..."
        onEdit={() => setEditingGoal(true)}
        onSave={() => {
          setProfile({ ...profile, goalEvent: goalInput });
          setEditingGoal(false);
        }}
      />

      <EditableField
        colors={colors}
        label="Weekly Mileage"
        value={`${profile.mileage || "0"} miles`}
        editing={editingMileage}
        inputValue={mileageInput}
        setInputValue={setMileageInput}
        placeholder="30"
        keyboardType="numeric"
        onEdit={() => setEditingMileage(true)}
        onSave={() => {
          setProfile({ ...profile, mileage: mileageInput });
          setEditingMileage(false);
        }}
      />

      <EditableField
        colors={colors}
        label="5K PR"
        value={profile.pr5k || "Not added"}
        editing={editingPr}
        inputValue={prInput}
        setInputValue={setPrInput}
        placeholder="16:53"
        onEdit={() => setEditingPr(true)}
        onSave={() => {
          setProfile({ ...profile, pr5k: prInput });
          setEditingPr(false);
        }}
      />
    </ScreenScroll>
  );
}

function EditableField({
  colors,
  label,
  value,
  editing,
  inputValue,
  setInputValue,
  placeholder,
  onEdit,
  onSave,
  keyboardType,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  editing: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  placeholder: string;
  onEdit: () => void;
  onSave: () => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <InfoCard title={label}>
      {editing ? (
        <>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor={colors.subtext}
            keyboardType={keyboardType}
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              fontSize: 15,
            }}
          />
          <View style={{ marginTop: 14, alignSelf: "flex-start", minWidth: 92 }}>
            <PrimaryButton label="Save" onPress={onSave} />
          </View>
        </>
      ) : (
        <>
          <Text style={{ color: colors.subtext, fontSize: 15 }}>{value}</Text>
          <View style={{ marginTop: 14, alignSelf: "flex-start", minWidth: 92 }}>
            <SecondaryButton label="Edit" onPress={onEdit} />
          </View>
        </>
      )}
    </InfoCard>
  );
}
