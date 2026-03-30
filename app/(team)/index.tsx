import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function TeamHome() {
  const { colors } = useThemeColors();
  const { currentTeam, displayName, joinTeamByCode, profile, teamReady } = useProfile();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await joinTeamByCode({ inviteCode });

      if (!result.ok) {
        setError(result.error || "Unable to join team.");
        return;
      }

      setInviteCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Team Runner" title="Team Home" subtitle="A dedicated team-runner shell separate from the solo app." />

      {!teamReady ? (
        <InfoCard title="Loading team state" subtitle="Checking whether this runner account is already linked to a team." />
      ) : currentTeam ? (
        <InfoCard title={currentTeam.name} subtitle="You are linked to this team and ready for shared training features in later phases.">
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              Membership persists through refresh and login. Team workouts and comments can now build on top of this team
              link cleanly.
            </Text>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
              Invite code: {currentTeam.inviteCode}
            </Text>
          </View>
        </InfoCard>
      ) : (
        <InfoCard title="Join a team" subtitle="Enter your coach's invite code to connect this team-runner account to a team.">
          <View style={{ gap: 14 }}>
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Invite code"
              autoCapitalize="characters"
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

            <PrimaryButton label={loading ? "Joining Team..." : "Join Team"} onPress={() => void handleJoin()} />
          </View>
        </InfoCard>
      )}
    </ScreenScroll>
  );
}
