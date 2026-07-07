import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Currency = "INR" | "USD";

// India → INR, everyone else → USD. Uses the browser's IANA timezone so no geo-IP
// call is needed; the server still verifies live pricing at checkout.
export function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "INR" : "USD";
  } catch {
    return "INR";
  }
}

export function currencySymbol(currency: Currency): string {
  return currency === "USD" ? "$" : "₹";
}

export function formatPrice(currency: Currency, amount: number): string {
  return `${currencySymbol(currency)}${amount}`;
}
