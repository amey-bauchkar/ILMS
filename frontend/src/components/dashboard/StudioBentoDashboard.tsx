"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  SlidersHorizontal, 
  IndianRupee, 
  X, 
  Search, 
  Briefcase, 
  Plus, 
  MessageSquare, 
  TrendingUp,
  Tag
} from "lucide-react";

interface StudioBentoDashboardProps {
  leads: any[];
  activities?: any[];
}

export function StudioBentoDashboard({ leads = [] }: StudioBentoDashboardProps) {
  // 1. Overall Estimated Deal Value & Pipeline Calculations directly from `leads`
  const {
    totalLeadsCount,
    hasWrittenDealValue,
    leadsWithDealValueCount,
    totalEstimatedDealValue,
    hotDealsValue,
    warmDealsValue,
    hotLeadsCount,
    warmLeadsCount,
    avgDealValue,
    contactedCount,
    attemptedCount,
    qualifiedCount,
    newCount,
    activeLeadsCount,
    activeLeadsValue,
    hasActiveDealValue,
    weeklyActivity,
    peakDayIndex,
    peakDayCount
  } = useMemo(() => {
    const totalCount = leads.length;

    // Filter ONLY leads where estimated deal value is actually written and > 0
    const leadsWithVal = leads.filter(
      (l) => typeof l.dealValue === "number" && !isNaN(l.dealValue) && l.dealValue > 0
    );

    const totalVal = leadsWithVal.reduce((sum, l) => sum + Number(l.dealValue), 0);
    const hasValue = leadsWithVal.length > 0 && totalVal > 0;

    const hot = leads.filter(l => l.priority === "Hot");
    const warm = leads.filter(l => l.priority === "Warm" || !l.priority);

    // Sum written values only
    const hotVal = hot.reduce((s, l) => s + (typeof l.dealValue === "number" && l.dealValue > 0 ? l.dealValue : 0), 0);
    const warmVal = warm.reduce((s, l) => s + (typeof l.dealValue === "number" && l.dealValue > 0 ? l.dealValue : 0), 0);
    const avgVal = leadsWithVal.length > 0 ? Math.round(totalVal / leadsWithVal.length) : 0;

    // Status breakdown from leads
    const contacted = leads.filter(l => l.status === "Contacted" || l.status?.toLowerCase().includes("contacted"));
    const attempted = leads.filter(l => l.status === "Attempted Contact" || l.status?.toLowerCase().includes("attempted"));
    const qualified = leads.filter(l => l.status === "Qualified" || l.status?.toLowerCase().includes("qualified"));
    const newLeads = leads.filter(l => l.status === "New" || l.status?.toLowerCase().includes("new"));

    const cCount = contacted.length;
    const aCount = attempted.length;
    const qCount = qualified.length;
    const nCount = newLeads.length;

    const activeCount = cCount + aCount + qCount + nCount;
    const activeLeadsList = contacted.concat(attempted, qualified, newLeads);
    const activeVal = activeLeadsList.reduce((s, l) => s + (typeof l.dealValue === "number" && l.dealValue > 0 ? l.dealValue : 0), 0);
    const hasActiveVal = activeVal > 0;

    // Group leads by creation day of week: Mon -> Sun
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    leads.forEach(l => {
      if (l.createdAt) {
        const d = new Date(l.createdAt);
        // getDay: 0 is Sun, 1 is Mon ... 6 is Sat
        const dayIdx = (d.getDay() + 6) % 7; // Convert to 0=Mon, 6=Sun
        dayCounts[dayIdx] += 1;
      }
    });

    const maxDayCount = Math.max(...dayCounts, 1);
    let peakIdx = 0;
    let peakCnt = 0;

    const weekly = dayNames.map((day, idx) => {
      const count = dayCounts[idx];
      if (count > peakCnt) {
        peakCnt = count;
        peakIdx = idx;
      }
      const heightPercent = maxDayCount > 0 && count > 0 
        ? Math.max(18, Math.round((count / maxDayCount) * 94)) 
        : 14;
      return {
        day,
        count,
        height: `${heightPercent}%`,
        isSpecial: false,
        tag: `${count} leads`
      };
    });

    if (peakCnt > 0) {
      weekly[peakIdx].isSpecial = true;
      weekly[peakIdx].tag = `${peakCnt} leads`;
    }

    return {
      totalLeadsCount: totalCount,
      hasWrittenDealValue: hasValue,
      leadsWithDealValueCount: leadsWithVal.length,
      totalEstimatedDealValue: totalVal,
      hotDealsValue: hotVal,
      warmDealsValue: warmVal,
      hotLeadsCount: hot.length,
      warmLeadsCount: warm.length,
      avgDealValue: avgVal,
      contactedCount: cCount,
      attemptedCount: aCount,
      qualifiedCount: qCount,
      newCount: nCount,
      activeLeadsCount: activeCount,
      activeLeadsValue: activeVal,
      hasActiveDealValue: hasActiveVal,
      weeklyActivity: weekly,
      peakDayIndex: peakIdx,
      peakDayCount: peakCnt
    };
  }, [leads]);

  const [hoveredBar, setHoveredBar] = useState<number | null>(peakDayIndex);
  const selectedRange = { from: "22 6 2025", to: "26 6 2025" };

  const formatCurrency = (val: number) => {
    if (val <= 0) return "—";
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const contactedPct = totalLeadsCount > 0 ? Math.round((contactedCount / totalLeadsCount) * 100) : 0;
  const attemptedPct = totalLeadsCount > 0 ? Math.round((attemptedCount / totalLeadsCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1560px] mx-auto select-none pb-12 animate-in fade-in duration-300">
      {/* 1. Sub-Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pt-1 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] text-[11px] font-medium text-[#7d8592]">
              <Tag className="w-3 h-3 text-[#a1a8b5]" />
              Sales
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] text-[11px] font-medium text-[#7d8592]">
              Live CRM Leads
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#111318]">
            Product Sales Performance
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link 
            href="/leads"
            className="w-10 h-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] flex items-center justify-center text-[#7d8592] hover:text-[#111318] hover:bg-black/[0.02] transition-all active:scale-95"
            title="Search Leads"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link 
            href="/leads"
            className="w-10 h-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] flex items-center justify-center text-[#7d8592] hover:text-[#111318] hover:bg-black/[0.02] transition-all active:scale-95"
            title="Filter Leads"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>

          <Link
            href="/leads"
            className="w-10 h-10 rounded-full bg-[#181b20] text-white shadow-md shadow-black/15 flex items-center justify-center hover:bg-[#282c35] transition-all active:scale-95"
            title={`View ${totalLeadsCount} Leads`}
          >
            <Briefcase className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] text-xs font-semibold text-[#111318]">
              {selectedRange.from}
            </span>
            <span className="px-4 py-2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] text-xs font-semibold text-[#111318]">
              {selectedRange.to}
            </span>
          </div>

          <Link
            href="/leads?action=create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] text-xs font-semibold text-[#111318] hover:bg-black/[0.02] transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add lead</span>
          </Link>

          <button
            type="button"
            onClick={() => alert(`Exporting ${totalLeadsCount} CRM Leads Report`)}
            className="px-4 py-2 rounded-full bg-black/[0.05] hover:bg-black/[0.08] text-xs font-semibold text-[#111318] transition-all active:scale-95"
          >
            Create a report
          </button>
        </div>
      </div>

      {/* 2. Main Studio Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* ========================================================================= */}
        {/* CARD 1: TALL SHOWCASE CARD (Estimated Deal Value Overall)                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-[32px] border border-black/[0.04] shadow-[0_12px_36px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 min-h-[640px]">
          {/* Top: Estimated Deal Value Header & Badge */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#111318] tracking-tight">
                Estimated Deal Value
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#c8f237] text-[10px] font-bold text-[#111318] shadow-xs">
                {hasWrittenDealValue ? "Overall" : "Not Set"}
              </span>
            </div>
            <button 
              type="button"
              className="w-7 h-7 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#7d8592] hover:text-[#111318] transition-all active:scale-90"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center: Estimated Deal Value Overall Showcase Card (Clean Studio Bento) */}
          <div className="my-auto py-2 flex flex-col justify-center relative z-10">
            <div className="p-5 sm:p-6 rounded-[26px] bg-[#f8fafc] border border-black/[0.04] flex flex-col gap-4 relative overflow-hidden transition-all duration-300 group-hover:bg-[#f4f6fa]">
              {/* Top Row with Icon & Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#c8f237] shadow-xs flex items-center justify-center text-[#111318] shrink-0 font-bold">
                    <IndianRupee className="w-5 h-5 text-[#111318]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#7d8592] uppercase tracking-wider block">
                      Estimated Deal Value Overall
                    </span>
                    <span className="text-[11px] font-medium text-[#a1a8b5]">
                      {hasWrittenDealValue 
                        ? `${leadsWithDealValueCount} of ${totalLeadsCount} leads priced`
                        : "No lead value set"}
                    </span>
                  </div>
                </div>

                <Link 
                  href="/leads"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#111318] hover:scale-110 active:scale-95 transition-all"
                  title="View and Edit Leads"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Big Value Display */}
              <div className="pt-1">
                {hasWrittenDealValue ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#111318] tracking-tight">
                      {formatCurrency(totalEstimatedDealValue)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#7d8592] tracking-tight">
                      —
                    </span>
                    <p className="text-xs text-[#a1a8b5] mt-1">
                      Add estimated deal value inside lead edit option
                    </p>
                  </div>
                )}
              </div>

              {/* Pipeline Value Distribution Bar */}
              {hasWrittenDealValue && (
                <div className="space-y-2 pt-2 border-t border-black/[0.05]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#7d8592]">
                    <span>Pipeline Distribution</span>
                    <span className="text-[#111318]">{Math.round((hotDealsValue / (totalEstimatedDealValue || 1)) * 100)}% Hot</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-black/[0.05] overflow-hidden flex">
                    <div 
                      className="h-full bg-[#c8f237] transition-all duration-500" 
                      style={{ width: `${Math.round((hotDealsValue / (totalEstimatedDealValue || 1)) * 100)}%` }}
                      title={`Hot Deals: ${formatCurrency(hotDealsValue)}`}
                    />
                    <div 
                      className="h-full bg-[#111318] transition-all duration-500" 
                      style={{ width: `${Math.round((warmDealsValue / (totalEstimatedDealValue || 1)) * 100)}%` }}
                      title={`Warm Deals: ${formatCurrency(warmDealsValue)}`}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#7d8592] pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#c8f237]" />
                      Hot ({formatCurrency(hotDealsValue)})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#111318]" />
                      Warm ({formatCurrency(warmDealsValue)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Metrics: Deal Value Segments + Lime & White Pillars */}
          <div className="flex flex-col gap-3 pt-2 relative z-10">
            {/* Value headers */}
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#111318]">
                  {hotDealsValue > 0 ? formatCurrency(hotDealsValue) : "—"}
                </span>
                <span className="text-xs font-normal text-[#7d8592] ml-1.5">Hot Deals</span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#111318]">
                  {warmDealsValue > 0 ? formatCurrency(warmDealsValue) : "—"}
                </span>
                <span className="text-xs font-normal text-[#7d8592] ml-1.5">Warm Deals</span>
              </div>
            </div>

            {/* Two Vertical Indicator Pillars */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Left Pillar: Lime Green (Hot Priority Deals) */}
              <div className="rounded-[22px] bg-[#c8f237] p-4 flex flex-col justify-between h-36 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                <div>
                  <div className="text-base sm:text-lg font-bold text-[#111318] tracking-tight leading-none">
                    {hotDealsValue > 0 ? formatCurrency(hotDealsValue) : "—"}
                  </div>
                  <div className="text-[11px] font-medium text-[#111318]/70 mt-0.5">
                    {hotLeadsCount} High Priority Deals
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#111318]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{hotDealsValue > 0 ? "Active Value" : "Value Not Written"}</span>
                </div>
              </div>

              {/* Right Pillar: Ceramic White */}
              <div className="rounded-[22px] bg-[#f4f6fa] border border-black/[0.04] p-4 flex flex-col justify-between h-36 transition-transform duration-300 group-hover:scale-[1.02]">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-[#c8f237] text-xs font-bold text-[#111318] shadow-xs">
                    {avgDealValue > 0 ? `Avg: ${formatCurrency(avgDealValue)}` : "Avg: —"}
                  </span>
                  <div className="text-[11px] font-medium text-[#7d8592] mt-1.5">
                    {totalLeadsCount} Total Leads in CRM
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#7d8592]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#111318]" />
                  <span className="text-[#111318]">
                    {hasWrittenDealValue ? `${leadsWithDealValueCount} with value` : "Edit to add value"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 2x2 BENTO TILES (Col-span 8)                                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          
          {/* ----------------------------------------------------------------------- */}
          {/* CARD 2: TOP CENTER (Lead Activity - Real Inflow by Day of Week)        */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-[32px] border border-black/[0.04] shadow-[0_12px_36px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#111318] tracking-tight">
                Lead Activity
              </span>
              <div className="flex items-center gap-2">
                <Link 
                  href="/leads"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                  title="Lead Filters"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Link>
                <Link 
                  href="/leads"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                  title="Open Leads"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Stat Row */}
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="text-xs text-[#7d8592] font-medium">Total leads in CRM</span>
              <div className="text-4xl font-bold tracking-tight text-[#111318]">
                {totalLeadsCount}
              </div>
            </div>

            {/* Weekly Rounded Bar Chart from Real Leads */}
            <div className="flex items-end justify-between gap-2.5 h-36 pt-4 relative">
              {weeklyActivity.map((item, index) => {
                const isHovered = hoveredBar === index;

                return (
                  <div 
                    key={item.day}
                    onMouseEnter={() => setHoveredBar(index)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Floating Lime Tag Pill (Over peak day by default or hovered) */}
                    {(item.isSpecial || isHovered) && item.count > 0 && (
                      <div className="absolute -top-7 z-20 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#c8f237] text-[10px] font-bold text-[#111318] shadow-sm whitespace-nowrap">
                          {item.tag}
                        </span>
                        <div className="w-1.5 h-1.5 bg-[#c8f237] rotate-45 -mt-0.5" />
                      </div>
                    )}

                    {/* The Bar */}
                    <div className="w-full max-w-[28px] h-full flex items-end">
                      {item.isSpecial ? (
                        /* Hatched / Striped Peak Day Column */
                        <div 
                          className="w-full rounded-2xl border border-[#c3cad6] transition-all duration-300 relative overflow-hidden group-hover:scale-105"
                          style={{
                            height: item.height,
                            background: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 3px, #f1f4f9 3px, #f1f4f9 8px)"
                          }}
                        />
                      ) : (
                        /* Standard Rounded Grey Bar */
                        <div 
                          className="w-full rounded-2xl transition-all duration-300"
                          style={{ 
                            height: item.height,
                            backgroundColor: isHovered ? "#181b20" : "#e8ebf0"
                          }}
                        />
                      )}
                    </div>

                    {/* Day label */}
                    <span className="text-[11px] font-medium text-[#7d8592] mt-2 group-hover:text-[#111318]">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 3: TOP RIGHT (Pipeline Value Comparison - Hatched Area Line Chart) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-[32px] border border-black/[0.04] shadow-[0_12px_36px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#111318] tracking-tight">
                Comparison of Pipeline
              </span>
              <div className="flex items-center gap-2">
                <Link 
                  href="/leads"
                  className="w-8 h-8 rounded-full bg-[#181b20] text-white shadow-xs flex items-center justify-center hover:bg-[#282c35] active:scale-95 transition-all"
                  title="Pipeline Filter"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Link>
                <Link 
                  href="/dashboard?tab=teams"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                  title="Team Activity Feed"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Link>
                <Link 
                  href="/dashboard?tab=analytics"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                  title="Analytics Breakdown"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Stat Row */}
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="text-xs text-[#7d8592] font-medium">
                {hasWrittenDealValue ? "Total written pipeline value" : "Total pipeline leads"}
              </span>
              <div className="text-4xl font-bold tracking-tight text-[#111318]">
                {hasWrittenDealValue ? formatCurrency(totalEstimatedDealValue) : `${totalLeadsCount} Leads`}
              </div>
            </div>

            {/* Dual Line Comparison Chart with Hatched Fill */}
            <div className="relative h-36 pt-2">
              {/* Tags */}
              <div className="absolute left-0 top-3 flex flex-col gap-1 text-[10px] font-medium text-[#7d8592] z-10">
                <span>Active</span>
                <span>Target</span>
              </div>

              {/* Centered Floating Lime Badge */}
              <div className="absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2 z-20">
                <span className="px-2.5 py-0.5 rounded-full bg-[#c8f237] text-[10px] font-bold text-[#111318] shadow-sm">
                  {hasWrittenDealValue ? `${leadsWithDealValueCount} with value` : "97 leads tracked"}
                </span>
              </div>

              <svg viewBox="0 0 320 100" className="w-full h-full overflow-visible">
                <defs>
                  {/* Diagonal hatched stripe pattern */}
                  <pattern id="revenueHatch" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="7" stroke="#b0b8c6" strokeWidth="1.4" />
                  </pattern>
                </defs>

                {/* Hatched Polygon between Curve 1 (top) and Curve 2 (bottom) */}
                <polygon 
                  points="15,60 60,62 110,68 160,65 210,62 260,52 310,40 310,24 260,34 210,48 160,52 110,50 60,44 15,38"
                  fill="url(#revenueHatch)"
                  opacity="0.85"
                />

                {/* Dashed Upper Curve */}
                <path 
                  d="M 15 38 Q 60 44, 110 50 T 210 48 T 310 24" 
                  fill="none" 
                  stroke="#94a3b8" 
                  strokeWidth="1.6" 
                  strokeDasharray="4 4" 
                />

                {/* Solid Lower Curve */}
                <path 
                  d="M 15 60 Q 60 62, 110 68 T 210 62 T 310 40" 
                  fill="none" 
                  stroke="#181b20" 
                  strokeWidth="2" 
                />

                {/* Data points on edges */}
                <circle cx="15" cy="38" r="2.5" fill="#94a3b8" />
                <circle cx="310" cy="24" r="2.5" fill="#94a3b8" />
                <circle cx="15" cy="60" r="2.5" fill="#181b20" />
                <circle cx="310" cy="40" r="2.5" fill="#181b20" />
              </svg>

              {/* Day Labels */}
              <div className="flex items-center justify-between text-[11px] font-medium text-[#7d8592] pt-1">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 4: BOTTOM CENTER (Active Lead Value & Real Chips)                 */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-[32px] border border-black/[0.04] shadow-[0_12px_36px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#111318] tracking-tight">
                Active Pipeline
              </span>
              <div className="flex items-center gap-2">
                <Link 
                  href="/leads"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                  title="Lead Options"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Link>
                <Link 
                  href="/leads"
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                  title="View Active Leads"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Stat Row */}
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="text-xs text-[#7d8592] font-medium">In active communication</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-[#111318]">
                  {hasActiveDealValue ? formatCurrency(activeLeadsValue) : `${activeLeadsCount} Leads`}
                </span>
                <span className="text-xs text-[#7d8592] font-medium">
                  {hasActiveDealValue ? `${activeLeadsCount} active` : "value not set"}
                </span>
              </div>
            </div>

            {/* Bottom: Left Stat Chips + Right Smooth Bezier Spline Curve */}
            <div className="grid grid-cols-12 gap-3 items-end pt-3">
              {/* Left Column: Real Chips from Leads Data */}
              <div className="col-span-5 flex flex-col gap-2">
                <Link 
                  href="/leads"
                  className="px-3 py-2 rounded-xl bg-[#f4f6fa] hover:bg-[#ebedf2] border border-black/[0.04] flex items-center gap-2 transition-colors"
                >
                  <span className="text-xs font-bold text-[#111318]">{contactedCount}</span>
                  <span className="text-[11px] text-[#7d8592] truncate">Contacted</span>
                </Link>
                <Link 
                  href="/leads"
                  className="px-3 py-2 rounded-xl bg-[#f4f6fa] hover:bg-[#ebedf2] border border-black/[0.04] flex items-center gap-2 transition-colors"
                >
                  <span className="text-xs font-bold text-[#111318]">{attemptedCount}</span>
                  <span className="text-[11px] text-[#7d8592] truncate">Attempted</span>
                </Link>
              </div>

              {/* Right Column: Spline Curve */}
              <div className="col-span-7 relative h-28 flex flex-col justify-end">
                {/* Floating Lime Tag on Peak Day */}
                {peakDayCount > 0 && (
                  <div className="absolute top-1 left-[40%] z-20 flex flex-col items-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#c8f237] text-[10px] font-bold text-[#111318] shadow-sm whitespace-nowrap">
                      {peakDayCount} Leads
                    </span>
                    <div className="w-1.5 h-1.5 bg-[#c8f237] rotate-45 -mt-0.5" />
                  </div>
                )}

                <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#181b20" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#181b20" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path 
                    d="M 10 70 C 30 70, 45 65, 60 52 C 75 38, 90 20, 105 25 C 120 30, 135 60, 150 45 C 165 30, 180 50, 195 40 L 195 75 L 10 75 Z"
                    fill="url(#spendGrad)"
                  />

                  {/* Bezier spline curve */}
                  <path 
                    d="M 10 70 C 30 70, 45 65, 60 52 C 75 38, 90 20, 105 25 C 120 30, 135 60, 150 45 C 165 30, 180 50, 195 40"
                    fill="none"
                    stroke="#181b20"
                    strokeWidth="2"
                  />

                  {/* Indicator Point on Peak */}
                  <circle cx="100" cy="23" r="3.5" fill="#181b20" />
                  <circle cx="100" cy="23" r="7" stroke="#181b20" strokeWidth="1.2" fill="none" opacity="0.4" />
                </svg>

                {/* Days Axis */}
                <div className="flex items-center justify-between text-[10px] font-medium text-[#7d8592] pt-1 px-1">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 5: BOTTOM RIGHT (Lead Status Breakdown - Real Lead Percentages)   */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-[32px] border border-black/[0.04] shadow-[0_12px_36px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#111318] tracking-tight">
                Lead Distribution
              </span>
              <Link 
                href="/leads"
                className="w-8 h-8 rounded-full bg-white shadow-xs border border-black/[0.06] flex items-center justify-center text-[#7d8592] hover:text-[#111318] active:scale-95 transition-all"
                title="View All Leads"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stat Row */}
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="text-xs text-[#7d8592] font-medium">Total pipeline volume</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-[#111318]">
                  {totalLeadsCount} Leads
                </span>
                <span className="text-xs text-[#7d8592] font-medium">
                  {hasWrittenDealValue ? formatCurrency(totalEstimatedDealValue) : "No deal values set"}
                </span>
              </div>
            </div>

            {/* Segmented Real Progress Bars from Leads */}
            <div className="flex flex-col gap-3.5 pt-3">
              {/* Contacted Row */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#111318]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#181b20]" />
                    Contacted Leads ({contactedCount})
                  </span>
                  <span>{contactedPct}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-[#f1f4f9] p-0.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#181b20] transition-all duration-500 ease-out"
                    style={{ width: `${contactedPct}%` }}
                  />
                </div>
              </div>

              {/* Attempted Contact Row */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#111318]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#c8f237]" />
                    Attempted Contact ({attemptedCount})
                  </span>
                  <span>{attemptedPct}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-[#f1f4f9] p-0.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#c8f237] transition-all duration-500 ease-out"
                    style={{ width: `${attemptedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
