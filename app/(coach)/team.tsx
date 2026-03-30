import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function CoachTeam() {
  const { colors } = useThemeColors();
  const { currentTeam, displayName, profile, teamReady } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Coach" title="Team" subtitle="A dedicated place for future roster, group, and invitation tools." />
      <InfoCard
        title={currentTeam ? currentTeam.name : teamReady ? "No team created yet" : "Loading team"}
        subtitle={
          currentTeam
            ? "Your team exists and runners can join with the invite code below."
            : "Create a team from the coach dashboard to unlock team membership."
        }
      >
        <View style={{ gap: 10 }}>
          {currentTeam ? (
            <>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>INVITE CODE</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>{currentTeam.inviteCode}</Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                Athlete lists, invitations, and team-level planning can expand from this route in the next phase.
              </Text>
            </>
          ) : (
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Use this route for athlete lists, invitations, and team-level planning later.
            </Text>
          )}
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
