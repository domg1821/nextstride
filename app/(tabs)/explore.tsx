import { Text, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { InfoCard, PageHeader, StatCard } from "../components/ui-kit";
import { ScreenScroll, SectionTitle } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { buildWeeklyPlan } from "../training-plan";

export default function Plan() {
  const { profile } = useProfile();
  const { colors } = useThemeColors();
  const mileage = parseFloat(profile.mileage) || 30;

  const weekPlan = buildWeeklyPlan(
    profile.goalEvent || "",
    mileage,
    profile.pr5k || ""
  );

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={profile.name} />

      <PageHeader
        eyebrow="Weekly Plan"
        title={profile.goalEvent || "Build Your Block"}
        subtitle={`A structured seven-day view built around ${mileage} miles per week.`}
      />

      <StatCard label="Target Volume" value={`${mileage} mi`} helper="This week" />

      <SectionTitle
        colors={colors}
        title="This Week"
        subtitle="Two quality touches, one long run, and clear recovery space."
      />

      {weekPlan.map((day, index) => (
        <InfoCard key={index}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
                {day.day || day.title || `Day ${index + 1}`}
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "700",
                  marginTop: 6,
                  textTransform: "uppercase",
                }}
              >
                {day.title || "Session"}
              </Text>
              <Text
                style={{
                  color: colors.subtext,
                  marginTop: 10,
                  fontSize: 14,
                  lineHeight: 21,
                }}
              >
                {day.details || "Session details will appear here."}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {day.distance} mi
              </Text>
            </View>
          </View>
        </InfoCard>
      ))}
    </ScreenScroll>
  );
}
