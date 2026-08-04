import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRate(value: number | null) {
  return value === null
    ? "UNKNOWN"
    : new Intl.NumberFormat("en-CA", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value);
}

export function formatDate(value?: string) {
  if (!value) return "UNKNOWN";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
