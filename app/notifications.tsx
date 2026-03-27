import { router } from "expo-router";
import { Pressable, Switch, Text, View } from "react-native";
import { InfoCard, PageHeader } from "./components/ui-kit";
import { ScreenScroll } from "./components/ui-shell";
import { useProfile } from "./profile-context";
import { useThemeColors } from "./theme-context";

export default function Notifications() {
  const { notificationPreferences, updateNotificationPreferences } = useProfile();
  const { colors } = useThemeColors();
  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/settings");
  };

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Notifications"
        title="Reminder settings"
        subtitle="Control the nudges and reminders that keep training useful without making the app noisy."
      />

      <InfoCard title="Training Reminders" subtitle="These toggles are saved locally for now.">
        <NotificationRow
          label="Workout reminders"
          description="General reminders to stay on top of planned sessions."
          value={notificationPreferences.workoutReminders}
          onValueChange={(value) => updateNotificationPreferences({ workoutReminders: value })}
        />
        <NotificationRow
          label="Long run reminders"
          description="A nudge before your key endurance day."
          value={notificationPreferences.longRunReminders}
          onValueChange={(value) => updateNotificationPreferences({ longRunReminders: value })}
        />
        <NotificationRow
          label="Weekly goal reminders"
          description="Helpful prompts when you are behind your weekly mileage target."
          value={notificationPreferences.weeklyGoalReminders}
          onValueChange={(value) => updateNotificationPreferences({ weeklyGoalReminders: value })}
        />
        <NotificationRow
          label="Streak reminders"
          description="Encouragement to keep your running streak going."
          value={notificationPreferences.streakReminders}
          onValueChange={(value) => updateNotificationPreferences({ streakReminders: value })}
        />
        <NotificationRow
          label="Recovery reminders"
          description="A reminder to protect easy days after harder training."
          value={notificationPreferences.recoveryReminders}
          onValueChange={(value) => updateNotificationPreferences({ recoveryReminders: value })}
          isLast={true}
        />
      </InfoCard>
    </ScreenScroll>
  );
}

function NotificationRow({
  label,
  description,
  value,
  onValueChange,
  isLast = false,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: isLast ? 4 : 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>{label}</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            {description}
          </Text>
        </View>

        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.primarySoft, true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>
    </View>
  );
}
