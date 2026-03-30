import { useCallback, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";

type TeamWorkout = {
  id: string;
  title: string;
  description: string;
  workout_date: string;
  created_at: string;
};

export default function CoachWorkouts() {
  const { colors } = useThemeColors();
  const { currentTeam, displayName, profile, teamReady } = useProfile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workouts, setWorkouts] = useState<TeamWorkout[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkouts = useCallback(async () => {
    if (!currentTeam?.id) {
      setWorkouts([]);
      return;
    }

    setRefreshing(true);

    try {
      const { data, error: queryError } = await supabase
        .from("team_workouts")
        .select("*")
        .eq("team_id", currentTeam.id)
        .order("workout_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(`Unable to load team workouts: ${queryError.message}`);
        return;
      }

      setWorkouts((data as TeamWorkout[] | null) ?? []);
    } finally {
      setRefreshing(false);
    }
  }, [currentTeam?.id]);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

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
      await loadWorkouts();
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

          <InfoCard
            title="Posted Workouts"
            subtitle={refreshing ? "Refreshing workouts..." : "Newest first. Team runners only see workouts posted to their own team."}
          >
            <View style={{ gap: 12 }}>
              {workouts.length > 0 ? (
                workouts.map((workout) => (
                  <View
                    key={workout.id}
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{workout.title}</Text>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 6 }}>
                      {formatDate(workout.workout_date)}
                    </Text>
                    <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                      {workout.description || "No description added."}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                  No team workouts posted yet. Create the first one above.
                </Text>
              )}
            </View>
          </InfoCard>
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
