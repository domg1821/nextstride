import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "./theme-context";

export default function PremiumScreen() {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 28,
      }}
    >
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>Back</Text>
      </Pressable>

      <View
        style={{
          marginTop: 18,
          backgroundColor: colors.cardAlt,
          borderRadius: 28,
          padding: 22,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.subtext, fontSize: 13, letterSpacing: 0.4 }}>
          NEXTSTRIDE PREMIUM
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 31,
            fontWeight: "700",
            marginTop: 10,
          }}
        >
          More guidance. Better training decisions.
        </Text>
        <Text
          style={{
            color: colors.subtext,
            fontSize: 15,
            lineHeight: 22,
            marginTop: 10,
          }}
        >
          Premium is where NextStride will bring heart rate training, smarter recommendations,
          fueling support, and deeper training insight into one focused runner experience.
        </Text>
      </View>

      <View
        style={{
          marginTop: 20,
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
          Price
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: 34,
            fontWeight: "700",
            marginTop: 8,
          }}
        >
          $2.50/month
        </Text>

        <View style={{ gap: 12, marginTop: 18 }}>
          {[
            "Heart rate based training guidance",
            "Personalized fueling and eating suggestions based on training",
            "Smarter adaptive workout recommendations",
            "More detailed training insights",
          ].map((feature) => (
            <View
              key={feature}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                {`\u2022 ${feature}`}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={{
            marginTop: 20,
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Upgrade to Premium
          </Text>
        </Pressable>

        <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 10 }}>
          Purchase flow placeholder for now. No payment system is connected yet.
        </Text>
      </View>
    </View>
  );
}
