import { router } from "expo-router";
import { Text, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { InfoCard, PageHeader, SecondaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function TeamProfile() {
  const { colors } = useThemeColors();
  const { displayName, profile } = useProfile();

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />
      <PageHeader eyebrow="Team Runner" title="Profile" subtitle="Your team-runner profile and account settings entry point." />
      <InfoCard title={displayName} subtitle="Team runner account">
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>This tab will hold team-runner profile details, settings, and future roster membership info.</Text>
          <SecondaryButton label="Open Settings" onPress={() => router.push("/settings")} />
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}
