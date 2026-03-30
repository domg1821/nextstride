import { router } from "expo-router";
import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader, SecondaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function CoachProfile() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Coach" title="Profile" subtitle="Your coach account profile and settings entry point." />
      <InfoCard title={displayName} subtitle="Coach account">
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>This profile tab will hold coach profile details, account preferences, and future team settings.</Text>
          <SecondaryButton label="Open Settings" onPress={() => router.push("/settings")} />
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
