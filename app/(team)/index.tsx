import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function TeamHome() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Team Runner" title="Team Home" subtitle="A dedicated team-runner shell separate from the solo app." />
      <InfoCard title="Phase 2 foundation" subtitle="This shell is ready for team workouts, communication, and shared context later.">
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>Team home will eventually become the default landing view for roster updates, announcements, and shared plans.</Text>
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
