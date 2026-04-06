import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import TopProfileBar from "@/components/TopProfileBar";
import { useQuickDrawer } from "@/components/quick-drawer";
import { PageHeader } from "@/components/ui-kit";
import { AnimatedTabScene, ScreenScroll } from "@/components/ui-shell";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getRunningCoachReply, RUNNING_COACH_SUGGESTIONS } from "@/lib/running-coach";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    role: "assistant",
    text: "Ask a running question, pace conversion, split conversion, or race-prep question.",
  },
];

export default function GuideTab() {
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const { openDrawer } = useQuickDrawer();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);

  const guideContext = useMemo(
    () => ({
      profile: {
        goalEvent: profile.goalEvent,
        mileage: profile.mileage,
        pr5k: profile.pr5k,
        prs: profile.prs,
      },
      workouts,
    }),
    [profile.goalEvent, profile.mileage, profile.pr5k, profile.prs, workouts]
  );

  const sendGuideMessage = (prompt: string) => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return;
    }

    const reply = getRunningCoachReply(trimmed, guideContext);

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setQuestion("");
  };

  return (
    <AnimatedTabScene tabKey="guide">
      <ScreenScroll colors={colors}>
        <TopProfileBar imageUri={profile.image} name={profile.name} onAvatarPress={openDrawer} />

        <PageHeader
          eyebrow="Guide"
          title="Your running guide"
          subtitle="Focused on individual runners: workouts, pacing math, splits, race prep, recovery, mileage, and fueling."
        />

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            gap: 14,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Suggested questions</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {RUNNING_COACH_SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => sendGuideMessage(suggestion)}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {[
              "Convert 18:00 for 3 miles to pace",
              "What is 6:00 mile pace for 800m?",
              "How long is 10k at 7:15 pace?",
            ].map((tool) => (
              <Pressable
                key={tool}
                onPress={() => sendGuideMessage(tool)}
                style={{
                  backgroundColor: colors.primarySoft,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{tool}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            gap: 14,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Chat</Text>

          <View style={{ gap: 10 }}>
            {messages.slice(-10).map((message, index) => {
              const fromAssistant = message.role === "assistant";

              return (
                <View
                  key={`${message.role}-${index}-${message.text.slice(0, 20)}`}
                  style={{
                    alignSelf: fromAssistant ? "flex-start" : "flex-end",
                    maxWidth: "92%",
                    backgroundColor: fromAssistant ? colors.cardAlt : colors.primary,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: fromAssistant ? colors.border : colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      color: fromAssistant ? colors.text : colors.background,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {message.text}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about workouts, pace, recovery, race prep..."
              placeholderTextColor={colors.subtext}
              onSubmitEditing={() => sendGuideMessage(question)}
              style={{
                flex: 1,
                backgroundColor: colors.cardAlt,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 14,
              }}
            />

            <Pressable
              onPress={() => sendGuideMessage(question)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 18,
                paddingHorizontal: 18,
                paddingVertical: 14,
                minWidth: 72,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: "700" }}>Send</Text>
            </Pressable>
          </View>
        </View>
      </ScreenScroll>
    </AnimatedTabScene>
  );
}
