import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { InfoCard, PageHeader, PrimaryButton, SecondaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import {
  type AbilityOption,
  type FrequencyOption,
  type GoalOption,
  type LongestRunOption,
  type MileageOption,
  type OnboardingSurveyAnswers,
  type RaceDistanceOption,
  type RunningExperienceOption,
  type TrainingPreferenceOption,
  useProfile,
} from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

type QuestionStep =
  | "welcome"
  | "runningExperience"
  | "canRunTwentyMinutes"
  | "currentFrequency"
  | "weeklyMileageRange"
  | "longestRecentRun"
  | "mainGoal"
  | "preferredTrainingDays"
  | "recentResult"
  | "goalRaceDistance"
  | "goalTime"
  | "goalRaceDate";

type Option<T extends string | number> = {
  value: T;
  title: string;
  detail: string;
};

type StepConfig =
  | {
      kind: "welcome";
      title: string;
      subtitle: string;
    }
  | {
      kind: "options";
      title: string;
      subtitle: string;
      options: Option<string | number>[];
    }
  | {
      kind: "form";
      title: string;
      subtitle: string;
    };

const STEPS: QuestionStep[] = [
  "welcome",
  "runningExperience",
  "canRunTwentyMinutes",
  "currentFrequency",
  "weeklyMileageRange",
  "longestRecentRun",
  "mainGoal",
  "preferredTrainingDays",
  "recentResult",
  "goalRaceDistance",
  "goalTime",
  "goalRaceDate",
];

const EXPERIENCE_OPTIONS: Option<RunningExperienceOption>[] = [
  { value: "completely_new", title: "Completely new", detail: "You are just getting started with running." },
  { value: "inconsistent", title: "Inconsistent", detail: "You run sometimes, but not on a steady rhythm yet." },
  { value: "somewhat_consistent", title: "Somewhat consistent", detail: "You already have some routine and recent running history." },
  { value: "very_consistent", title: "Very consistent", detail: "Running is already a regular part of your week." },
];

const ABILITY_OPTIONS: Option<AbilityOption>[] = [
  { value: "no", title: "No", detail: "You need short intervals or walk breaks right now." },
  { value: "barely", title: "Barely", detail: "You can do it on a good day, but it still feels challenging." },
  { value: "yes", title: "Yes", detail: "You can hold an easy run continuously for 20 minutes." },
];

const FREQUENCY_OPTIONS: Option<FrequencyOption>[] = [
  { value: "0", title: "0 days", detail: "You are not currently running each week." },
  { value: "1-2", title: "1-2 days", detail: "You run occasionally but not often yet." },
  { value: "3-4", title: "3-4 days", detail: "You already have a steady weekly routine." },
  { value: "5-6", title: "5-6 days", detail: "You train most days of the week." },
  { value: "7", title: "7 days", detail: "You are currently running every day." },
];

const MILEAGE_OPTIONS: Option<MileageOption>[] = [
  { value: "0", title: "0 miles", detail: "No weekly running mileage right now." },
  { value: "1-10", title: "1-10", detail: "Low weekly volume or just getting started." },
  { value: "11-20", title: "11-20", detail: "A modest aerobic base is already there." },
  { value: "21-35", title: "21-35", detail: "Consistent mid-volume training." },
  { value: "36+", title: "36+", detail: "Higher weekly volume and stronger aerobic background." },
];

const LONGEST_RUN_OPTIONS: Option<LongestRunOption>[] = [
  { value: "less_than_2", title: "Less than 2 miles", detail: "Your recent long efforts are still short." },
  { value: "3-5", title: "3-5 miles", detail: "You can already handle a small steady run." },
  { value: "6-8", title: "6-8 miles", detail: "You have some endurance foundation in place." },
  { value: "9+", title: "9+ miles", detail: "Longer aerobic work is already familiar." },
];

const GOAL_OPTIONS: Option<GoalOption>[] = [
  { value: "start_running", title: "Start running", detail: "Build the habit and complete runs comfortably." },
  { value: "get_fitter", title: "Get fitter", detail: "Improve health, energy, and consistency." },
  { value: "run_5k", title: "Run a 5K", detail: "Train toward your first or next 5K." },
  { value: "run_10k", title: "Run a 10K", detail: "Build more endurance for a longer race." },
  { value: "run_half", title: "Run a half", detail: "Work toward half-marathon endurance." },
  { value: "run_marathon", title: "Run a marathon", detail: "Build a long-range aerobic foundation." },
  { value: "get_faster", title: "Get faster", detail: "Improve pace and structured training quality." },
];

const TRAINING_PREFERENCE_OPTIONS: Option<TrainingPreferenceOption>[] = [
  { value: 3, title: "3 days", detail: "A lighter schedule with more recovery room." },
  { value: 4, title: "4 days", detail: "A balanced weekly structure." },
  { value: 5, title: "5 days", detail: "More consistency while keeping breathing room." },
  { value: 6, title: "6 days", detail: "Frequent training with careful recovery." },
  { value: 7, title: "7 days", detail: "You want a full-week routine." },
];

const RACE_DISTANCE_OPTIONS: Option<RaceDistanceOption>[] = [
  { value: "none", title: "No recent result", detail: "Skip this if you do not have a recent race or time trial." },
  { value: "800", title: "800m", detail: "Short race or time trial result." },
  { value: "1600/mile", title: "1600 / Mile", detail: "Mile-style recent effort." },
  { value: "5k", title: "5K", detail: "A recent 5K result or hard time trial." },
  { value: "10k", title: "10K", detail: "A recent 10K race result." },
  { value: "half marathon", title: "Half marathon", detail: "A recent half-marathon result." },
  { value: "marathon", title: "Marathon", detail: "A recent marathon result." },
];

const GOAL_RACE_OPTIONS: Option<Exclude<RaceDistanceOption, "none">>[] = [
  { value: "800", title: "800m", detail: "Speed-focused race prep." },
  { value: "1600/mile", title: "1600 / Mile", detail: "Middle-distance style goal." },
  { value: "5k", title: "5K", detail: "Short road or track focus." },
  { value: "10k", title: "10K", detail: "Longer aerobic race focus." },
  { value: "half marathon", title: "Half marathon", detail: "Build toward steady endurance." },
  { value: "marathon", title: "Marathon", detail: "Long-range endurance build." },
];

const EMPTY_ANSWERS: OnboardingSurveyAnswers = {
  runningExperience: "",
  canRunTwentyMinutes: "",
  currentFrequency: "",
  weeklyMileageRange: "",
  longestRecentRun: "",
  mainGoal: "",
  preferredTrainingDays: 0,
  recentResultDistance: "",
  recentResultTime: "",
  goalRaceDistance: "",
  goalTime: "",
  goalRaceDate: "",
};

export default function Onboarding() {
  const { colors } = useThemeColors();
  const { authReady, isAuthenticated, profile, completeOnboarding } = useProfile();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingSurveyAnswers>(() => ({
    ...EMPTY_ANSWERS,
    ...profile.onboardingAnswers,
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (profile.onboardingComplete) {
      router.replace("/(tabs)");
    }
  }, [authReady, isAuthenticated, profile.onboardingComplete]);

  const step = STEPS[stepIndex];
  const questionIndex = Math.max(stepIndex - 1, 0);
  const progressPercent = (questionIndex / (STEPS.length - 2)) * 100;
  const screen = useMemo(() => getScreenConfig(step), [step]);

  const updateAnswer = (key: keyof OnboardingSurveyAnswers, value: string | number) => {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
  };

  const handleOptionSelect = (value: string | number) => {
    if (loading || screen.kind !== "options") {
      return;
    }

    updateAnswer(step as keyof OnboardingSurveyAnswers, value);
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const validateCurrentStep = () => {
    switch (step) {
      case "recentResult":
        if (!answers.recentResultDistance) {
          return "Please choose a recent result distance.";
        }
        if (answers.recentResultDistance !== "none" && !answers.recentResultTime.trim()) {
          return "Please enter your recent result time.";
        }
        return "";
      case "goalRaceDistance":
        if (!answers.goalRaceDistance) {
          return "Please choose your goal race distance.";
        }
        return "";
      case "goalTime":
        if (!answers.goalTime.trim()) {
          return "Please enter your goal time.";
        }
        return "";
      default:
        return "";
    }
  };

  const handleContinue = async () => {
    if (loading) {
      return;
    }

    if (step === "welcome") {
      setStepIndex(1);
      return;
    }

    const validationError = validateCurrentStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (stepIndex === STEPS.length - 1) {
      setLoading(true);

      try {
        const result = await completeOnboarding(answers);

        if (!result.ok) {
          setError(result.error || "Unable to save onboarding.");
          return;
        }

        router.replace("/(tabs)");
      } finally {
        setLoading(false);
      }

      return;
    }

    setError("");
    setStepIndex((current) => current + 1);
  };

  const handleBack = () => {
    if (loading) {
      return;
    }

    setError("");
    setStepIndex((current) => Math.max(0, current - 1));
  };

  if (!authReady || !isAuthenticated || profile.onboardingComplete) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 18 }}>
          Preparing onboarding
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 22, marginTop: 8, textAlign: "center" }}>
          Loading your account and survey status.
        </Text>
      </View>
    );
  }

  return (
    <ScreenScroll colors={colors}>
      <PageHeader
        eyebrow={step === "welcome" ? "New Runner Setup" : `Step ${questionIndex} of ${STEPS.length - 1}`}
        title={screen.title}
        subtitle={screen.subtitle}
      />

      {step !== "welcome" ? (
        <InfoCard>
          <View
            style={{
              height: 10,
              backgroundColor: colors.cardAlt,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.max(10, progressPercent)}%`,
                height: "100%",
                backgroundColor: colors.primary,
                borderRadius: 999,
              }}
            />
          </View>
          <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 12 }}>
            We&apos;ll use these answers to tailor your training level, workout style, and pace guidance.
          </Text>
        </InfoCard>
      ) : null}

      {screen.kind === "welcome" ? (
        <InfoCard>
          <View style={{ gap: 18 }}>
            <View
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 22,
                gap: 10,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                PERSONALIZED START
              </Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>
                Welcome to NextStride
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23 }}>
                Let&apos;s build your personalized training plan.
              </Text>
            </View>

            <PrimaryButton label="Get Started" onPress={handleContinue} />
          </View>
        </InfoCard>
      ) : null}

      {screen.kind === "options" ? (
        <View style={{ gap: 12 }}>
          {screen.options.map((option) => (
            <Pressable
              key={String(option.value)}
              onPress={() => handleOptionSelect(option.value)}
              disabled={loading}
              style={{
                backgroundColor: colors.card,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 22,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 28 }}>
                {option.title}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                {option.detail}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {screen.kind === "form" && step === "recentResult" ? (
        <InfoCard>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Recent race or time trial</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
            We&apos;ll use this to estimate training paces when possible.
          </Text>

          <View style={{ gap: 10, marginTop: 18 }}>
            {RACE_DISTANCE_OPTIONS.map((option) => {
              const selected = answers.recentResultDistance === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateAnswer("recentResultDistance", option.value)}
                  style={{
                    backgroundColor: selected ? colors.primarySoft : colors.cardAlt,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{option.title}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                    {option.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={answers.recentResultTime}
            onChangeText={(value) => updateAnswer("recentResultTime", value)}
            placeholder="Recent time (example: 24:18)"
            placeholderTextColor={colors.subtext}
            style={inputStyle(colors)}
          />
        </InfoCard>
      ) : null}

      {screen.kind === "form" && step === "goalTime" ? (
        <InfoCard>
          <TextInput
            value={answers.goalTime}
            onChangeText={(value) => updateAnswer("goalTime", value)}
            placeholder="Goal time (example: 21:30)"
            placeholderTextColor={colors.subtext}
            style={inputStyle(colors)}
          />
        </InfoCard>
      ) : null}

      {screen.kind === "form" && step === "goalRaceDate" ? (
        <InfoCard>
          <TextInput
            value={answers.goalRaceDate}
            onChangeText={(value) => updateAnswer("goalRaceDate", value)}
            placeholder="Goal race date, optional (YYYY-MM-DD)"
            placeholderTextColor={colors.subtext}
            style={inputStyle(colors)}
          />
        </InfoCard>
      ) : null}

      {!!error ? (
        <InfoCard>
          <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700", lineHeight: 21 }}>{error}</Text>
        </InfoCard>
      ) : null}

      {step !== "welcome" ? (
        <View style={{ gap: 12 }}>
          {loading ? (
            <InfoCard>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                  Saving your personalized training plan...
                </Text>
              </View>
            </InfoCard>
          ) : null}

          {screen.kind === "form" ? (
            <PrimaryButton
              label={stepIndex === STEPS.length - 1 ? "Finish Setup" : "Continue"}
              onPress={() => void handleContinue()}
            />
          ) : null}
          <SecondaryButton label="Back" onPress={handleBack} />
        </View>
      ) : null}
    </ScreenScroll>
  );
}

function getScreenConfig(step: QuestionStep): StepConfig {
  switch (step) {
    case "welcome":
      return {
        kind: "welcome",
        title: "Welcome to NextStride",
        subtitle: "Let's build your personalized training plan",
      };
    case "runningExperience":
      return {
        kind: "options",
        title: "How would you describe your running experience?",
        subtitle: "We'll start at the right level instead of guessing.",
        options: EXPERIENCE_OPTIONS,
      };
    case "canRunTwentyMinutes":
      return {
        kind: "options",
        title: "Can you run 20 minutes continuously without stopping?",
        subtitle: "This separates walk/run plans from steady running plans.",
        options: ABILITY_OPTIONS,
      };
    case "currentFrequency":
      return {
        kind: "options",
        title: "How many days per week do you currently run?",
        subtitle: "Your current routine matters as much as your goal.",
        options: FREQUENCY_OPTIONS,
      };
    case "weeklyMileageRange":
      return {
        kind: "options",
        title: "What is your weekly mileage?",
        subtitle: "A quick volume estimate helps shape your starting workload.",
        options: MILEAGE_OPTIONS,
      };
    case "longestRecentRun":
      return {
        kind: "options",
        title: "What's your longest recent run?",
        subtitle: "This shows how much endurance you already have in the tank.",
        options: LONGEST_RUN_OPTIONS,
      };
    case "mainGoal":
      return {
        kind: "options",
        title: "What is your main goal?",
        subtitle: "We'll tune your plan around the outcome you care about most.",
        options: GOAL_OPTIONS,
      };
    case "preferredTrainingDays":
      return {
        kind: "options",
        title: "How many days per week do you want to train?",
        subtitle: "We'll match your plan to the schedule you actually want to keep.",
        options: TRAINING_PREFERENCE_OPTIONS,
      };
    case "recentResult":
      return {
        kind: "form",
        title: "Do you have a recent race or time trial result?",
        subtitle: "Add the distance and time if you have one.",
      };
    case "goalRaceDistance":
      return {
        kind: "options",
        title: "What is your goal race distance?",
        subtitle: "This helps shape your long-term training focus.",
        options: GOAL_RACE_OPTIONS,
      };
    case "goalTime":
      return {
        kind: "form",
        title: "What is your goal time?",
        subtitle: "This gives the plan a sharper target.",
      };
    case "goalRaceDate":
      return {
        kind: "form",
        title: "What is your goal race date?",
        subtitle: "Optional, but helpful for timing future progress.",
      };
  }
}

function inputStyle(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    marginTop: 18,
  } as const;
}
