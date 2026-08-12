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

export function calculateShippingFee(district: string, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD_LKR) {
    return 0;
  }

  const metroDistricts = ["Colombo", "Gampaha"];
  if (metroDistricts.includes(district)) {
    return 350;
  }

  return 500;
}
