"use client";

import { useState } from "react";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { NewLeadsStats } from "@/components/dashboard/NewLeadsStats";
import { LeadsBySource } from "@/components/dashboard/LeadsBySource";
import { TeamLeaderboard } from "@/components/dashboard/TeamLeaderboard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DashboardDateFilter } from "@/components/dashboard/DashboardDateFilter";
import { type DateFilter, type CustomDateRange } from "@/lib/utils";
import { useDashboardData } from "@/hooks/use-data";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customRange, setCustomRange] = useState<CustomDateRange>();
  const { leads, activities, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back to Foremark CRM. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <DashboardDateFilter 
          value={dateFilter} 
          onChange={setDateFilter} 
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* Row 1 — KPI stats: New Leads */}
      <NewLeadsStats leads={leads} />

      {/* Row 2 — Pipeline Summary + Leads by Source */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineSummary leads={leads} dateFilter={dateFilter} customRange={customRange} />
        <LeadsBySource leads={leads} dateFilter={dateFilter} customRange={customRange} />
      </div>

      {/* Row 3 — Team Leaderboard + Recent Activity (15-20 entries) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamLeaderboard leads={leads} dateFilter={dateFilter} customRange={customRange} />
        <RecentActivityFeed leads={leads} activities={activities} dateFilter={dateFilter} customRange={customRange} />
      </div>
    </div>
  );
}
