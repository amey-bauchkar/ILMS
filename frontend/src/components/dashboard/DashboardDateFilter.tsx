"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateFilter = "today" | "week" | "month" | "custom";

interface DashboardDateFilterProps {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
}

const OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

export function DashboardDateFilter({ value, onChange }: DashboardDateFilterProps) {
  return (
    <div
      className="inline-flex items-center gap-1 bg-secondary/40 border border-border rounded-lg p-1"
      role="group"
      aria-label="Dashboard date filter"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
