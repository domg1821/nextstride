import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function CoachDashboard() {
  const { colors } = useThemeColors();
  const { createTeam, currentTeam, displayName, profile, teamDebug, teamReady } = useProfile();
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await createTeam({ name: teamName });

      if (!result.ok) {
        setError(result.error || "Unable to create team.");
        return;
      }

      setTeamName("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader
        eyebrow="Coach"
        title="Coach Dashboard"
        subtitle="A dedicated coach shell for athlete oversight, team planning, and workout management."
      />

      {!teamReady ? (
        <InfoCard title="Loading team state" subtitle="Checking whether your coach account already has a team." />
      ) : currentTeam ? (
        <InfoCard title={currentTeam.name} subtitle="Your team is ready for runners to join with this invite code.">
          <View style={{ gap: 12 }}>
            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                INVITE CODE
              </Text>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 8 }}>
                {currentTeam.inviteCode}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                Share this code with team runners so they can join your team from their team-runner home screen.
              </Text>
            </View>

            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Team creation is locked to one coach = one team for Phase 3. Team workouts and comments can plug into this
              shell next.
            </Text>

            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                TEMP DEBUG
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 13 }}>Generated code: {teamDebug.generatedInviteCode || "n/a"}</Text>
              <Text style={{ color: colors.subtext, fontSize: 13 }}>Saved code: {teamDebug.savedInviteCode || "n/a"}</Text>
              {teamDebug.lookupError ? (
                <Text style={{ color: colors.danger, fontSize: 13 }}>Verify error: {teamDebug.lookupError}</Text>
              ) : null}
            </View>
          </View>
        </InfoCard>
      ) : (
        <InfoCard title="Create your team" subtitle="Start by giving your team a name. We will generate an invite code automatically.">
          <View style={{ gap: 14 }}>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Team name"
              placeholderTextColor={colors.subtext}
              style={{
                backgroundColor: colors.cardAlt,
                color: colors.text,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 15,
                fontSize: 15,
              }}
            />

            {!!error ? (
              <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}>{error}</Text>
            ) : null}

            <PrimaryButton label={loading ? "Creating Team..." : "Create Team"} onPress={() => void handleCreateTeam()} />
          </View>
        </InfoCard>
      )}
    </ScreenScroll>
  );
}
