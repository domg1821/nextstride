import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { InfoCard, PageHeader, SecondaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";

type ActivityNotification = {
  id: string;
  user_id: string;
  type: "workout_posted" | "comment_added" | "workout_updated" | string;
  message: string;
  related_workout_id?: string | null;
  created_at: string;
  read: boolean;
};

export default function Notifications() {
  const { notificationPreferences, updateNotificationPreferences } = useProfile();
  const { colors } = useThemeColors();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(solo)");
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("notifications")
        .select("id,user_id,type,message,related_workout_id,created_at,read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(`Unable to load notifications: ${loadError.message}`);
        return;
      }

      setNotifications((data as ActivityNotification[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error: updateError } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);

    if (!updateError) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    }
  }, []);

  const openNotification = async (notification: ActivityNotification) => {
    await markAsRead(notification.id);

    if (!notification.related_workout_id) {
      return;
    }

    router.push("/(solo)/explore");
  };

  const roleTitle = "Notifications";
  const roleSubtitle = "Track workout-related updates and reminders without leaving the app.";

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Notifications"
        title={roleTitle}
        subtitle={roleSubtitle}
      />

      <InfoCard
        title={loading ? "Loading activity..." : "Activity Inbox"}
        subtitle="Unread items stay highlighted until you open them or mark them as read."
      >
        <View style={{ gap: 12 }}>
          {!!error ? <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}>{error}</Text> : null}

          {!loading && notifications.length === 0 ? (
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
              No notifications yet. New workout activity and updates will show up here once you start using the app more.
            </Text>
          ) : null}

          {notifications.map((notification) => (
            <View
              key={notification.id}
              style={{
                backgroundColor: notification.read ? colors.cardAlt : colors.primarySoft,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: notification.read ? colors.border : colors.primary,
                padding: 16,
                gap: 10,
              }}
            >
              <Pressable onPress={() => void openNotification(notification)} style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                    {formatTypeLabel(notification.type)}
                  </Text>
                  {!notification.read ? (
                    <View style={{ backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "800" }}>Unread</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 22 }}>{notification.message}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12 }}>{formatTimestamp(notification.created_at)}</Text>
              </Pressable>

              <View style={{ alignItems: "flex-start" }}>
                <SecondaryButton
                  label={notification.read ? "Read" : "Mark as Read"}
                  onPress={() => void markAsRead(notification.id)}
                />
              </View>
            </View>
          ))}
        </View>
      </InfoCard>

      <InfoCard title="Reminder settings" subtitle="These reminder preferences are saved to your account and restore on your next sign-in.">
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
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{description}</Text>
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

function formatTypeLabel(type: string) {
  switch (type) {
    case "workout_posted":
      return "WORKOUT POSTED";
    case "comment_added":
      return "COMMENT ADDED";
    case "workout_updated":
      return "WORKOUT UPDATED";
    default:
      return "ACTIVITY";
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
