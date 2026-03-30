import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function CoachWorkouts() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Coach" title="Workouts" subtitle="A coach-specific workspace for planning and assigning workouts later." />
      <InfoCard title="Workout management placeholder" subtitle="The routing foundation is ready for shared workout authoring in a future phase.">
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>Posting workouts, assigning sessions, and team plan templates can attach here next.</Text>
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
