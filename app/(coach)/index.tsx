import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function CoachDashboard() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader
        eyebrow="Coach"
        title="Coach Dashboard"
        subtitle="A dedicated coach shell for athlete oversight, team planning, and workout management."
      />
      <InfoCard title="Phase 2 foundation" subtitle="This shell is now separate from the solo runner app and ready for coach-specific features.">
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>Athlete roster, team calendars, and workout distribution can plug into this dashboard next.</Text>
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
