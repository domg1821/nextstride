import { Platform } from "react-native";
import { PREMIUM_PRODUCT } from "@/lib/premium-products";

export type PremiumStatus = "not_premium" | "upgrade_pending" | "premium_active";
export type PurchaseEnvironment = "ios_app_store" | "android_play_store" | "web_placeholder";
export type PurchaseResult =
  | {
      status: "pending";
      environment: PurchaseEnvironment;
      message: string;
    }
  | {
      status: "active";
      environment: PurchaseEnvironment;
      message: string;
      renewalDate?: string;
    }
  | {
      status: "inactive";
      environment: PurchaseEnvironment;
      message: string;
    };

export type PurchaseAdapter = {
  startSubscriptionPurchase: () => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
};

export function getPurchaseEnvironment(): PurchaseEnvironment {
  if (Platform.OS === "ios") {
    return "ios_app_store";
  }

  if (Platform.OS === "android") {
    return "android_play_store";
  }

  return "web_placeholder";
}

export function getPurchaseEnvironmentLabel(environment: PurchaseEnvironment) {
  if (environment === "ios_app_store") {
    return "Apple App Store subscription";
  }

  if (environment === "android_play_store") {
    return "Google Play subscription";
  }

  return "Web placeholder flow";
}

export const placeholderPurchaseAdapter: PurchaseAdapter = {
  async startSubscriptionPurchase() {
    const environment = getPurchaseEnvironment();

    return {
      status: "pending",
      environment,
      message:
        environment === "web_placeholder"
          ? "Premium checkout is not connected on web yet. The page is ready for a future website billing decision."
          : `Premium upgrade started for ${getPurchaseEnvironmentLabel(environment).toLowerCase()}, but the real store billing connector is not wired yet for ${PREMIUM_PRODUCT.productIds[Platform.OS as "ios" | "android"]}.`,
    };
  },
  async restorePurchases() {
    const environment = getPurchaseEnvironment();

    return {
      status: "inactive",
      environment,
      message:
        environment === "web_placeholder"
          ? "There are no web Premium purchases to restore yet."
          : `Restore purchases is ready for ${getPurchaseEnvironmentLabel(environment).toLowerCase()} once store receipt validation is connected.`,
    };
  },
};
