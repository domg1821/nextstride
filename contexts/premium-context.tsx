import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  PurchaseAdapter,
  PremiumStatus,
  getPurchaseEnvironment,
  getPurchaseEnvironmentLabel,
  placeholderPurchaseAdapter,
} from "@/lib/billing/premium-billing";
import { useProfile } from "@/contexts/profile-context";

type PremiumContextValue = {
  status: PremiumStatus;
  statusTitle: string;
  statusDetail: string;
  environmentLabel: string;
  lastMessage: string;
  renewalDate: string | null;
  beginUpgrade: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearPendingState: () => void;
  setPurchaseAdapter: (nextAdapter: PurchaseAdapter) => void;
};

type PremiumRecord = {
  status: PremiumStatus;
  renewalDate: string | null;
  lastMessage: string;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

const DEFAULT_RECORD: PremiumRecord = {
  status: "not_premium",
  renewalDate: null,
  lastMessage:
    "Premium billing is not connected yet. The upgrade flow is ready for future store integration.",
};

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { account } = useProfile();
  const accountKey = account?.email ?? "guest";
  const [recordsByKey, setRecordsByKey] = useState<Record<string, PremiumRecord>>({});
  const [purchaseAdapter, setPurchaseAdapterState] =
    useState<PurchaseAdapter>(placeholderPurchaseAdapter);

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

  const beginUpgrade = useCallback(async () => {
    const result = await purchaseAdapter.startSubscriptionPurchase();

    updateRecord({ lastMessage: result.message });

    if (result.status === "active") {
      updateRecord({
        status: "premium_active",
        renewalDate: result.renewalDate ?? null,
      });
      return;
    }

    if (result.status === "pending") {
      updateRecord({
        status: "upgrade_pending",
        renewalDate: null,
      });
      return;
    }

    updateRecord({
      status: "not_premium",
      renewalDate: null,
    });
  }, [purchaseAdapter, updateRecord]);

  const restorePurchases = useCallback(async () => {
    const result = await purchaseAdapter.restorePurchases();

    updateRecord({ lastMessage: result.message });

    if (result.status === "active") {
      updateRecord({
        status: "premium_active",
        renewalDate: result.renewalDate ?? null,
      });
      return;
    }

    if (currentRecord.status !== "premium_active") {
      updateRecord({
        status: result.status === "pending" ? "upgrade_pending" : "not_premium",
        renewalDate: null,
      });
    }
  }, [currentRecord.status, purchaseAdapter, updateRecord]);

  const clearPendingState = useCallback(() => {
    updateRecord({
      status: "not_premium",
      renewalDate: null,
      lastMessage: "Premium status reset to not premium while billing remains unconnected.",
    });
  }, [updateRecord]);

  const setPurchaseAdapter = useCallback((nextAdapter: PurchaseAdapter) => {
    setPurchaseAdapterState(nextAdapter);
  }, []);

  const environmentLabel = getPurchaseEnvironmentLabel(getPurchaseEnvironment());

  const value = useMemo<PremiumContextValue>(() => {
    const { status, renewalDate, lastMessage } = currentRecord;
    const statusTitle =
      status === "premium_active"
        ? "Premium active"
        : status === "upgrade_pending"
          ? "Upgrade pending"
          : "Not premium yet";
    const statusDetail =
      status === "premium_active"
        ? renewalDate
          ? `Premium is active and currently set to renew on ${renewalDate}.`
          : "Premium entitlement is active."
        : status === "upgrade_pending"
          ? "An upgrade was started, but the final store billing connection is still waiting to be added."
          : "You are on the free plan. Premium upgrade buttons are wired to a safe placeholder flow for now.";

    return {
      status,
      statusTitle,
      statusDetail,
      environmentLabel,
      lastMessage,
      renewalDate,
      beginUpgrade,
      restorePurchases,
      clearPendingState,
      setPurchaseAdapter,
    };
  }, [
    beginUpgrade,
    clearPendingState,
    currentRecord,
    environmentLabel,
    restorePurchases,
    setPurchaseAdapter,
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
