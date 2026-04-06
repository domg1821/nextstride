import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { usePremium } from "@/contexts/premium-context";
import { useThemeColors } from "@/contexts/theme-context";
import type { PostRunFeedback } from "@/lib/premium-coach";
import { buildUpgradePath } from "@/lib/upgrade-route";

export function PostRunFeedbackCard({
  feedback,
}: {
  feedback: PostRunFeedback | null;
}) {
  const { colors } = useThemeColors();
  const { hasAccess, getFeatureGate } = usePremium();
  const unlocked = hasAccess("post_run_feedback");
  const gate = getFeatureGate("post_run_feedback");

  if (unlocked && feedback) {
    return (
      <View
        style={{
          backgroundColor: "#132438",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.2)",
          padding: 18,
          gap: 10,
        }}
      >
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>ELITE POST-RUN FEEDBACK</Text>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{feedback.title}</Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{feedback.summary}</Text>
        <FeedbackLine label="Pacing" body={feedback.pacingNote} />
        <FeedbackLine label="Effort" body={feedback.effortNote} />
        <FeedbackLine label="Next step" body={feedback.nextStep} />
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#132438",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.16)",
        padding: 18,
        gap: 10,
      }}
    >
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>ELITE PREVIEW</Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>Post-run feedback</Text>
      <View
        style={{
          backgroundColor: "rgba(8, 17, 29, 0.58)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(103, 232, 249, 0.1)",
          padding: 14,
          gap: 8,
          opacity: 0.82,
        }}
      >
        <Text style={{ color: "#dcecff", fontSize: 14, fontWeight: "700" }}>
          {feedback?.title || "Strong controlled effort. This is the kind of work that builds aerobic strength."}
        </Text>
        <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19 }}>
          {feedback?.summary || gate.preview}
        </Text>
      </View>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{gate.upgradeCopy}</Text>
      <Pressable
        onPress={() =>
          router.push(
            buildUpgradePath({
              plan: "elite",
              recommendation: "Best choice for unlocking post-run feedback",
            })
          )
        }
        style={{
          alignSelf: "flex-start",
          minHeight: 44,
          borderRadius: 16,
          backgroundColor: "#2563eb",
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>Unlock Elite feedback</Text>
      </Pressable>
    </View>
  );
}

function FeedbackLine({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#dcecff", fontSize: 13, lineHeight: 19 }}>{body}</Text>
    </View>
  );
}
