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
