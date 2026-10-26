"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StudioAnalyticsDashboard } from "@/components/dashboard/StudioAnalyticsDashboard";
import { TeamLeaderboard } from "@/components/dashboard/TeamLeaderboard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DashboardDateFilter } from "@/components/dashboard/DashboardDateFilter";
import { type DateFilter, type CustomDateRange } from "@/lib/utils";
import { useDashboardData } from "@/hooks/use-data";
import { Loader2 } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customRange, setCustomRange] = useState<CustomDateRange>();
  const { leads = [], activities = [], loading } = useDashboardData();

  // Analytics Deep Dive Tab
  if (currentTab === "analytics") {
    if (loading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="p-5 rounded-2xl bg-white shadow-lg border border-black/[0.05] flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#181b20]" />
            <span className="text-sm text-[#7d8592] font-medium">Loading analytics...</span>
          </div>
        </div>
      );
    }

    return <StudioAnalyticsDashboard leads={leads} activities={activities} title="Analytics" />;
  }

  // Teams & Activity Tab
  if (currentTab === "teams" || currentTab === "pulse") {
    if (loading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] shadow-lg border border-black/[0.05] dark:border-white/10 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#181b20] dark:text-[#c8f237]" />
            <span className="text-sm text-[#7d8592] dark:text-zinc-300 font-medium">Loading team activity...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-[1560px] mx-auto pb-12 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111318] dark:text-white">Team Members & Activity</h2>
            <p className="text-xs text-[#7d8592] dark:text-zinc-400">Real-time sales reps activity and audit events</p>
          </div>
          <DashboardDateFilter 
            value={dateFilter} 
            onChange={setDateFilter} 
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TeamLeaderboard leads={leads} dateFilter={dateFilter} customRange={customRange} />
          <RecentActivityFeed leads={leads} activities={activities} dateFilter={dateFilter} customRange={customRange} />
        </div>
      </div>
    );
  }

  // Default & Analytics: Unified Executive Studio Dashboard matching the approved reference design
  return (
    <StudioAnalyticsDashboard 
      leads={leads} 
      activities={activities} 
      title={currentTab === "analytics" ? "Analytics" : "Dashboard"} 
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
