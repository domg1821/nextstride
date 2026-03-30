export type PremiumFeature = {
  title: string;
  description: string;
  benefit: string;
  badge: string;
};

export type PremiumComparisonRow = {
  feature: string;
  free: string;
  premium: string;
};

export const PREMIUM_PRODUCT = {
  name: "NextStride Premium",
  monthlyPrice: "$2.50",
  monthlyPriceLabel: "$2.50/month",
  tagline: "More guidance. Better decisions. Better racing.",
  description:
    "Premium helps runners train with clearer direction, smarter adjustments, and stronger coaching context built around the work they are actually doing.",
  productIds: {
    ios: "com.nextstride.premium.monthly",
    android: "com.nextstride.premium.monthly",
  },
} as const;

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    badge: "HR",
    title: "Heart Rate Guided Training",
    benefit: "Stay in the right zone on easy, tempo, and harder days.",
    description:
      "Use clearer target heart rate guidance so aerobic runs stay controlled, workouts stay honest, and recovery days do not drift too hard.",
  },
  {
    badge: "Fuel",
    title: "Personalized Fueling Guidance",
    benefit: "Know how to support the work before, during, and after key runs.",
    description:
      "Get practical suggestions for pre-run fueling, long-run intake, and recovery support so harder sessions feel more repeatable.",
  },
  {
    badge: "Adapt",
    title: "Adaptive Training Adjustments",
    benefit: "Keep the plan useful when real life changes the week.",
    description:
      "Future adaptive logic can respond to completed workouts, missed sessions, effort trends, and consistency without forcing a rigid plan.",
  },
  {
    badge: "Insight",
    title: "Race Predictor + Advanced Insights",
    benefit: "Turn training trends into race-day context you can act on.",
    description:
      "See stronger prediction context, confidence signals, and performance insights grounded in the work you have been doing lately.",
  },
  {
    badge: "Coach",
    title: "Advanced Coach Feedback",
    benefit: "Get more personalized guidance when decisions are not obvious.",
    description:
      "Unlock deeper coach responses, sharper workout interpretation, and recommendations that better reflect your profile, goal, and recent training.",
  },
  {
    badge: "Recover",
    title: "Recovery / Readiness Suggestions",
    benefit: "Protect consistency by spotting when to push and when to absorb.",
    description:
      "Surface readiness nudges, follow-up suggestions after big efforts, and warnings when recent load looks heavy enough to deserve extra care.",
  },
];

export const PREMIUM_COMPARISON_ROWS: PremiumComparisonRow[] = [
  { feature: "Basic training plan", free: "Included", premium: "Included" },
  { feature: "Workout logging", free: "Included", premium: "Included" },
  { feature: "Progress tracking", free: "Included", premium: "Included" },
  { feature: "Core coach guidance", free: "Included", premium: "Included" },
  { feature: "Heart rate workout targets", free: "-", premium: "Included" },
  { feature: "Fueling guidance", free: "-", premium: "Included" },
  { feature: "Adaptive weekly adjustments", free: "Basic", premium: "Advanced" },
  { feature: "Race predictor explanations", free: "Basic", premium: "Advanced" },
  { feature: "Advanced training insights", free: "-", premium: "Included" },
  { feature: "Recovery / readiness suggestions", free: "-", premium: "Included" },
];

export const PREMIUM_FOUNDATION_STEPS = [
  {
    title: "Store-backed subscriptions later",
    body:
      "The purchase service is intentionally separated so iOS can connect to StoreKit and Android can connect to Google Play Billing without rewriting the Premium UI.",
  },
  {
    title: "Explicit subscription states",
    body:
      "The app models not premium, upgrade pending, and premium active so screens can react cleanly when real billing events are wired in.",
  },
  {
    title: "No fake success path",
    body:
      "The current flow does not pretend a payment succeeded. It only records that an upgrade was started and is waiting on real billing integration.",
  },
];
