import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function TeamWorkouts() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Team Runner" title="Team Workouts" subtitle="A future home for workouts shared by a coach or team plan." />
      <InfoCard title="Shared workout placeholder" subtitle="This tab will hold assigned sessions and weekly team plans in a later phase.">
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>For now, this confirms the team-runner layout is separate and ready for workout-specific features.</Text>
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
