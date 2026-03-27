import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import TopProfileBar from "../components/TopProfileBar";
import { PageHeader } from "../components/ui-kit";
import { ScreenScroll } from "../components/ui-shell";
import { useProfile } from "../profile-context";
import { useThemeColors } from "../theme-context";
import { buildWeeklyPlan } from "../training-plan";
import { useWorkouts } from "../workout-context";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type TopicMatcher = {
  keywords: string[];
  reply: string | ((question: string) => string);
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    role: "assistant",
    text: "Ask a running question. I answer training, pacing, recovery, workouts, mileage, and fueling like a focused running coach.",
  },
];

export default function Home() {
  const { profile, displayName } = useProfile();
  const { workouts } = useWorkouts();
  const { colors } = useThemeColors();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);

  const mileageGoal = parseFloat(profile.mileage) || 30;
  const totalMilesLogged = workouts.reduce((sum, workout) => {
    const dist = parseFloat(workout.distance);
    return sum + (Number.isNaN(dist) ? 0 : dist);
  }, 0);
  const progressPercent = Math.min((totalMilesLogged / mileageGoal) * 100, 100);

  const weeklyPlan = useMemo(
    () => buildWeeklyPlan(profile.goalEvent || "", mileageGoal, profile.pr5k || ""),
    [mileageGoal, profile.goalEvent, profile.pr5k]
  );
  const todaysWorkout = weeklyPlan[0];
  const secondaryWorkout = weeklyPlan[1];

  const handleAsk = () => {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const reply = getRunningAssistantReply(trimmed);

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setQuestion("");
  };

  return (
    <ScreenScroll colors={colors}>
      <TopProfileBar imageUri={profile.image} name={displayName} showName={true} />

      <PageHeader
        eyebrow="Today"
        title={todaysWorkout?.title || "Workout"}
        subtitle={todaysWorkout?.details || "Your next session will appear here."}
        rightContent={
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 22,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.border,
              minWidth: 82,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", textAlign: "center" }}>
              {Math.round(progressPercent)}%
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2, textAlign: "center" }}>
              weekly
            </Text>
          </View>
        }
      />

      <View
        style={{
          marginTop: 18,
          backgroundColor: colors.card,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          gap: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>
              WEEKLY PROGRESS
            </Text>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700", marginTop: 8 }}>
              {totalMilesLogged.toFixed(1)} mi
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 15, marginTop: 4 }}>
              of {mileageGoal} mi goal
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.cardAlt,
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
              {profile.goalEvent || "Build"}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 3 }}>
              training block
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 12,
            backgroundColor: colors.border,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: colors.primary,
              borderRadius: 999,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          <View
            style={{
              flex: 1.1,
              backgroundColor: colors.cardAlt,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>
              NEXT UP
            </Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 8 }}>
              {secondaryWorkout?.title || "Recovery Run"}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
              {secondaryWorkout?.details || "Your next planned workout will appear here."}
            </Text>
          </View>

          <View
            style={{
              flex: 0.9,
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <MetricChip colors={colors} label="Workouts logged" value={`${workouts.length}`} />
            <MetricChip colors={colors} label="5K PR" value={profile.pr5k || "Not set"} />
          </View>
        </View>
      </View>

      <View
        style={{
          marginTop: 18,
          backgroundColor: colors.card,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          gap: 14,
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
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
              Running Coach
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
              Ask a quick training question and get a direct coach-style answer.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              Coach mode
            </Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {messages.slice(-4).map((message, index) => {
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask about pacing, workouts, recovery, fueling..."
            placeholderTextColor={colors.subtext}
            onSubmitEditing={handleAsk}
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
            onPress={handleAsk}
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
            <Text style={{ color: colors.background, fontSize: 14, fontWeight: "700" }}>
              Send
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenScroll>
  );
}

function MetricChip({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function getRunningAssistantReply(input: string) {
  const question = input.toLowerCase();
  const calculationReply = getRunningCalculationReply(question);

  if (calculationReply) {
    return calculationReply;
  }

  const runningIntentKeywords = [
    "run",
    "running",
    "workout",
    "pace",
    "pacing",
    "recovery",
    "recover",
    "easy",
    "tempo",
    "threshold",
    "interval",
    "track",
    "long run",
    "race",
    "mile",
    "mileage",
    "effort",
    "fuel",
    "eat",
    "carb",
    "sore",
    "fatigue",
    "tired",
    "training",
    "consistency",
    "speed work",
    "400",
    "600",
    "800",
    "1000",
    "1k",
    "5k",
    "10k",
    "half",
    "marathon",
  ];

  if (!runningIntentKeywords.some((keyword) => question.includes(keyword))) {
    return "I'm focused on running and training questions right now.";
  }

  const topicMatchers: TopicMatcher[] = [
    {
      keywords: ["easy run", "easy day", "easy pace", "easy effort"],
      reply:
        "Easy runs should feel relaxed and conversational. Breathe under control, keep the pace honest, and finish feeling like you could keep going instead of squeezing extra fitness out of the day.",
    },
    {
      keywords: ["tempo", "threshold"],
      reply:
        "Tempo work should feel strong, steady, and controlled. You should be working, but not straining early. If you cannot hold rhythm, the pace is too aggressive.",
    },
    {
      keywords: ["interval", "track", "speed work", "speedwork"],
      reply: (currentQuestion) =>
        currentQuestion.includes("how often")
          ? "Most runners do best with one speed-focused workout per week. Two can work if your mileage, recovery, and easy days are solid, but only if the rest of the week stays under control."
          : "Intervals should be fast enough to be specific, but controlled enough that the full session stays quality. Smooth reps and consistent splits are usually better than one big rep followed by a fade.",
    },
    {
      keywords: ["long run"],
      reply:
        "Long runs should usually stay aerobic. Start relaxed, keep the effort steady, and only finish harder when the plan calls for it. The goal is durable endurance, not turning every long run into a race effort.",
    },
    {
      keywords: ["recovery day", "recovery", "day after a hard workout", "after a hard workout"],
      reply:
        "The day after a hard workout should be easy or off. Keep the run short and relaxed, focus on sleep, food, and hydration, and avoid adding intensity just because the legs feel decent after warming up.",
    },
    {
      keywords: ["sore", "soreness", "fatigue", "fatigued", "tired legs", "heavy legs"],
      reply:
        "If you are sore or carrying fatigue, protect the next few days. Keep the run easy, cut volume if needed, and do not force pace. Good training comes from absorbing work, not stacking tired efforts.",
    },
    {
      keywords: ["fuel", "eat", "before a run", "before run", "after a run", "after run", "carb"],
      reply: (currentQuestion) =>
        currentQuestion.includes("after")
          ? "After harder or longer runs, get in carbs and some protein fairly soon. The goal is to start recovery early so the next workout does not suffer."
          : "Before a run, keep fueling simple and familiar. Easy carbs work well, and harder or longer sessions usually go better with a light carb-focused meal 2 to 3 hours beforehand.",
    },
    {
      keywords: ["race", "race prep", "race preparation", "taper"],
      reply:
        "Race preparation should simplify the week, not add panic. Keep workouts short and specific, protect freshness, stay on top of sleep and fueling, and arrive wanting to run instead of trying to prove fitness in training.",
    },
    {
      keywords: ["mileage", "weekly mileage", "increase mileage", "increase my mileage"],
      reply:
        "Build mileage gradually enough that your easy days still feel easy. If adding volume makes workouts sloppy or recovery inconsistent, the jump was too aggressive.",
    },
    {
      keywords: ["effort", "how hard", "hard should"],
      reply:
        "Match effort to the purpose of the day. Easy days should stay comfortable, workouts should feel purposeful but controlled, and hard days should challenge you without wrecking the rest of the week.",
    },
    {
      keywords: ["consistency", "stay consistent", "training consistency"],
      reply:
        "Consistency usually comes from doing slightly less than your absolute maximum, then repeating it week after week. Protect the easy days, recover well, and avoid turning one missed workout into a lost week.",
    },
    {
      keywords: ["workout", "session"],
      reply:
        "A good workout should have a clear purpose. Know whether the day is about aerobic strength, threshold rhythm, or speed, and keep the session controlled enough that it supports the rest of the week.",
    },
    {
      keywords: ["pace", "pacing", "split", "splits"],
      reply:
        "Good pacing feels controlled early and strong late. If the first part of the run or workout feels too easy to be true, that is often exactly right. Starting too hard usually costs more than it gives back.",
    },
  ];

  for (const matcher of topicMatchers) {
    if (matcher.keywords.some((keyword) => question.includes(keyword))) {
      return typeof matcher.reply === "function" ? matcher.reply(question) : matcher.reply;
    }
  }

  return "Keep most runs controlled, make your hard days specific, and let consistency do the heavy lifting. Ask about workouts, pacing, recovery, mileage, or fueling if you want something more specific.";
}

function getRunningCalculationReply(question: string) {
  const normalized = question.replace(/\?/g, "").replace(/\s+/g, " ").trim();

  const paceFromDistanceAndTime = normalized.match(
    /(\d+(?:\.\d+)?)\s*(mile|miles|mi|km|k)\s+(?:in)\s+(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)?/
  );

  if (paceFromDistanceAndTime) {
    const distanceValue = parseFloat(paceFromDistanceAndTime[1]);
    const distanceUnit = paceFromDistanceAndTime[2];
    const timeValue = paceFromDistanceAndTime[3];
    const timeUnit = paceFromDistanceAndTime[4];
    const totalSeconds = parseDurationToSeconds(timeValue, timeUnit);
    const distanceMiles = convertDistanceToMiles(distanceValue, distanceUnit);

    if (totalSeconds && distanceMiles > 0) {
      return `That's ${formatPace(totalSeconds / distanceMiles)} per mile pace.`;
    }
  }

  const finishTimeFromPaceAndDistance = normalized.match(
    /(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)?\s*(?:per\s*)?(mile|mi|km|k)\s+(?:pace\s*)?(?:for\s*)?(\d+(?:\.\d+)?)\s*(mile|miles|mi|km|k)/
  );

  if (finishTimeFromPaceAndDistance) {
    const paceValue = finishTimeFromPaceAndDistance[1];
    const paceUnitText = finishTimeFromPaceAndDistance[3];
    const distanceValue = parseFloat(finishTimeFromPaceAndDistance[4]);
    const distanceUnit = finishTimeFromPaceAndDistance[5];
    const paceSeconds = parseDurationToSeconds(paceValue, finishTimeFromPaceAndDistance[2]);
    const distanceMiles = convertDistanceToMiles(distanceValue, distanceUnit);

    if (paceSeconds && distanceMiles > 0) {
      const pacePerMile =
        paceUnitText === "km" || paceUnitText === "k" ? paceSeconds * 1.609344 : paceSeconds;
      return `That comes out to ${formatDuration(pacePerMile * distanceMiles)} total time.`;
    }
  }

  const raceDistancePace = normalized.match(
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*(5k|10k|half marathon|half|marathon)\s+pace/
  );

  if (raceDistancePace) {
    const raceTime = parseDurationToSeconds(raceDistancePace[1]);
    const raceMiles = convertDistanceToMiles(1, raceDistancePace[2]);

    if (raceTime && raceMiles > 0) {
      return `That's ${formatPace(raceTime / raceMiles)} per mile pace.`;
    }
  }

  const repToMilePace = normalized.match(
    /(\d{1,2}:\d{2}(?::\d{2})?|\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)?\s*(?:for\s*)?(400|600|800|1000|1k)\s*(?:m|meter|meters)?(?:\s*(?:pace|split))?(?:\s*(?:converted to mile|to mile|mile pace))?/
  );

  if (
    repToMilePace &&
    (normalized.includes("mile pace") ||
      normalized.includes("to mile") ||
      normalized.includes("converted") ||
      normalized.includes("pace"))
  ) {
    const repTime = parseDurationToSeconds(repToMilePace[1], repToMilePace[2]);
    const repMeters = repToMilePace[3] === "1k" ? 1000 : parseFloat(repToMilePace[3]);

    if (repTime && repMeters > 0) {
      const milePaceSeconds = repTime * (1609.344 / repMeters);
      return `${formatOriginalRep(repToMilePace[1], repToMilePace[2])} for ${formatRepDistance(repToMilePace[3])} is about ${formatPace(milePaceSeconds)} mile pace.`;
    }
  }

  const splitFromMilePace = normalized.match(
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:mile|mi)\s+pace\s+(?:for\s*)?(400|600|800|1000|1k)\s*(?:m|meter|meters)?/
  );

  if (splitFromMilePace) {
    const milePaceSeconds = parseDurationToSeconds(splitFromMilePace[1]);
    const repMeters = splitFromMilePace[2] === "1k" ? 1000 : parseFloat(splitFromMilePace[2]);

    if (milePaceSeconds && repMeters > 0) {
      return `${formatPace(milePaceSeconds * (repMeters / 1609.344))} for ${formatRepDistance(splitFromMilePace[2])}.`;
    }
  }

  return null;
}

function parseDurationToSeconds(value: string, unit?: string) {
  const trimmed = value.trim();

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);

    if (parts.some((part) => Number.isNaN(part))) {
      return null;
    }

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return null;
  }

  const numeric = Number(trimmed);

  if (Number.isNaN(numeric)) {
    return null;
  }

  const normalizedUnit = unit?.toLowerCase();

  if (!normalizedUnit || normalizedUnit.startsWith("min")) {
    return numeric * 60;
  }

  if (normalizedUnit.startsWith("sec")) {
    return numeric;
  }

  if (normalizedUnit.startsWith("hour") || normalizedUnit.startsWith("hr")) {
    return numeric * 3600;
  }

  return numeric;
}

function convertDistanceToMiles(value: number, unit: string) {
  const normalizedUnit = unit.toLowerCase();

  if (normalizedUnit === "mile" || normalizedUnit === "miles" || normalizedUnit === "mi") {
    return value;
  }

  if (normalizedUnit === "km") {
    return value * 0.621371;
  }

  if (normalizedUnit === "k") {
    if (value === 5) {
      return 3.106855;
    }

    if (value === 10) {
      return 6.21371;
    }

    return value * 0.621371;
  }

  if (normalizedUnit === "half" || normalizedUnit === "half marathon") {
    return 13.1094;
  }

  if (normalizedUnit === "marathon") {
    return 26.2188;
  }

  return value;
}

function formatPace(totalSeconds: number) {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number) {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRepDistance(rep: string) {
  return rep === "1k" ? "1K" : `${rep}m`;
}

function formatOriginalRep(value: string, unit?: string) {
  const normalizedUnit = unit?.toLowerCase();

  if (!normalizedUnit || value.includes(":")) {
    return value;
  }

  if (normalizedUnit.startsWith("sec")) {
    return `${value} seconds`;
  }

  if (normalizedUnit.startsWith("min")) {
    return `${value} minutes`;
  }

  return value;
}
