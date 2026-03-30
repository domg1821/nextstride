import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { TeamWorkoutThread } from "@/components/team-workout-thread";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function TeamWorkouts() {
  const { colors } = useThemeColors();
  const { currentTeam, displayName, profile, teamReady } = useProfile();

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
        <TeamWorkoutThread
          teamId={currentTeam.id}
          emptyMessage="No team workouts have been posted yet."
        />
      )}
    </ScreenScroll>
  );
}
