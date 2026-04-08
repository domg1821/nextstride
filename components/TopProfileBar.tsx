import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { ThemeTokens } from "@/constants/theme";
import { useThemeColors } from "@/contexts/theme-context";

type Props = {
  imageUri?: string;
  name?: string;
  showName?: boolean;
  onRightPress?: () => void;
  rightIcon?: string;
  onAvatarPress?: () => void;
};

export default function TopProfileBar({
  imageUri,
  name,
  showName = false,
  onRightPress,
  rightIcon = "*",
  onAvatarPress,
}: Props) {
  const { colors } = useThemeColors();
  const openNotifications = () => router.push("/notifications");

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minHeight: 68,
            borderRadius: ThemeTokens.radii.lg,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }, { translateY: pressed ? 1 : 0 }],
            ...ThemeTokens.shadows.low,
          })}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            />
          ) : (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.card,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>
                {name ? name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
          )}

          <View style={{ minWidth: showName ? 112 : 0, paddingRight: 4 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: showName ? 20 : 15,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              {name || "Runner"}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 3, fontWeight: "600" }}>
              Quick access
            </Text>
          </View>

          {onAvatarPress ? (
            <Ionicons name="chevron-down" size={16} color={colors.subtext} />
          ) : null}
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.push("/welcome")}
          style={({ pressed }) => ({
            borderRadius: 18,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 44,
            paddingHorizontal: 14,
            paddingVertical: 10,
            justifyContent: "center",
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
            Website
          </Text>
        </Pressable>

        <Pressable
          onPress={openNotifications}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </Pressable>

        {onRightPress && (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
              {rightIcon}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
