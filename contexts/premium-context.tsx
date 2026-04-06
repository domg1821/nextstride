import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type PurchaseAdapter,
  type PurchaseResult,
  type PremiumStatus,
  getPurchaseEnvironment,
  getPurchaseEnvironmentLabel,
  stripePurchaseAdapter,
} from "@/lib/billing/premium-billing";
import { fetchRemoteSubscriptionState } from "@/lib/billing/stripe-client";
import { PREMIUM_PLANS, getPlanPriceLabel, type BillingCycle, type PremiumTier } from "@/lib/premium-products";
import {
  canAccessFeature,
  getLockedSubscriptionFeaturesForTier,
  getSubscriptionGate,
  type SubscriptionFeatureKey,
} from "@/lib/subscription-config";
import { useProfile } from "@/contexts/profile-context";

type PremiumRecord = {
  status: PremiumStatus;
  tier: PremiumTier;
  pendingTier: PremiumTier | null;
  billingCycle: BillingCycle;
  renewalDate: string | null;
  lastMessage: string;
};

type PremiumContextValue = {
  status: PremiumStatus;
  tier: PremiumTier;
  selectedBillingCycle: BillingCycle;
  pendingTier: PremiumTier | null;
  statusTitle: string;
  statusDetail: string;
  environmentLabel: string;
  lastMessage: string;
  renewalDate: string | null;
  tierLabel: string;
  currentPlanLabel: string;
  lockedFeatureCount: number;
  setSelectedBillingCycle: (cycle: BillingCycle) => void;
  hasAccess: (featureKey: SubscriptionFeatureKey) => boolean;
  getFeatureGate: (featureKey: SubscriptionFeatureKey) => ReturnType<typeof getSubscriptionGate>;
  canAccessFeature: (featureKey: SubscriptionFeatureKey) => boolean;
  beginUpgrade: (tier: PremiumTier, billingCycle?: BillingCycle) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  refreshSubscription: () => Promise<PurchaseResult>;
  clearPendingState: () => void;
  setPurchaseAdapter: (nextAdapter: PurchaseAdapter) => void;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

const DEFAULT_RECORD: PremiumRecord = {
  status: "not_premium",
  tier: "free",
  pendingTier: null,
  billingCycle: "yearly",
  renewalDate: null,
  lastMessage: "Choose Pro or Elite to unlock deeper training guidance.",
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown premium sync error.";
}

function getFallbackResult(message: string, billingCycle: BillingCycle): PurchaseResult {
  return {
    status: "inactive",
    environment: getPurchaseEnvironment(),
    billingCycle,
    message,
  };
}

function mapPurchaseResultToRecord(
  result: PurchaseResult,
  currentRecord: PremiumRecord,
  fallbackBillingCycle: BillingCycle
): PremiumRecord {
  const nextBillingCycle = result.billingCycle ?? fallbackBillingCycle;

  if (result.status === "active") {
    return {
      status: "premium_active",
      tier: result.tier,
      pendingTier: null,
      billingCycle: nextBillingCycle,
      renewalDate: result.renewalDate ?? null,
      lastMessage: result.message,
    };
  }

  if (result.status === "pending") {
    return {
      status: "upgrade_pending",
      tier: currentRecord.tier === "free" ? "free" : currentRecord.tier,
      pendingTier: result.tier,
      billingCycle: nextBillingCycle,
      renewalDate: null,
      lastMessage: result.message,
    };
  }

  return {
    status: "not_premium",
    tier: "free",
    pendingTier: null,
    billingCycle: nextBillingCycle,
    renewalDate: null,
    lastMessage: result.message,
  };
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { account, authReady, isAuthenticated } = useProfile();
  const accountKey = account?.email ?? "guest";
  const [recordsByKey, setRecordsByKey] = useState<Record<string, PremiumRecord>>({});
  const [purchaseAdapter, setPurchaseAdapterState] = useState<PurchaseAdapter>(stripePurchaseAdapter);
  const currentRecord = recordsByKey[accountKey] ?? DEFAULT_RECORD;

  const updateRecord = useCallback(
    (updates: Partial<PremiumRecord>) => {
      setRecordsByKey((current) => ({
        ...current,
        [accountKey]: {
          ...(current[accountKey] ?? DEFAULT_RECORD),
          ...updates,
        },
      }));
    },
    [accountKey]
  );

  const replaceRecord = useCallback(
    (nextRecord: PremiumRecord) => {
      setRecordsByKey((current) => ({
        ...current,
        [accountKey]: nextRecord,
      }));
    },
    [accountKey]
  );

  const refreshSubscription = useCallback(async (): Promise<PurchaseResult> => {
    if (!isAuthenticated) {
      replaceRecord(DEFAULT_RECORD);
      return getFallbackResult("Sign in to sync your Stripe subscription.", DEFAULT_RECORD.billingCycle);
    }

    try {
      const remoteState = await fetchRemoteSubscriptionState();

      if (remoteState.status === "premium_active" && remoteState.tier !== "free") {
        const nextResult: PurchaseResult = {
          status: "active",
          environment: getPurchaseEnvironment(),
          tier: remoteState.tier,
          billingCycle: remoteState.billingCycle,
          renewalDate: remoteState.renewalDate ?? undefined,
          message: remoteState.lastMessage,
        };

        replaceRecord({
          status: "premium_active",
          tier: remoteState.tier,
          pendingTier: null,
          billingCycle: remoteState.billingCycle,
          renewalDate: remoteState.renewalDate,
          lastMessage: remoteState.lastMessage,
        });
        return nextResult;
      }

      if (remoteState.status === "upgrade_pending" && remoteState.pendingTier) {
        const nextResult: PurchaseResult = {
          status: "pending",
          environment: getPurchaseEnvironment(),
          tier: remoteState.pendingTier,
          billingCycle: remoteState.billingCycle,
          message: remoteState.lastMessage,
        };

        replaceRecord({
          status: "upgrade_pending",
          tier: "free",
          pendingTier: remoteState.pendingTier,
          billingCycle: remoteState.billingCycle,
          renewalDate: null,
          lastMessage: remoteState.lastMessage,
        });
        return nextResult;
      }

      const fallback = getFallbackResult(remoteState.lastMessage, remoteState.billingCycle);
      replaceRecord({
        ...DEFAULT_RECORD,
        billingCycle: remoteState.billingCycle,
        lastMessage: remoteState.lastMessage,
      });
      return fallback;
    } catch (error) {
      const fallback = getFallbackResult(getErrorMessage(error), DEFAULT_RECORD.billingCycle);
      updateRecord({ lastMessage: fallback.message });
      return fallback;
    }
  }, [isAuthenticated, replaceRecord, updateRecord]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      replaceRecord(DEFAULT_RECORD);
      return;
    }

    void refreshSubscription();
  }, [authReady, isAuthenticated, refreshSubscription, replaceRecord]);

  const beginUpgrade = useCallback(
    async (tier: PremiumTier, billingCycle?: BillingCycle) => {
      if (tier === "free") {
        const fallback = getFallbackResult("You are already on the Free plan.", billingCycle ?? currentRecord.billingCycle);
        replaceRecord(mapPurchaseResultToRecord(fallback, currentRecord, billingCycle ?? currentRecord.billingCycle));
        return fallback;
      }

      const resolvedBillingCycle = billingCycle ?? currentRecord.billingCycle;
      const result = await purchaseAdapter.startSubscriptionPurchase(tier, resolvedBillingCycle);

      replaceRecord(mapPurchaseResultToRecord(result, currentRecord, resolvedBillingCycle));
      return result;
    },
    [currentRecord, purchaseAdapter, replaceRecord]
  );

  const restorePurchases = useCallback(async () => {
    const result = await purchaseAdapter.restorePurchases();
    replaceRecord(mapPurchaseResultToRecord(result, currentRecord, result.billingCycle ?? currentRecord.billingCycle));
    return result;
  }, [currentRecord, purchaseAdapter, replaceRecord]);

  const clearPendingState = useCallback(() => {
    replaceRecord({
      ...currentRecord,
      status: currentRecord.tier === "free" ? "not_premium" : "premium_active",
      pendingTier: null,
      lastMessage: "Pending upgrade state cleared.",
    });
  }, [currentRecord, replaceRecord]);

  const setSelectedBillingCycle = useCallback(
    (cycle: BillingCycle) => {
      updateRecord({ billingCycle: cycle });
    },
    [updateRecord]
  );

  const setPurchaseAdapter = useCallback((nextAdapter: PurchaseAdapter) => {
    setPurchaseAdapterState(nextAdapter);
  }, []);

  const environmentLabel = getPurchaseEnvironmentLabel(getPurchaseEnvironment());

  const value = useMemo<PremiumContextValue>(() => {
    const { status, tier, pendingTier, billingCycle, renewalDate, lastMessage } = currentRecord;
    const activePlan = PREMIUM_PLANS[tier];
    const pendingPlan = pendingTier ? PREMIUM_PLANS[pendingTier] : null;
    const statusTitle =
      status === "premium_active"
        ? `${activePlan.name} active`
        : status === "upgrade_pending"
          ? `${pendingPlan?.name ?? "Upgrade"} pending`
          : "Free plan";
    const statusDetail =
      status === "premium_active"
        ? renewalDate
          ? `${activePlan.name} is active and set to renew on ${renewalDate}.`
          : `${activePlan.name} is active with ${getPlanPriceLabel(tier, billingCycle)} billing.`
        : status === "upgrade_pending"
          ? `Your Stripe checkout is in progress for ${pendingPlan?.name ?? "the selected"} plan.`
          : "You are on Free. Upgrade to Pro or Elite to unlock deeper personalized guidance.";

    return {
      status,
      tier,
      selectedBillingCycle: billingCycle,
      pendingTier,
      statusTitle,
      statusDetail,
      environmentLabel,
      lastMessage,
      renewalDate,
      tierLabel: activePlan.name,
      currentPlanLabel: `${activePlan.name} ${getPlanPriceLabel(tier, billingCycle)}`,
      lockedFeatureCount: getLockedSubscriptionFeaturesForTier(tier).length,
      setSelectedBillingCycle,
      hasAccess: (featureKey) => canAccessFeature(featureKey, tier),
      getFeatureGate: (featureKey) => getSubscriptionGate(featureKey, tier),
      canAccessFeature: (featureKey) => canAccessFeature(featureKey, tier),
      beginUpgrade,
      restorePurchases,
      refreshSubscription,
      clearPendingState,
      setPurchaseAdapter,
    };
  }, [
    beginUpgrade,
    clearPendingState,
    currentRecord,
    environmentLabel,
    refreshSubscription,
    restorePurchases,
    setPurchaseAdapter,
    setSelectedBillingCycle,
  ]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const context = useContext(PremiumContext);

  if (!context) {
    throw new Error("usePremium must be used inside PremiumProvider");
  }

  return context;
}
