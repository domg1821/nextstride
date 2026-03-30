import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { TeamWorkoutThread } from "@/components/team-workout-thread";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";

export default function CoachWorkouts() {
  const { colors } = useThemeColors();
  const { currentTeam, displayName, profile, teamReady } = useProfile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateWorkout = async () => {
    if (loading) {
      return;
    }

    if (!currentTeam?.id) {
      setError("Create your team before posting workouts.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedDate = workoutDate.trim();

    if (!trimmedTitle) {
      setError("Enter a workout title.");
      return;
    }

    if (!trimmedDate) {
      setError("Enter a workout date.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sign in again before posting workouts.");
        return;
      }

      const { error: insertError } = await supabase.from("team_workouts").insert({
        team_id: currentTeam.id,
        created_by: user.id,
        title: trimmedTitle,
        description: trimmedDescription,
        workout_date: trimmedDate,
      });

      if (insertError) {
        setError(`Unable to post workout: ${insertError.message}`);
        return;
      }

      setTitle("");
      setDescription("");
      setWorkoutDate(new Date().toISOString().slice(0, 10));
      setRefreshKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Coach" title="Workouts" subtitle="A coach-specific workspace for planning and assigning workouts later." />

      {!teamReady ? (
        <InfoCard title="Loading team workouts" subtitle="Checking your coach team and loading any posted workouts." />
      ) : !currentTeam ? (
        <InfoCard title="Create a team first" subtitle="A coach needs a team before posting shared workouts.">
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Head back to the coach dashboard, create your team, then return here to post workouts for that team.
            </Text>
          </View>
        </InfoCard>
      ) : (
        <>
          <InfoCard title="Create Workout" subtitle={`Post a workout to ${currentTeam.name}. Team runners will only see workouts for this team.`}>
            <View style={{ gap: 14 }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Workout title"
                placeholderTextColor={colors.subtext}
                style={inputStyle(colors)}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Workout description"
                placeholderTextColor={colors.subtext}
                multiline
                style={[inputStyle(colors), { minHeight: 96, textAlignVertical: "top" }]}
              />
              <TextInput
                value={workoutDate}
                onChangeText={setWorkoutDate}
                placeholder="Workout date (YYYY-MM-DD)"
                placeholderTextColor={colors.subtext}
                style={inputStyle(colors)}
              />

              {!!error ? (
                <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}>{error}</Text>
              ) : null}

              <PrimaryButton label={loading ? "Posting Workout..." : "Post Workout"} onPress={() => void handleCreateWorkout()} />
            </View>
          </InfoCard>
          <TeamWorkoutThread
            teamId={currentTeam.id}
            refreshKey={refreshKey}
            emptyMessage="No team workouts posted yet. Create the first one above."
          />
        </>
      )}
    </ScreenScroll>
  );
}

function inputStyle(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  } as const;
}
