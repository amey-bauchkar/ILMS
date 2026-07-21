"use client";

import { useState } from "react";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { NewLeadsStats } from "@/components/dashboard/NewLeadsStats";
import { LeadsBySource } from "@/components/dashboard/LeadsBySource";
import { ConversionRate } from "@/components/dashboard/ConversionRate";
import { PipelineValue } from "@/components/dashboard/PipelineValue";
import { FollowUpsSummary } from "@/components/dashboard/FollowUps";
import { TeamLeaderboard } from "@/components/dashboard/TeamLeaderboard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { WonVsLostTrend } from "@/components/dashboard/WonVsLostTrend";
import { DashboardDateFilter } from "@/components/dashboard/DashboardDateFilter";
import { type DateFilter, type CustomDateRange } from "@/lib/utils";

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customRange, setCustomRange] = useState<CustomDateRange>();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground text-base">
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

      {/* Row 1 — KPI stats: New Leads + Conversion Rate */}
      <div className="grid gap-4 sm:grid-cols-2">
        <NewLeadsStats />
        <ConversionRate dateFilter={dateFilter} customRange={customRange} />
      </div>

      {/* Row 2 — Pipeline Summary + Leads by Source */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineSummary dateFilter={dateFilter} customRange={customRange} />
        <LeadsBySource dateFilter={dateFilter} customRange={customRange} />
      </div>

      {/* Row 3 — Pipeline Value (Stacked Bar) + Won vs Lost Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineValue dateFilter={dateFilter} customRange={customRange} />
        <WonVsLostTrend />
      </div>

      {/* Row 4 — Today's Follow-ups + Overdue Follow-ups (clickable rows) */}
      <FollowUpsSummary />

      {/* Row 5 — Team Leaderboard + Recent Activity (15-20 entries) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamLeaderboard dateFilter={dateFilter} customRange={customRange} />
        <RecentActivityFeed dateFilter={dateFilter} customRange={customRange} />
      </div>
    </div>
  );
}
