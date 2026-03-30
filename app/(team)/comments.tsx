import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function TeamComments() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Team Runner" title="Comments" subtitle="A reserved space for coach and team communication later." />
      <InfoCard title="Comments placeholder" subtitle="This route is intentionally simple for Phase 2.">
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>Threaded comments, coach notes, and team discussion can attach here in a future phase without changing the route structure.</Text>
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
