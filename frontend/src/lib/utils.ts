import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DateFilter = "today" | "week" | "month" | "custom";
export type CustomDateRange = { from: Date | undefined; to?: Date | undefined } | undefined;

export function isWithinFilter(
  dateString: string,
  filter: DateFilter,
  customRange?: CustomDateRange
): boolean {
  const date = new Date(dateString);
  const now = new Date();

  // Reset hours to start of day for accurate comparison
  const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const targetDate = resetTime(date);
  const today = resetTime(now);

  if (filter === "today") {
    return targetDate.getTime() === today.getTime();
  }

  if (filter === "week") {
    // Current week (e.g., from last Sunday/Monday to today)
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Assuming week starts on Sunday
    return targetDate >= startOfWeek && targetDate <= today;
  }

  if (filter === "month") {
    return (
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear()
    );
  }

  if (filter === "custom" && customRange?.from) {
    const fromDate = resetTime(customRange.from);
    const toDate = customRange.to ? resetTime(customRange.to) : fromDate;
    return targetDate >= fromDate && targetDate <= toDate;
  }

  // If custom but no range selected, return everything
  return true;
}

export const DEFAULT_STATUS_COLORS: Record<string, string> = {
  "New": "#64748b",
  "Attempted Contact": "#FF5A1F",
  "Contacted": "#f97316",
  "Qualified": "#ea580c",
  "Proposal Sent": "#f59e0b",
  "Negotiation": "#d97706",
  "Won": "#10b981",
  "Lost": "#ef4444",
  "On Hold": "#eab308",
  "Junk": "#71717a",
};

export function resolveStatusColor(statusName?: string | null, rawColor?: string | null): string {
  if (!statusName) return rawColor || "#FF5A1F";
  
  // Attempted Contact should always be Foremark signature orange
  if (statusName === "Attempted Contact") {
    return "#FF5A1F";
  }

  if (rawColor && rawColor !== "#3b82f6" && rawColor !== "#737373" && rawColor !== "#000000") {
    return rawColor;
  }

  return DEFAULT_STATUS_COLORS[statusName] || rawColor || "#FF5A1F";
}

