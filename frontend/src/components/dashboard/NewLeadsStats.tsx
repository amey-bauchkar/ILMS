"use client";

import { EnrichedLead } from "@/hooks/use-data";
import { Users, TrendingUp, Flame, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function NewLeadsStats({ leads }: { leads: EnrichedLead[] }) {
  const today = leads.filter((l) => isWithinDays(l.createdAt, 1)).length;
  const week = leads.filter((l) => isWithinDays(l.createdAt, 7)).length;
  const month = leads.filter((l) => isWithinDays(l.createdAt, 30)).length;
  const total = leads.length;

  const cards = [
    {
      title: "Today's Leads",
      value: today,
      subtext: "Captured today",
      color: "#e87811",
      bgColor: "rgba(232, 120, 17, 0.12)",
      borderColor: "rgba(232, 120, 17, 0.25)",
      icon: Flame,
    },
    {
      title: "This Week",
      value: week,
      subtext: "Past 7 days",
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.12)",
      borderColor: "rgba(59, 130, 246, 0.25)",
      icon: Calendar,
    },
    {
      title: "This Month",
      value: month,
      subtext: "Past 30 days",
      color: "#22c55e",
      bgColor: "rgba(34, 197, 94, 0.12)",
      borderColor: "rgba(34, 197, 94, 0.25)",
      icon: TrendingUp,
    },
    {
      title: "Total Leads",
      value: total,
      subtext: "All-time pipeline",
      color: "#a855f7",
      bgColor: "rgba(168, 85, 247, 0.12)",
      borderColor: "rgba(168, 85, 247, 0.25)",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="group bg-white border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[24px] p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden cursor-default transition-all duration-300"
          >
            {/* Ambient Corner Glow */}
            <div
              className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-20 group-hover:opacity-40"
              style={{ backgroundColor: c.color }}
            />

            {/* Top row: Label & Icon squircle */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs sm:text-sm font-semibold text-[#111318]">
                {c.title}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                style={{
                  backgroundColor: c.bgColor,
                  border: `1px solid ${c.borderColor}`,
                  color: c.color,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle: Big metric number */}
            <div className="relative z-10 my-1">
              <div className="text-3xl sm:text-4xl font-black text-[#111318] tracking-tight tabular-nums">
                {c.value}
              </div>
            </div>

            {/* Bottom: Subtitle with micro indicator */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 relative z-10">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="truncate">{c.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
