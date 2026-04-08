import type { GoalOption, OnboardingSurveyAnswers, ProfileType } from "@/contexts/profile-context";
import { getGoalLabel } from "@/lib/training-plan";

export function shouldAskRaceGoal(mainGoal: GoalOption | "") {
  return mainGoal === "run_5k" || mainGoal === "run_10k" || mainGoal === "run_half" || mainGoal === "run_marathon" || mainGoal === "get_faster";
}

export function getGoalDistancePrompt(mainGoal: GoalOption | "") {
  switch (mainGoal) {
    case "run_5k":
      return "Pick the distance you want to train toward.";
    case "run_10k":
    case "run_half":
    case "run_marathon":
      return "Choose the event that best matches your next goal race.";
    case "get_faster":
      return "Choose the distance you care most about right now.";
    default:
      return "Choose a target distance if you have one.";
  }
}

export function getGoalTimePrompt(goalRaceDistance: string) {
  const goalLabel = goalRaceDistance ? getGoalLabel(goalRaceDistance) : "your goal race";
  return `Add a target time if you have one for ${goalLabel}. You can skip this if you just want a smart starting plan.`;
}

export function getGoalDatePrompt(goalRaceDistance: string) {
  const goalLabel = goalRaceDistance ? getGoalLabel(goalRaceDistance) : "your goal race";
  return `Add the date if ${goalLabel} is already on your calendar. Leave it blank if you are not sure yet.`;
}

export function getGoalHeadline(mainGoal: GoalOption | "") {
  switch (mainGoal) {
    case "start_running":
      return "Build a simple, confidence-building plan";
    case "get_fitter":
      return "Build a steady routine that makes you fitter";
    case "get_faster":
      return "Train with a sharper goal in mind";
    default:
      return "Point the plan toward the race you care about";
  }
}

export function getRecentResultHelp() {
  return "This is optional. A recent race or hard time trial helps with pace guidance, but you can skip it and still get a solid plan.";
}

export function getExperienceSummary(profile: ProfileType) {
  switch (profile.runnerLevel) {
    case "total_beginner":
      return "starting gently and building confidence";
    case "beginner":
      return "building consistency without overdoing it";
    case "intermediate":
      return "progressing with a balanced weekly structure";
    case "advanced":
      return "keeping the training sharp and goal-focused";
    default:
      return "building around your current training";
  }
}

export function buildOnboardingCompletionMessage(profile: ProfileType) {
  const goalLabel = getPersonalizedGoalLabel(profile);
  const days = Math.max(profile.preferredTrainingDays || 4, 1);
  const experienceSummary = getExperienceSummary(profile);
  return `Your ${goalLabel} plan is ready with ${days} run${days === 1 ? "" : "s"} per week, ${experienceSummary}.`;
}

export function buildHomePersonalization(profile: ProfileType) {
  const goalLabel = getPersonalizedGoalLabel(profile);
  const focus = getMainGoalFocus(profile.onboardingAnswers);
  const days = Math.max(profile.preferredTrainingDays || 4, 1);

  return {
    eyebrow: "YOUR PERSONALIZED PLAN",
    title: `Your ${goalLabel} week starts with today's run.`,
    subtitle: `Built for ${days} run${days === 1 ? "" : "s"} per week, with guidance focused on ${focus}.`,
  };
}

export function getMainGoalFocus(answers: OnboardingSurveyAnswers) {
  switch (answers.mainGoal) {
    case "start_running":
      return "building a comfortable running habit";
    case "get_fitter":
      return "steady fitness and consistency";
    case "run_5k":
      return "5K-specific progress";
    case "run_10k":
      return "10K-specific endurance";
    case "run_half":
      return "half-marathon endurance";
    case "run_marathon":
      return "marathon endurance";
    case "get_faster":
      return "getting faster without losing control";
    default:
      return "steady improvement";
  }
}

export function getPersonalizedGoalLabel(profile: Pick<ProfileType, "goalEvent" | "onboardingAnswers">) {
  if (profile.goalEvent) {
    return getGoalLabel(profile.goalEvent);
  }

  switch (profile.onboardingAnswers.mainGoal) {
    case "start_running":
      return "running";
    case "get_fitter":
      return "fitness";
    case "get_faster":
      return "speed";
    default:
      return "training";
  }
}

