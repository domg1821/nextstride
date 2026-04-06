import {
  PREMIUM_FEATURES,
  PREMIUM_PLANS,
  type BillingCycle,
  type PremiumFeatureKey,
  type PremiumTier,
} from "@/lib/premium-products";
import { getStripePriceEnvKey } from "@/lib/billing/stripe-config";
import type { UpgradePlan } from "@/lib/upgrade-route";

export type SubscriptionFeatureKey = PremiumFeatureKey;

export type SubscriptionFeatureDefinition = {
  key: SubscriptionFeatureKey;
  title: string;
  summary: string;
  preview: string;
  minimumTier: PremiumTier;
};

type SubscriptionCopy = {
  outcomeCopy: string;
  bestFor: string;
  checkoutHeadline: string;
  trustCopy: string[];
  valuePoints: string[];
};

export type SubscriptionOffering = {
  plan: UpgradePlan;
  label: string;
  features: PremiumFeatureKey[];
  copy: SubscriptionCopy;
  prices: Record<
    BillingCycle,
    {
      amount: number;
      label: string;
      cadenceLabel: string;
      priceEnvKey: string;
      renewalLabel: string;
    }
  >;
};

export const SUBSCRIPTION_FEATURES: SubscriptionFeatureDefinition[] = PREMIUM_FEATURES.map((feature) => ({
  key: feature.key,
  title: feature.title,
  summary: feature.summary,
  preview: feature.preview,
  minimumTier: feature.minimumTier,
}));

export const SUBSCRIPTION_CONFIG: Record<UpgradePlan, SubscriptionOffering> = {
  pro: {
    plan: "pro",
    label: PREMIUM_PLANS.pro.name,
    features: [
      "heart_rate_guidance",
      "fueling_suggestions",
      "progress_insights",
      "race_prediction_basic",
      "training_metrics_enhanced",
    ],
    copy: {
      outcomeCopy: "Smarter training tools with clearer execution guidance and better progress visibility.",
      bestFor: "Best for runners who want more structure and insight without stepping fully into a coaching-style experience.",
      checkoutHeadline: "You are upgrading into sharper training tools.",
      trustCopy: ["Unlock instantly", "Built for serious runners"],
      valuePoints: [
        "Heart rate guidance",
        "Fueling suggestions",
        "Improved progress tracking",
        "Basic race predictions",
      ],
    },
    prices: {
      monthly: {
        amount: PREMIUM_PLANS.pro.prices.monthly.amount,
        label: PREMIUM_PLANS.pro.prices.monthly.label,
        cadenceLabel: PREMIUM_PLANS.pro.prices.monthly.cadenceLabel,
        priceEnvKey: getStripePriceEnvKey("pro", "monthly"),
        renewalLabel: "Renews monthly until canceled.",
      },
      yearly: {
        amount: PREMIUM_PLANS.pro.prices.yearly.amount,
        label: PREMIUM_PLANS.pro.prices.yearly.label,
        cadenceLabel: PREMIUM_PLANS.pro.prices.yearly.cadenceLabel,
        priceEnvKey: getStripePriceEnvKey("pro", "yearly"),
        renewalLabel: "Renews yearly until canceled.",
      },
    },
  },
  elite: {
    plan: "elite",
    label: PREMIUM_PLANS.elite.name,
    features: SUBSCRIPTION_FEATURES.filter((feature) => feature.minimumTier !== "free").map((feature) => feature.key),
    copy: {
      outcomeCopy: "A coaching-style experience with adaptive guidance, post-run analysis, and deeper race-focused insight.",
      bestFor: "Best for runners who want the app to feel much closer to a real coach guiding the full block.",
      checkoutHeadline: "You are unlocking the full coaching-style layer.",
      trustCopy: ["Unlock instantly", "Cancel anytime", "Built for serious runners"],
      valuePoints: [
        "Personalized coaching feedback",
        "Adaptive training adjustments",
        "Advanced race predictions",
        "Weekly performance insights",
      ],
    },
    prices: {
      monthly: {
        amount: PREMIUM_PLANS.elite.prices.monthly.amount,
        label: PREMIUM_PLANS.elite.prices.monthly.label,
        cadenceLabel: PREMIUM_PLANS.elite.prices.monthly.cadenceLabel,
        priceEnvKey: getStripePriceEnvKey("elite", "monthly"),
        renewalLabel: "Renews monthly until canceled.",
      },
      yearly: {
        amount: PREMIUM_PLANS.elite.prices.yearly.amount,
        label: PREMIUM_PLANS.elite.prices.yearly.label,
        cadenceLabel: PREMIUM_PLANS.elite.prices.yearly.cadenceLabel,
        priceEnvKey: getStripePriceEnvKey("elite", "yearly"),
        renewalLabel: "Renews yearly until canceled.",
      },
    },
  },
};

export function getSubscriptionOffering(plan: UpgradePlan) {
  return SUBSCRIPTION_CONFIG[plan];
}

export function getSubscriptionCopy(plan: UpgradePlan) {
  return SUBSCRIPTION_CONFIG[plan].copy;
}

export function getSubscriptionSavings(plan: UpgradePlan) {
  const offering = SUBSCRIPTION_CONFIG[plan];
  return Math.max(0, offering.prices.monthly.amount * 12 - offering.prices.yearly.amount);
}

export function getSubscriptionSavingsPercent(plan: UpgradePlan) {
  const offering = SUBSCRIPTION_CONFIG[plan];
  const yearlyMonthlyEquivalent = offering.prices.monthly.amount * 12;

  if (yearlyMonthlyEquivalent <= 0) {
    return 0;
  }

  return Math.max(0, (getSubscriptionSavings(plan) / yearlyMonthlyEquivalent) * 100);
}

export function getSubscriptionFeatureDefinition(featureKey: SubscriptionFeatureKey) {
  return SUBSCRIPTION_FEATURES.find((feature) => feature.key === featureKey) ?? null;
}

export function getSubscriptionFeaturesForPlan(plan: UpgradePlan) {
  return SUBSCRIPTION_CONFIG[plan].features
    .map((featureKey) => getSubscriptionFeatureDefinition(featureKey))
    .filter((feature): feature is SubscriptionFeatureDefinition => feature !== null);
}

export function getLockedSubscriptionFeaturesForTier(tier: PremiumTier) {
  return SUBSCRIPTION_FEATURES.filter((feature) => !canAccessFeature(feature.key, tier));
}

export function canAccessFeature(featureKey: SubscriptionFeatureKey, tier: PremiumTier) {
  const feature = getSubscriptionFeatureDefinition(featureKey);

  if (!feature) {
    return false;
  }

  if (feature.minimumTier === "free") {
    return true;
  }

  if (feature.minimumTier === "pro") {
    return tier === "pro" || tier === "elite";
  }

  return tier === "elite";
}

export function getSubscriptionGate(featureKey: SubscriptionFeatureKey, tier: PremiumTier) {
  const feature = getSubscriptionFeatureDefinition(featureKey);

  if (!feature) {
    return {
      locked: false,
      requiredTier: "free" as PremiumTier,
      title: "Unavailable feature",
      preview: "",
      upgradeCopy: "",
    };
  }

  return {
    locked: !canAccessFeature(featureKey, tier),
    requiredTier: feature.minimumTier,
    title: feature.title,
    preview: feature.preview,
    upgradeCopy:
      feature.minimumTier === "elite"
        ? "Upgrade to Elite to unlock coaching-style guidance."
        : "Upgrade to Pro to unlock this training tool.",
  };
}
