import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
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
          style={{ borderRadius: 26 }}
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
        </Pressable>

        {showName && (
          <Text
            style={{
              color: colors.text,
              fontSize: 26,
              fontWeight: "700",
              marginLeft: 14,
            }}
          >
            {name || "Runner"}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.push("/welcome")}
          style={{
            borderRadius: 18,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
            Website
          </Text>
        </Pressable>

        <Pressable
          onPress={openNotifications}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </Pressable>

        {onRightPress && (
          <Pressable
            onPress={onRightPress}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
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
