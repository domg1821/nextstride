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
import {
  getGoalDatePrompt,
  getGoalDistancePrompt,
  getGoalHeadline,
  getGoalTimePrompt,
  getRecentResultHelp,
  shouldAskRaceGoal,
} from "@/lib/onboarding-personalization";
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
      helper?: string;
    }
  | {
      kind: "form";
      title: string;
      subtitle: string;
      helper?: string;
      optional?: boolean;
    };

const BASE_STEPS: QuestionStep[] = [
  "welcome",
  "runningExperience",
  "canRunTwentyMinutes",
  "currentFrequency",
  "weeklyMileageRange",
  "longestRecentRun",
  "mainGoal",
  "preferredTrainingDays",
  "recentResult",
];

const EXPERIENCE_OPTIONS: Option<RunningExperienceOption>[] = [
  { value: "completely_new", title: "Brand new", detail: "You are just getting started and want simple guidance." },
  { value: "inconsistent", title: "Getting back into it", detail: "You run some weeks, but it has not settled into a steady routine yet." },
  { value: "somewhat_consistent", title: "Fairly consistent", detail: "You already have some rhythm and recent training behind you." },
  { value: "very_consistent", title: "Very consistent", detail: "Running is already a regular part of your week." },
];

const ABILITY_OPTIONS: Option<AbilityOption>[] = [
  { value: "no", title: "Not yet", detail: "You still need short run-walk breaks, and that is completely fine." },
  { value: "barely", title: "On a good day", detail: "You can do it, but it still feels like a stretch." },
  { value: "yes", title: "Yes", detail: "You can hold an easy run continuously for about 20 minutes." },
];

const FREQUENCY_OPTIONS: Option<FrequencyOption>[] = [
  { value: "0", title: "0 days", detail: "You are not running regularly yet." },
  { value: "1-2", title: "1-2 days", detail: "You run occasionally and are building back into it." },
  { value: "3-4", title: "3-4 days", detail: "You already have a solid weekly routine." },
  { value: "5-6", title: "5-6 days", detail: "You train most days of the week." },
  { value: "7", title: "7 days", detail: "You currently run every day." },
];

const MILEAGE_OPTIONS: Option<MileageOption>[] = [
  { value: "0", title: "0 miles", detail: "No weekly running volume right now." },
  { value: "1-10", title: "1-10 miles", detail: "A light week or a newer running base." },
  { value: "11-20", title: "11-20 miles", detail: "A modest base with room to grow." },
  { value: "21-35", title: "21-35 miles", detail: "A steady training background." },
  { value: "36+", title: "36+ miles", detail: "Higher volume and a stronger endurance base." },
];

const LONGEST_RUN_OPTIONS: Option<LongestRunOption>[] = [
  { value: "less_than_2", title: "Under 2 miles", detail: "Your longest recent efforts are still short." },
  { value: "3-5", title: "3-5 miles", detail: "You can already handle a small steady run." },
  { value: "6-8", title: "6-8 miles", detail: "You have some endurance built already." },
  { value: "9+", title: "9+ miles", detail: "Longer runs are already part of your routine." },
];

const GOAL_OPTIONS: Option<GoalOption>[] = [
  { value: "start_running", title: "Start running consistently", detail: "Build the habit and feel more comfortable week by week." },
  { value: "get_fitter", title: "Get fitter", detail: "Improve your health, energy, and overall consistency." },
  { value: "run_5k", title: "Train for a 5K", detail: "Build toward your first or next 5K." },
  { value: "run_10k", title: "Train for a 10K", detail: "Build more endurance for a longer race." },
  { value: "run_half", title: "Train for a half marathon", detail: "Work toward stronger endurance and steadier pacing." },
  { value: "run_marathon", title: "Train for a marathon", detail: "Build a long-range endurance foundation." },
  { value: "get_faster", title: "Get faster", detail: "Train with more structure and sharper pacing goals." },
];

const TRAINING_PREFERENCE_OPTIONS: Option<TrainingPreferenceOption>[] = [
  { value: 3, title: "3 days", detail: "A lighter plan with more breathing room." },
  { value: 4, title: "4 days", detail: "A balanced weekly structure for most runners." },
  { value: 5, title: "5 days", detail: "More consistency without crowding every day." },
  { value: 6, title: "6 days", detail: "Frequent training with planned recovery." },
  { value: 7, title: "7 days", detail: "A full-week routine." },
];

const RACE_DISTANCE_OPTIONS: Option<RaceDistanceOption>[] = [
  { value: "none", title: "No recent result", detail: "Skip this if you do not have a recent race or time trial." },
  { value: "800", title: "800m", detail: "A short race or hard time trial." },
  { value: "1600/mile", title: "1600 / Mile", detail: "A mile-style recent effort." },
  { value: "5k", title: "5K", detail: "A recent 5K race or hard effort." },
  { value: "10k", title: "10K", detail: "A recent 10K race or hard effort." },
  { value: "half marathon", title: "Half marathon", detail: "A recent half-marathon result." },
  { value: "marathon", title: "Marathon", detail: "A recent marathon result." },
];

const GOAL_RACE_OPTIONS: Option<Exclude<RaceDistanceOption, "none">>[] = [
  { value: "800", title: "800m", detail: "Speed-focused race prep." },
  { value: "1600/mile", title: "1600 / Mile", detail: "Middle-distance race focus." },
  { value: "5k", title: "5K", detail: "A classic speed-endurance goal." },
  { value: "10k", title: "10K", detail: "Aerobic strength with sharper pacing." },
  { value: "half marathon", title: "Half marathon", detail: "Endurance and steady effort become more important." },
  { value: "marathon", title: "Marathon", detail: "Long-range endurance and long-run progress matter most." },
];

const EMPTY_ANSWERS: OnboardingSurveyAnswers = {
  accountType: "",
  runningExperience: "",
  canRunTwentyMinutes: "",
  currentFrequency: "",
  weeklyMileageRange: "",
  longestRecentRun: "",
  mainGoal: "",
  preferredTrainingDays: 4,
  recentResultDistance: "",
  recentResultTime: "",
  goalRaceDistance: "",
  goalTime: "",
  goalRaceDate: "",
};

export default function Onboarding() {
  const { colors } = useThemeColors();
  const { authReady, isAuthenticated, profile, completeOnboarding, appHomeRoute } = useProfile();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingSurveyAnswers>(() => ({
    ...EMPTY_ANSWERS,
    ...profile.onboardingAnswers,
    accountType: "solo_runner",
    preferredTrainingDays: profile.onboardingAnswers.preferredTrainingDays || 4,
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = useMemo(() => getVisibleSteps(answers), [answers]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const questionIndex = Math.max(stepIndex, 0);
  const totalQuestions = Math.max(steps.length - 1, 1);
  const progressPercent = step === "welcome" ? 0 : (questionIndex / totalQuestions) * 100;
  const screen = useMemo(() => getScreenConfig(step, answers), [answers, step]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (profile.onboardingComplete) {
      router.replace(appHomeRoute);
    }
  }, [appHomeRoute, authReady, isAuthenticated, profile.onboardingComplete]);

  useEffect(() => {
    setStepIndex((current) => Math.min(current, steps.length - 1));
  }, [steps.length]);

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

    if (step === "mainGoal" && typeof value === "string") {
      const nextGoalRaceDistance = getDefaultGoalDistance(value as GoalOption);
      setAnswers((current) => ({
        ...current,
        mainGoal: value as GoalOption,
        goalRaceDistance: nextGoalRaceDistance || current.goalRaceDistance,
        goalTime: shouldAskRaceGoal(value as GoalOption) ? current.goalTime : "",
        goalRaceDate: shouldAskRaceGoal(value as GoalOption) ? current.goalRaceDate : "",
      }));
      setError("");
      setStepIndex((current) => Math.min(current + 1, getVisibleSteps({
        ...answers,
        mainGoal: value as GoalOption,
        goalRaceDistance: nextGoalRaceDistance || answers.goalRaceDistance,
      }).length - 1));
      return;
    }

    updateAnswer(step as keyof OnboardingSurveyAnswers, value);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleContinue = async () => {
    if (loading) {
      return;
    }

    if (step === "welcome") {
      setStepIndex(1);
      return;
    }

    const validationError = validateCurrentStep(step, answers);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (stepIndex === steps.length - 1) {
      const finalAnswers = sanitizeAnswers({
        ...answers,
        accountType: "solo_runner",
      });
      setLoading(true);

      try {
        const result = await completeOnboarding(finalAnswers);

        if (!result.ok) {
          setError(result.error || "Unable to save onboarding.");
          return;
        }

        router.replace(appHomeRoute);
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

  const handleSkipOptional = () => {
    if (loading) {
      return;
    }

    if (step === "recentResult") {
      setAnswers((current) => ({
        ...current,
        recentResultDistance: "none",
        recentResultTime: "",
      }));
      setError("");
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

    if (step === "goalTime") {
      setAnswers((current) => ({
        ...current,
        goalTime: "",
      }));
      setError("");
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

    if (step === "goalRaceDate") {
      setAnswers((current) => ({
        ...current,
        goalRaceDate: "",
      }));
      setError("");
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      return;
    }
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
          Loading your account and getting your personalized setup ready.
        </Text>
      </View>
    );
  }

  return (
    <ScreenScroll colors={colors}>
      <PageHeader
        eyebrow={step === "welcome" ? "Solo Runner Setup" : `Step ${questionIndex} of ${totalQuestions}`}
        title={screen.title}
        subtitle={screen.subtitle}
        rightContent={step === "welcome" ? null : <ProgressBadge current={questionIndex} total={totalQuestions} />}
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
          <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 12, lineHeight: 20 }}>
            {getProgressMessage(step)}
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
                QUICK SETUP
              </Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>
                We&apos;ll build your first plan in a minute or two
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23 }}>
                A few simple questions help NextStride set the right starting level, weekly rhythm, and goal-focused guidance right away.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <WelcomeBullet text="Beginner-friendly if you are just getting started" />
              <WelcomeBullet text="Still useful if you already train seriously" />
              <WelcomeBullet text="Used immediately to shape your week and messaging" />
            </View>

            <PrimaryButton label="Start Setup" onPress={handleContinue} />
          </View>
        </InfoCard>
      ) : null}

      {screen.kind === "options" ? (
        <InfoCard title={getStepGroupTitle(step)} subtitle={screen.helper}>
          <View style={{ gap: 12 }}>
            {screen.options.map((option) => (
              <ChoiceCard
                key={String(option.value)}
                title={option.title}
                detail={option.detail}
                selected={answers[step as keyof OnboardingSurveyAnswers] === option.value}
                disabled={loading}
                onPress={() => handleOptionSelect(option.value)}
              />
            ))}
          </View>
        </InfoCard>
      ) : null}

      {screen.kind === "form" && step === "recentResult" ? (
        <InfoCard title="Recent fitness marker" subtitle={screen.helper}>
          <View style={{ gap: 10 }}>
            {RACE_DISTANCE_OPTIONS.map((option) => {
              const selected = answers.recentResultDistance === option.value;

              return (
                <ChoiceCard
                  key={option.value}
                  title={option.title}
                  detail={option.detail}
                  selected={selected}
                  disabled={loading}
                  compact={true}
                  onPress={() => {
                    setAnswers((current) => ({
                      ...current,
                      recentResultDistance: option.value,
                      recentResultTime: option.value === "none" ? "" : current.recentResultTime,
                    }));
                    setError("");
                  }}
                />
              );
            })}
          </View>

          {answers.recentResultDistance && answers.recentResultDistance !== "none" ? (
            <TextInput
              value={answers.recentResultTime}
              onChangeText={(value) => updateAnswer("recentResultTime", value)}
              placeholder="Recent time, like 24:18"
              placeholderTextColor={colors.subtext}
              style={inputStyle(colors)}
              autoCapitalize="none"
            />
          ) : null}
        </InfoCard>
      ) : null}

      {screen.kind === "form" && step === "goalTime" ? (
        <InfoCard title={getGoalHeadline(answers.mainGoal)} subtitle={screen.helper}>
          <TextInput
            value={answers.goalTime}
            onChangeText={(value) => updateAnswer("goalTime", value)}
            placeholder="Target time, like 21:30"
            placeholderTextColor={colors.subtext}
            style={inputStyle(colors)}
            autoCapitalize="none"
          />
        </InfoCard>
      ) : null}

      {screen.kind === "form" && step === "goalRaceDate" ? (
        <InfoCard title="Put a date on it if you have one" subtitle={screen.helper}>
          <TextInput
            value={answers.goalRaceDate}
            onChangeText={(value) => updateAnswer("goalRaceDate", value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.subtext}
            style={inputStyle(colors)}
            autoCapitalize="none"
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
                  Saving your plan setup...
                </Text>
              </View>
            </InfoCard>
          ) : null}

          {screen.kind === "form" ? (
            <PrimaryButton
              label={stepIndex === steps.length - 1 ? "Finish Setup" : "Continue"}
              onPress={() => void handleContinue()}
            />
          ) : null}

          {screen.kind === "form" && screen.optional ? (
            <SecondaryButton label="Skip For Now" onPress={handleSkipOptional} />
          ) : null}

          <SecondaryButton label="Back" onPress={handleBack} />
        </View>
      ) : null}
    </ScreenScroll>
  );
}

function getVisibleSteps(answers: OnboardingSurveyAnswers) {
  const steps = [...BASE_STEPS];

  if (answers.mainGoal === "get_faster") {
    steps.push("goalRaceDistance");
  }

  if (shouldAskRaceGoal(answers.mainGoal)) {
    steps.push("goalTime", "goalRaceDate");
  }

  return steps;
}

function getDefaultGoalDistance(mainGoal: GoalOption | ""): OnboardingSurveyAnswers["goalRaceDistance"] {
  switch (mainGoal) {
    case "run_5k":
      return "5k";
    case "run_10k":
      return "10k";
    case "run_half":
      return "half marathon";
    case "run_marathon":
      return "marathon";
    default:
      return "";
  }
}

function sanitizeAnswers(answers: OnboardingSurveyAnswers): OnboardingSurveyAnswers {
  const shouldKeepRaceGoal = shouldAskRaceGoal(answers.mainGoal);
  const shouldKeepGoalDistance = answers.mainGoal === "get_faster" || !!getDefaultGoalDistance(answers.mainGoal);

  return {
    ...answers,
    recentResultTime: answers.recentResultDistance === "none" ? "" : answers.recentResultTime.trim(),
    goalRaceDistance: shouldKeepGoalDistance ? answers.goalRaceDistance : "",
    goalTime: shouldKeepRaceGoal ? answers.goalTime.trim() : "",
    goalRaceDate: shouldKeepRaceGoal ? answers.goalRaceDate.trim() : "",
  };
}

function validateCurrentStep(step: QuestionStep, answers: OnboardingSurveyAnswers) {
  switch (step) {
    case "recentResult":
      if (!answers.recentResultDistance) {
        return "Choose a recent result or pick 'No recent result' to keep moving.";
      }
      if (answers.recentResultDistance !== "none" && !answers.recentResultTime.trim()) {
        return "Add the recent time, or choose 'No recent result' if you want to skip this.";
      }
      return "";
    case "goalRaceDistance":
      if (!answers.goalRaceDistance) {
        return "Choose the distance you want to focus on.";
      }
      return "";
    case "goalRaceDate":
      if (answers.goalRaceDate.trim() && !isValidIsoDate(answers.goalRaceDate.trim())) {
        return "Use a real date in YYYY-MM-DD format, or leave it blank for now.";
      }
      return "";
    default:
      return "";
  }
}

function getScreenConfig(step: QuestionStep, answers: OnboardingSurveyAnswers): StepConfig {
  switch (step) {
    case "welcome":
      return {
        kind: "welcome",
        title: "Let's set up your running plan",
        subtitle: "A few short questions and we'll tailor the app around your starting point and goals.",
      };
    case "runningExperience":
      return {
        kind: "options",
        title: "How would you describe your running experience?",
        subtitle: "Pick the answer that feels closest. We just want a solid starting point.",
        helper: "This helps us keep the plan realistic from day one.",
        options: EXPERIENCE_OPTIONS,
      };
    case "canRunTwentyMinutes":
      return {
        kind: "options",
        title: "Can you run for about 20 minutes without stopping?",
        subtitle: "No pressure. This simply helps us decide how gentle or steady your first plan should be.",
        helper: "It is okay if run-walk feels more realistic right now.",
        options: ABILITY_OPTIONS,
      };
    case "currentFrequency":
      return {
        kind: "options",
        title: "How many days per week do you run right now?",
        subtitle: "Your current routine matters as much as your future goal.",
        helper: "We use this to avoid building a plan that jumps too far too fast.",
        options: FREQUENCY_OPTIONS,
      };
    case "weeklyMileageRange":
      return {
        kind: "options",
        title: "About how many miles do you run in a normal week?",
        subtitle: "An estimate is fine. We do not need a perfect number.",
        helper: "This helps set your starting workload and long-run range.",
        options: MILEAGE_OPTIONS,
      };
    case "longestRecentRun":
      return {
        kind: "options",
        title: "What is your longest recent run?",
        subtitle: "This gives us a quick read on your current endurance.",
        helper: "Think about the longest run you have done recently, not your all-time best.",
        options: LONGEST_RUN_OPTIONS,
      };
    case "mainGoal":
      return {
        kind: "options",
        title: "What matters most right now?",
        subtitle: "We will shape the plan and the app wording around this goal.",
        helper: "Choose the outcome you care about most over the next training block.",
        options: GOAL_OPTIONS,
      };
    case "preferredTrainingDays":
      return {
        kind: "options",
        title: "How many days per week do you want to run?",
        subtitle: "Choose the schedule you can actually stick with.",
        helper: "A realistic plan beats an ambitious one you cannot keep.",
        options: TRAINING_PREFERENCE_OPTIONS,
      };
    case "recentResult":
      return {
        kind: "form",
        title: "Do you have a recent race result or hard effort?",
        subtitle: "Optional, but helpful.",
        helper: getRecentResultHelp(),
        optional: true,
      };
    case "goalRaceDistance":
      return {
        kind: "options",
        title: "Which distance do you want to focus on?",
        subtitle: "This gives your faster-focused plan a clearer target.",
        helper: getGoalDistancePrompt(answers.mainGoal),
        options: GOAL_RACE_OPTIONS,
      };
    case "goalTime":
      return {
        kind: "form",
        title: "Do you have a target time?",
        subtitle: "Optional, but useful if you already have a number in mind.",
        helper: getGoalTimePrompt(answers.goalRaceDistance),
        optional: true,
      };
    case "goalRaceDate":
      return {
        kind: "form",
        title: "Do you have a goal date?",
        subtitle: "Optional, but helpful for pacing the training block.",
        helper: getGoalDatePrompt(answers.goalRaceDistance),
        optional: true,
      };
  }
}

function getProgressMessage(step: QuestionStep) {
  switch (step) {
    case "runningExperience":
    case "canRunTwentyMinutes":
      return "We are figuring out the right starting level so your early workouts feel believable and useful.";
    case "currentFrequency":
    case "weeklyMileageRange":
    case "longestRecentRun":
      return "These answers shape your first week, your workload, and how aggressive the progression should feel.";
    case "mainGoal":
    case "preferredTrainingDays":
      return "This is where the plan starts becoming yours: the weekly rhythm, the goal focus, and the tone of the guidance.";
    case "recentResult":
    case "goalRaceDistance":
    case "goalTime":
    case "goalRaceDate":
      return "These details help NextStride sharpen your paces, goal messaging, and longer-term progress reads.";
    default:
      return "A few more answers and your plan will be ready.";
  }
}

function getStepGroupTitle(step: QuestionStep) {
  switch (step) {
    case "runningExperience":
    case "canRunTwentyMinutes":
      return "Starting point";
    case "currentFrequency":
    case "weeklyMileageRange":
    case "longestRecentRun":
      return "Current training";
    case "mainGoal":
    case "preferredTrainingDays":
      return "Plan direction";
    default:
      return "Runner profile";
  }
}

function ChoiceCard({
  title,
  detail,
  selected,
  disabled,
  compact,
  onPress,
}: {
  title: string;
  detail: string;
  selected: boolean;
  disabled?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: selected ? colors.primarySoft : colors.cardAlt,
        borderRadius: compact ? 18 : 24,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        padding: compact ? 16 : 20,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Text style={{ color: colors.text, fontSize: compact ? 16 : 20, fontWeight: "800", lineHeight: compact ? 22 : 26 }}>
        {title}
      </Text>
      <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
        {detail}
      </Text>
    </Pressable>
  );
}

function ProgressBadge({ current, total }: { current: number; total: number }) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        minWidth: 78,
        backgroundColor: colors.primarySoft,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
        {current}/{total}
      </Text>
    </View>
  );
}

function WelcomeBullet({ text }: { text: string }) {
  const { colors } = useThemeColors();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.primary }} />
      <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
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
