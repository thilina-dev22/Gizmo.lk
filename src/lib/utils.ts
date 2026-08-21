import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FREE_SHIPPING_THRESHOLD_LKR } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLKR(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("LKR", "Rs.");
}

import { FLAT_DELIVERY_FEE_LKR, PAYMENT_GATEWAY_FEE_PERCENT } from "./constants";

export function calculateShippingFee(_district?: string, _subtotal?: number): number {
  // Flat delivery fee for any city across Sri Lanka is 450 LKR
  return FLAT_DELIVERY_FEE_LKR;
}

export function calculatePaymentGatewayFee(subtotal: number, paymentMethod: string): number {
  if (paymentMethod === "PAYHERE" || paymentMethod === "CARD") {
    return Math.round(subtotal * PAYMENT_GATEWAY_FEE_PERCENT);
  }
  return 0;
}

export function safeParseSpecs(specsInput: any): Record<string, string> {
  if (!specsInput) return {};
  if (typeof specsInput === "object" && !Array.isArray(specsInput)) {
    return specsInput;
  }
  if (typeof specsInput === "string") {
    const trimmed = specsInput.trim();
    if (!trimmed) return {};
    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // Fallback below if JSON fails
      }
    }
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const result: Record<string, string> = {};
      parts.forEach((part, index) => {
        if (part.includes(":")) {
          const [k, v] = part.split(":");
          result[k.trim()] = v.trim();
        } else {
          result[`Highlight ${index + 1}`] = part;
        }
      });
      return result;
    }
    return { "Overview": trimmed };
  }
  return {};
}

export function safeParseImages(imagesInput: any): string[] {
  if (!imagesInput) return [];
  if (Array.isArray(imagesInput)) return imagesInput;
  if (typeof imagesInput === "string") {
    const trimmed = imagesInput.trim();
    if (trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // Fallback
      }
    }
    if (trimmed.startsWith("http")) return [trimmed];
  }
  return [];
}
