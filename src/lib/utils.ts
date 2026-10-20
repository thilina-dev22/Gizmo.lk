import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  FLAT_DELIVERY_FEE_LKR,
  FREE_SHIPPING_THRESHOLD_LKR,
  LOW_STOCK_THRESHOLD,
  MAX_ITEM_QUANTITY,
  PAYMENT_GATEWAY_FEE_PERCENT,
} from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatLKR(amount: number): string {
  return lkrFormatter.format(Number.isFinite(amount) ? amount : 0).replace("LKR", "Rs.");
}

export function calculateShippingFee(_district?: string, subtotal: number = 0): number {
  // Flat islandwide delivery fee, free for orders at or above the threshold (see Shipping Policy)
  return subtotal >= FREE_SHIPPING_THRESHOLD_LKR ? 0 : FLAT_DELIVERY_FEE_LKR;
}

export function calculatePaymentGatewayFee(subtotal: number, paymentMethod: string): number {
  if (paymentMethod === "PAYHERE" || paymentMethod === "CARD") {
    return Math.round(subtotal * PAYMENT_GATEWAY_FEE_PERCENT);
  }
  return 0;
}

/**
 * Orders store delivery + gateway fees combined in `shippingFeeLkr`.
 * This derives the individual amounts for invoices and summaries.
 */
export function getOrderFeeBreakdown(order: {
  subtotalLkr?: number;
  totalLkr?: number;
  paymentMethod?: string;
}) {
  const subtotal = Number(order.subtotalLkr) || 0;
  const total = Number(order.totalLkr) || 0;
  const combinedFees = Math.max(0, total - subtotal);
  const gateway = Math.min(combinedFees, calculatePaymentGatewayFee(subtotal, order.paymentMethod || ""));
  return { subtotal, delivery: combinedFees - gateway, gateway, total };
}

/** Returns the local 10-digit format (e.g. 0771234567) or null when the number is invalid. */
export function normalizeSriLankanPhone(input: string): string | null {
  let digits = (input || "").replace(/[\s\-().]/g, "");
  if (digits.startsWith("+94")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("0094")) digits = `0${digits.slice(4)}`;
  else if (/^94\d{9}$/.test(digits)) digits = `0${digits.slice(2)}`;
  else if (/^7\d{8}$/.test(digits)) digits = `0${digits}`;
  return /^0\d{9}$/.test(digits) ? digits : null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/.test(email.trim());
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
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback below if JSON fails
      }
    }
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const result: Record<string, string> = {};
      parts.forEach((part, index) => {
        const separator = part.indexOf(":");
        if (separator > 0) {
          result[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
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
  if (Array.isArray(imagesInput)) return imagesInput.filter((url) => typeof url === "string" && url.trim());
  if (typeof imagesInput === "string") {
    const trimmed = imagesInput.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter((url) => typeof url === "string" && url.trim());
      } catch (e) {
        // Fallback
      }
    }
    if (trimmed.startsWith("http")) return [trimmed];
  }
  return [];
}

function splitList(value: unknown): string[] {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Selectable colours / variants and display attributes stored in a product's specs JSON. */
export function getProductOptions(specsInput: any) {
  const specs = safeParseSpecs(specsInput);
  const colors = splitList(specs["Colors"] || specs["colors"] || specs["Color"] || specs["color"]);
  const variants = splitList(
    specs["Variants"] || specs["variants"] || specs["Voltage"] || specs["voltage"] || specs["Options"] || specs["options"]
  );
  const variantTitle =
    specs["VariantType"] || (specs["Voltage"] || specs["voltage"] ? "Voltage / Model" : "Options / Variations");
  const warranty = specs["Warranty"] || specs["warranty"] || "7-Day Replacement Guarantee";
  const brand = specs["Brand"] || specs["brand"] || "";
  return { specs, colors, variants, variantTitle, warranty, brand };
}

/** Default cart options for quick "Add to cart" buttons (first colour & variant, product warranty). */
export function getDefaultCartOptions(specsInput: any) {
  const { colors, variants, warranty } = getProductOptions(specsInput);
  return { selectedColor: colors[0] || "", selectedVariant: variants[0] || "", warranty };
}

export type StockTone = "in" | "low" | "out";

export function getStockStatus(stock: number | undefined | null): { tone: StockTone; label: string; canBuy: boolean } {
  const units = typeof stock === "number" ? stock : MAX_ITEM_QUANTITY;
  if (units <= 0) return { tone: "out", label: "Out of Stock", canBuy: false };
  if (units <= LOW_STOCK_THRESHOLD) return { tone: "low", label: `Only ${units} left`, canBuy: true };
  return { tone: "in", label: "In Stock", canBuy: true };
}

export function getMaxPurchasableQuantity(stock: number | undefined | null): number {
  if (typeof stock !== "number") return MAX_ITEM_QUANTITY;
  return Math.max(0, Math.min(MAX_ITEM_QUANTITY, stock));
}

/** Opens a data: URL (e.g. an uploaded bank slip) in a new tab — browsers block direct navigation to data URLs. */
export function openDataUrlInNewTab(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) {
    window.open(dataUrl, "_blank", "noopener,noreferrer");
    return;
  }
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/^data:([^;]+)/)?.[1] || "application/octet-stream";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
  window.open(blobUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
