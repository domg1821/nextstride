import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
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

export default function TeamWorkouts() {
  const { colors } = useThemeColors();
  const { currentTeam, displayName, profile, teamReady } = useProfile();
  const [workouts, setWorkouts] = useState<TeamWorkout[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!currentTeam?.id) {
        setWorkouts([]);
        return;
      }

      setLoading(true);
      setError("");

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
        setLoading(false);
      }
    };

    void loadWorkouts();
  }, [currentTeam?.id]);

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Team Runner" title="Team Workouts" subtitle="A future home for workouts shared by a coach or team plan." />

      {!teamReady ? (
        <InfoCard title="Loading team workouts" subtitle="Checking your team membership and loading coach-posted workouts." />
      ) : !currentTeam ? (
        <InfoCard title="Join a team first" subtitle="You need a linked team before shared workouts can appear here.">
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Head back to Team Home and join with your coach&apos;s invite code. Solo-generated workouts will not appear in this team space.
            </Text>
          </View>
        </InfoCard>
      ) : (
        <InfoCard
          title={loading ? "Loading workouts..." : `${currentTeam.name} Workouts`}
          subtitle="These are only the workouts posted to your team by your coach."
        >
          <View style={{ gap: 12 }}>
            {!!error ? (
              <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}>{error}</Text>
            ) : null}

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
            ) : !loading ? (
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                No team workouts have been posted yet.
              </Text>
            ) : null}
          </View>
        </InfoCard>
      )}
    </ScreenScroll>
  );
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
