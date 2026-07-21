"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { DateFilter, CustomDateRange } from "@/lib/utils";

interface DashboardDateFilterProps {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range: CustomDateRange) => void;
}

const OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

export function DashboardDateFilter({ value, onChange, customRange, onCustomRangeChange }: DashboardDateFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md bg-secondary/30 p-1">
        {OPTIONS.map((opt) => {
          const isCustom = opt.value === "custom";
          
          if (isCustom) {
            return (
              <Popover key={opt.value}>
                <PopoverTrigger
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1",
                    value === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {customRange?.from ? (
                    customRange.to ? (
                      <>
                        {format(customRange.from, "LLL dd, y")} -{" "}
                        {format(customRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customRange.from, "LLL dd, y")
                    )
                  ) : (
                    opt.label
                  )}
                  <ChevronRight className="h-3 w-3" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={customRange?.from}
                    selected={customRange}
                    onSelect={onCustomRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
