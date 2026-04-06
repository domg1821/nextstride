export type PremiumTier = "free" | "pro" | "elite";
export type BillingCycle = "monthly" | "yearly";

export type PremiumFeatureKey =
  | "basic_plan"
  | "progress_tracking_basic"
  | "dashboard_core"
  | "heart_rate_guidance"
  | "fueling_suggestions"
  | "progress_insights"
  | "race_prediction_basic"
  | "training_metrics_enhanced"
  | "adaptive_training"
  | "post_run_feedback"
  | "race_prediction_advanced"
  | "goal_pacing_calculator"
  | "weekly_performance_summaries"
  | "goal_on_track"
  | "personalized_insights_advanced"
  | "priority_premium_access";

export type PremiumFeatureDefinition = {
  key: PremiumFeatureKey;
  title: string;
  badge: string;
  summary: string;
  preview: string;
  minimumTier: PremiumTier;
  category: "Training" | "Insights" | "Recovery / fueling" | "Personalization" | "Premium coaching tools";
};

export type PremiumPlan = {
  tier: PremiumTier;
  name: string;
  summary: string;
  audience: string;
  description: string;
  accent: string;
  highlighted?: boolean;
  yearlySavingsLabel?: string;
  prices: Record<BillingCycle, { label: string; amount: number; cadenceLabel: string }>;
  featureKeys: PremiumFeatureKey[];
  cta: string;
};

export type PremiumComparisonRow = {
  category: PremiumFeatureDefinition["category"];
  feature: string;
  free: string;
  pro: string;
  elite: string;
};

export const PREMIUM_FEATURES: PremiumFeatureDefinition[] = [
  {
    key: "basic_plan",
    badge: "PLAN",
    title: "Basic weekly training plan",
    summary: "Get a simple weekly structure you can actually follow.",
    preview: "See the week ahead with foundational workout structure and clean daily flow.",
    minimumTier: "free",
    category: "Training",
  },
  {
    key: "progress_tracking_basic",
    badge: "TRACK",
    title: "Limited progress tracking",
    summary: "Track core mileage, workouts, and consistency.",
    preview: "Keep the basics visible so the plan stays grounded in real training.",
    minimumTier: "free",
    category: "Insights",
  },
  {
    key: "dashboard_core",
    badge: "CORE",
    title: "Core dashboard experience",
    summary: "See today, this week, and your essential training context.",
    preview: "The home experience stays useful even on the Free plan.",
    minimumTier: "free",
    category: "Training",
  },
  {
    key: "heart_rate_guidance",
    badge: "HR",
    title: "Heart rate zones",
    summary: "Train easier on easy days and more accurately on workout days.",
    preview: "Use clearer zone guidance to keep aerobic work honest and quality sessions more controlled.",
    minimumTier: "pro",
    category: "Training",
  },
  {
    key: "fueling_suggestions",
    badge: "FUEL",
    title: "Fueling suggestions",
    summary: "Know how to support long runs and harder sessions.",
    preview: "Get practical pre-run, during-run, and recovery fueling suggestions.",
    minimumTier: "pro",
    category: "Recovery / fueling",
  },
  {
    key: "progress_insights",
    badge: "PLUS",
    title: "Improved progress tracking",
    summary: "Get a stronger read on momentum, consistency, and block direction.",
    preview: "Move beyond simple logging with clearer trend and progress signals.",
    minimumTier: "pro",
    category: "Insights",
  },
  {
    key: "race_prediction_basic",
    badge: "PRED",
    title: "Basic race prediction",
    summary: "Project likely race fitness from recent work and PR anchors.",
    preview: "See a cleaner baseline estimate for where your training points right now.",
    minimumTier: "pro",
    category: "Insights",
  },
  {
    key: "training_metrics_enhanced",
    badge: "METRIC",
    title: "Enhanced workout metrics",
    summary: "See stronger workout detail without stepping into full coaching mode.",
    preview: "Unlock a more complete look at workout quality, load, and weekly execution.",
    minimumTier: "pro",
    category: "Insights",
  },
  {
    key: "adaptive_training",
    badge: "ADAPT",
    title: "Adaptive training adjustments",
    summary: "Auto-adjust upcoming workouts as the week evolves.",
    preview: "Completion, pace, and fatigue signals can shift the plan before it gets stale.",
    minimumTier: "elite",
    category: "Premium coaching tools",
  },
  {
    key: "post_run_feedback",
    badge: "FEED",
    title: "Post-run feedback",
    summary: "Get coach-style notes after each completed workout.",
    preview: "Review pacing, effort, and the smartest next step while the run is still fresh.",
    minimumTier: "elite",
    category: "Premium coaching tools",
  },
  {
    key: "race_prediction_advanced",
    badge: "RACE",
    title: "Advanced race predictor",
    summary: "A dynamic predictor that evolves with your block.",
    preview: "Use recent workouts, PR anchors, and workload trends to sharpen projections.",
    minimumTier: "elite",
    category: "Insights",
  },
  {
    key: "goal_pacing_calculator",
    badge: "PACE",
    title: "Goal pacing calculator",
    summary: "Turn goal times into practical training and race pacing targets.",
    preview: "Break goal pace into per-mile, per-kilometer, and lap targets.",
    minimumTier: "elite",
    category: "Premium coaching tools",
  },
  {
    key: "weekly_performance_summaries",
    badge: "WEEK",
    title: "Weekly performance summaries",
    summary: "See what happened this week and what it means.",
    preview: "Get a weekly recap that highlights progress, drift, and next priorities.",
    minimumTier: "elite",
    category: "Premium coaching tools",
  },
  {
    key: "goal_on_track",
    badge: "TRACK",
    title: "\"On track\" progress system",
    summary: "Know whether your current training supports your goal.",
    preview: "Goal tracking blends race prediction, consistency, and key workout signals.",
    minimumTier: "elite",
    category: "Personalization",
  },
  {
    key: "personalized_insights_advanced",
    badge: "COACH",
    title: "Deeper personalized insights",
    summary: "Unlock a deeper coaching layer across the app.",
    preview: "See more specific guidance tied to your recent work, goal, and trends.",
    minimumTier: "elite",
    category: "Personalization",
  },
  {
    key: "priority_premium_access",
    badge: "FIRST",
    title: "Priority access to new premium features",
    summary: "Get earlier access as new premium tools roll out.",
    preview: "Elite runners get first access to future coaching and performance upgrades.",
    minimumTier: "elite",
    category: "Premium coaching tools",
  },
];

export const PREMIUM_PLANS: Record<PremiumTier, PremiumPlan> = {
  free: {
    tier: "free",
    name: "Free",
    summary: "Strong essentials for runners getting started.",
    audience: "Basic structure and casual use",
    description: "Useful weekly planning, core dashboard tools, and lightweight progress tracking.",
    accent: "#7b8aa1",
    prices: {
      monthly: { label: "$0", amount: 0, cadenceLabel: "/month" },
      yearly: { label: "$0", amount: 0, cadenceLabel: "/year" },
    },
    featureKeys: ["basic_plan", "progress_tracking_basic", "dashboard_core"],
    cta: "Start free",
  },
  pro: {
    tier: "pro",
    name: "Pro",
    summary: "Better training tools and clearer insights for consistent runners.",
    audience: "Runners who want more guidance",
    description: "Build on the basics with better execution tools, stronger workout data, and more useful training insight.",
    accent: "#2563eb",
    yearlySavingsLabel: "Save $4.50/year",
    prices: {
      monthly: { label: "$2.50", amount: 2.5, cadenceLabel: "/month" },
      yearly: { label: "$25.50", amount: 25.5, cadenceLabel: "/year" },
    },
    featureKeys: [
      "basic_plan",
      "progress_tracking_basic",
      "dashboard_core",
      "heart_rate_guidance",
      "fueling_suggestions",
      "progress_insights",
      "race_prediction_basic",
      "training_metrics_enhanced",
    ],
    cta: "Upgrade to Pro",
  },
  elite: {
    tier: "elite",
    name: "Elite",
    summary: "A real coaching-style upgrade for serious runners chasing progress.",
    audience: "Runners who want coaching-style personalization",
    description: "Everything in Pro plus adaptive planning, post-run analysis, weekly summaries, and smarter personalized coaching tools.",
    accent: "#67e8f9",
    highlighted: true,
    yearlySavingsLabel: "Save $27.01/year",
    prices: {
      monthly: { label: "$6", amount: 6, cadenceLabel: "/month" },
      yearly: { label: "$44.99", amount: 44.99, cadenceLabel: "/year" },
    },
    featureKeys: PREMIUM_FEATURES.map((feature) => feature.key),
    cta: "Choose Elite",
  },
};

export const PREMIUM_PRODUCT = {
  name: "NextStride Plans",
  heroTitle: "Choose the plan that fits your training",
  heroSubtitle:
    "From essential training tools to full coaching-level insights, unlock the level of support that matches your goals.",
  websitePremiumTitle: "Unlock smarter training",
  websitePremiumSubtitle:
    "Move from useful training tools to coaching-style guidance with clear Free, Pro, and Elite options.",
  yearlyToggleLabel: "Save more with yearly billing",
} as const;

export const PREMIUM_COMPARISON_ROWS: PremiumComparisonRow[] = [
  { category: "Training", feature: "Weekly training plan", free: "Basic", pro: "Structured", elite: "Adaptive" },
  { category: "Training", feature: "Heart rate zones", free: "-", pro: "Included", elite: "Included" },
  { category: "Insights", feature: "Progress tracking", free: "Limited", pro: "Improved", elite: "Deep + adaptive" },
  { category: "Insights", feature: "Race prediction", free: "-", pro: "Basic", elite: "Advanced + dynamic" },
  { category: "Insights", feature: "Workout metrics", free: "Core", pro: "Enhanced", elite: "Enhanced + coached" },
  { category: "Recovery / fueling", feature: "Fueling suggestions", free: "-", pro: "Included", elite: "Included" },
  { category: "Personalization", feature: "\"On track\" goal system", free: "-", pro: "-", elite: "Included" },
  { category: "Personalization", feature: "Personalized insights", free: "Core", pro: "Guided", elite: "Deeper coaching layer" },
  { category: "Premium coaching tools", feature: "Adaptive adjustments", free: "-", pro: "-", elite: "Included" },
  { category: "Premium coaching tools", feature: "Post-run feedback", free: "-", pro: "-", elite: "Included" },
  { category: "Premium coaching tools", feature: "Goal pacing calculator", free: "-", pro: "-", elite: "Included" },
  { category: "Premium coaching tools", feature: "Weekly performance summaries", free: "-", pro: "-", elite: "Included" },
  { category: "Premium coaching tools", feature: "Priority access to new features", free: "-", pro: "-", elite: "Included" },
];

export const PREMIUM_LOCKED_PREVIEWS = [
  {
    title: "Adaptive week preview",
    body: "Tomorrow's threshold session gets trimmed because your last two runs came in hot and recovery signals are trending heavy.",
    lockedTo: "elite" as PremiumTier,
  },
  {
    title: "Post-run coach note",
    body: "Strong pacing discipline. Effort rose late, but you still stayed controlled enough to absorb the work and keep Thursday easy.",
    lockedTo: "elite" as PremiumTier,
  },
  {
    title: "Race projection update",
    body: "Your 10K projection improved after recent threshold work and stronger weekly consistency.",
    lockedTo: "pro" as PremiumTier,
  },
];

export function getPlanPriceLabel(tier: PremiumTier, billingCycle: BillingCycle) {
  const price = PREMIUM_PLANS[tier].prices[billingCycle];
  return `${price.label}${price.cadenceLabel}`;
}

export function getTierRank(tier: PremiumTier) {
  switch (tier) {
    case "elite":
      return 2;
    case "pro":
      return 1;
    default:
      return 0;
  }
}

export function isTierAtLeast(currentTier: PremiumTier, requiredTier: PremiumTier) {
  return getTierRank(currentTier) >= getTierRank(requiredTier);
}

export function getFeaturesForTier(tier: PremiumTier) {
  return PREMIUM_FEATURES.filter((feature) => isTierAtLeast(tier, feature.minimumTier));
}

export function getLockedFeaturesForTier(tier: PremiumTier) {
  return PREMIUM_FEATURES.filter((feature) => !isTierAtLeast(tier, feature.minimumTier));
}

export function getComparisonCategories() {
  return [...new Set(PREMIUM_COMPARISON_ROWS.map((row) => row.category))];
}
