"use client";

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
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 rounded-full p-1 bg-zinc-100 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shadow-inner w-full sm:w-auto">
        {OPTIONS.map((opt) => {
          const isCustom = opt.value === "custom";
          const isSelected = value === opt.value;
          
          if (isCustom) {
            return (
              <Popover key={opt.value}>
                <PopoverTrigger
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    "px-3.5 py-1 text-xs rounded-full transition-all focus-visible:outline-none flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer",
                    isSelected
                      ? "bg-[#111318] dark:bg-white text-white dark:text-[#111318] shadow-sm font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 font-medium"
                  )}
                >
                  {customRange?.from ? (
                    customRange.to ? (
                      <>
                        {format(customRange.from, "LLL dd")} - {format(customRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(customRange.from, "LLL dd, y")
                    )
                  ) : (
                    opt.label
                  )}
                  <ChevronRight className="h-3 w-3" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-[#151821] border border-black/[0.08] dark:border-white/10 shadow-2xl rounded-2xl text-foreground" align="end">
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
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-3.5 py-1 text-xs rounded-full transition-all focus-visible:outline-none shrink-0 active:scale-95 cursor-pointer",
                isSelected
                  ? "bg-[#111318] dark:bg-white text-white dark:text-[#111318] shadow-sm font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 font-medium"
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
