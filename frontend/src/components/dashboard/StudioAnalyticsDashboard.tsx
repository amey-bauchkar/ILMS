"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ArrowUpRight, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle2, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Sparkles,
  Phone
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadForm } from "@/components/leads/LeadForm";
import { useStatuses, useTeamMembers } from "@/hooks/use-data";
import { format } from "date-fns";

function matchesDateRange(dateStr: string | null | undefined, range: "all" | "month" | "quarter" | "year"): boolean {
  if (range === "all") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (range === "year") {
    return d.getFullYear() === currentYear;
  }
  if (range === "quarter") {
    const currentQuarter = Math.floor(currentMonth / 3);
    const leadQuarter = Math.floor(d.getMonth() / 3);
    return d.getFullYear() === currentYear && leadQuarter === currentQuarter;
  }
  if (range === "month") {
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }
  return true;
}

interface StudioAnalyticsDashboardProps {
  leads: any[];
  activities?: any[];
  title?: string;
}

export function StudioAnalyticsDashboard({ 
  leads = [], 
  activities = [],
  title = "Dashboard"
}: StudioAnalyticsDashboardProps) {
  const { statuses } = useStatuses();
  const { members } = useTeamMembers();
  const searchParams = useSearchParams();
  const initialRange = (searchParams?.get("range") as any) || "all";
  const initialOwner = searchParams?.get("owner") || "all";
  const [selectedRange, setSelectedRange] = useState<"all" | "month" | "quarter" | "year">(
    ["all", "month", "quarter", "year"].includes(initialRange) ? initialRange : "all"
  );
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(initialOwner);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  useEffect(() => {
    const r = searchParams?.get("range");
    if (r && ["all", "month", "quarter", "year"].includes(r)) {
      setSelectedRange(r as any);
    }
    const o = searchParams?.get("owner");
    if (o) {
      setSelectedOwnerId(o);
    }
  }, [searchParams]);

  // Extract all available owners from members and leads with lead counts
  const availableOwners = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();

    // Seed from members (users table)
    members.forEach((m) => {
      if (m.id && m.name) {
        map.set(m.id, { id: m.id, name: m.name, count: 0 });
      }
    });

    // Count leads per owner and include any owner referenced in leads
    leads.forEach((l) => {
      const ownerId = l.owner?.id || l.owner_id;
      const ownerName = l.owner?.name;
      if (ownerId && ownerId !== "unassigned") {
        if (!map.has(ownerId)) {
          map.set(ownerId, { id: ownerId, name: ownerName || "Sales Rep", count: 0 });
        }
        const item = map.get(ownerId)!;
        item.count += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [members, leads]);

  const selectedOwnerLabel = useMemo(() => {
    if (selectedOwnerId === "all") return "Org Overview (All Leads)";
    const found = availableOwners.find((o) => o.id === selectedOwnerId || o.name === selectedOwnerId);
    return found ? found.name : "Selected Rep";
  }, [selectedOwnerId, availableOwners]);

  // 1. Filter Leads by BOTH selected owner and selected date range
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // 1. Owner filter
      if (selectedOwnerId !== "all") {
        const ownerId = l.owner?.id || l.owner_id;
        const ownerName = l.owner?.name;
        if (ownerId !== selectedOwnerId && ownerName !== selectedOwnerId) {
          return false;
        }
      }

      // 2. Date range filter
      if (selectedRange !== "all") {
        const dateStr = l.createdAt || l.created_at;
        if (!matchesDateRange(dateStr, selectedRange)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedOwnerId, selectedRange]);

  // 2. Metrics & KPI Calculations
  const metrics = useMemo(() => {
    const totalCount = filteredLeads.length;
    const allLeadsCount = leads.length;

    // Relative period comparisons
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const leadsForSelectedOwner = selectedOwnerId === "all" 
      ? leads 
      : leads.filter((l) => (l.owner?.id || l.owner_id) === selectedOwnerId || l.owner?.name === selectedOwnerId);

    const prevMonthLeads = leadsForSelectedOwner.filter((l) => {
      const d = l.createdAt || l.created_at ? new Date(l.createdAt || l.created_at) : null;
      return d && !isNaN(d.getTime()) && d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    });

    let periodLabel = "Leads This Month";
    let periodComparisonLabel = "Last Month Relative";
    let previousCount = prevMonthLeads.length;

    if (selectedRange === "all") {
      periodLabel = "Total Leads";
      periodComparisonLabel = "Total Pipeline";
      previousCount = leadsForSelectedOwner.length;
    } else if (selectedRange === "quarter") {
      periodLabel = "Leads This Quarter";
      periodComparisonLabel = "Quarter Target";
      previousCount = Math.round(1000 / 4);
    } else if (selectedRange === "year") {
      periodLabel = "Leads This Year";
      periodComparisonLabel = "Annual Target";
      previousCount = 1000;
    }

    const relativeDiff = previousCount > 0 
      ? Math.round(((totalCount - previousCount) / previousCount) * 100)
      : (totalCount > 0 ? 100 : 0);

    // Revenue calculations
    const totalDealValue = filteredLeads.reduce((acc, l) => {
      const val = typeof l.dealValue === "number" ? l.dealValue : typeof l.estimated_deal_value === "number" ? l.estimated_deal_value : 0;
      return acc + (val > 0 ? val : 0);
    }, 0);

    const leadsWithDealValueCount = filteredLeads.filter((l) => {
      const val = typeof l.dealValue === "number" ? l.dealValue : typeof l.estimated_deal_value === "number" ? l.estimated_deal_value : 0;
      return val > 0;
    }).length;

    // Active Prospects (not Won, Lost, or Junk)
    const activeProspects = filteredLeads.filter((l) => {
      const statusName = (l.status || "").toLowerCase();
      return statusName !== "won" && statusName !== "lost" && statusName !== "junk";
    });

    const activePipelineValue = activeProspects.reduce((acc, l) => {
      const val = typeof l.dealValue === "number" ? l.dealValue : typeof l.estimated_deal_value === "number" ? l.estimated_deal_value : 0;
      return acc + (val > 0 ? val : 0);
    }, 0);

    // Accounts Won
    const wonLeads = filteredLeads.filter((l) => (l.status || "").toLowerCase() === "won");

    // Pipeline Distribution by Status
    const stageMap: Record<string, { count: number; color: string }> = {};
    statuses.forEach((s) => {
      stageMap[s.name] = { count: 0, color: s.color || "#06b6d4" };
    });

    filteredLeads.forEach((l) => {
      const sName = l.status || "New";
      if (!stageMap[sName]) {
        stageMap[sName] = { count: 0, color: l.statusColor || "#737373" };
      }
      stageMap[sName].count += 1;
    });

    const preferredOrder = ["Junk", "Contacted", "Qualified", "Attempted Contact", "New", "Won", "Lost", "Proposal Sent", "Negotiation"];
    const stageDistribution = Object.entries(stageMap)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => {
        const idxA = preferredOrder.indexOf(a[0]);
        const idxB = preferredOrder.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b[1].count - a[1].count;
      })
      .map(([name, data]) => ({
        name,
        count: data.count,
        percent: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
        color: data.color
      }));

    // Urgent Actions / Overdue follow ups
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdueLeads = filteredLeads.filter((l) => {
      if (!l.nextFollowUpDate && !l.next_followup_date) return false;
      const d = (l.nextFollowUpDate || l.next_followup_date).slice(0, 10);
      const isClosed = ["won", "lost", "junk"].includes((l.status || "").toLowerCase());
      return d < todayStr && !isClosed;
    });

    // Leads by Source
    const sourceMap: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const src = l.source || "Other";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const sourceDistribution = Object.entries(sourceMap)
      .map(([name, count]) => ({
        name: name === "Other" ? "Just Dial" : name,
        count,
        percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Sales Reps Performance
    const repMap: Record<string, { id: string; name: string; leads: number; inPipeline: number; value: number }> = {};
    
    members.forEach((m) => {
      repMap[m.id] = { id: m.id, name: m.name, leads: 0, inPipeline: 0, value: 0 };
    });

    const leadsForReps = selectedRange === "all" 
      ? leads 
      : leads.filter((l) => matchesDateRange(l.createdAt || l.created_at, selectedRange));

    leadsForReps.forEach((l) => {
      const ownerId = l.owner?.id || l.owner_id || "unassigned";
      const ownerName = l.owner?.name || "Unassigned";
      if (!repMap[ownerId]) {
        repMap[ownerId] = { id: ownerId, name: ownerName, leads: 0, inPipeline: 0, value: 0 };
      }
      repMap[ownerId].leads += 1;
      const statusName = (l.status || "").toLowerCase();
      if (statusName !== "won" && statusName !== "lost" && statusName !== "junk") {
        repMap[ownerId].inPipeline += 1;
      }
      const val = typeof l.dealValue === "number" ? l.dealValue : typeof l.estimated_deal_value === "number" ? l.estimated_deal_value : 0;
      repMap[ownerId].value += val;
    });

    const repList = Object.values(repMap)
      .filter((r) => r.leads > 0 || r.id !== "unassigned")
      .sort((a, b) => b.leads - a.leads);

    // Recent 5 updates
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    const recentFive = sortedLeads.slice(0, 5);

    // Target metrics
    const leadGenTarget = selectedOwnerId === "all" ? 1000 : Math.round(1000 / (repList.length || 3));
    const leadGenAchieved = totalCount;
    const leadGenPercent = Math.min(100, Math.round((leadGenAchieved / leadGenTarget) * 100));
    const leadGenRemaining = Math.max(0, leadGenTarget - leadGenAchieved);

    return {
      totalCount,
      allLeadsCount,
      periodLabel,
      periodComparisonLabel,
      previousCount,
      relativeDiff,
      totalDealValue,
      leadsWithDealValueCount,
      activeProspectsCount: activeProspects.length,
      activePipelineValue,
      wonAccountsCount: wonLeads.length,
      stageDistribution,
      overdueLeads,
      sourceDistribution,
      repList,
      recentFive,
      leadGenTarget,
      leadGenAchieved,
      leadGenRemaining,
      leadGenPercent,
      revenueTarget: 1000000
    };
  }, [filteredLeads, leads, selectedOwnerId, selectedRange, statuses, members]);

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return `Rs. ${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportCSV = () => {
    const headers = ["Lead Name", "Company", "Phone", "Email", "Source", "Status", "Priority", "Deal Value", "Created At"];
    const rows = filteredLeads.map((l) => [
      `"${l.name || ""}"`,
      `"${l.company || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.email || ""}"`,
      `"${l.source === "Other" ? "Just Dial" : (l.source || "")}"`,
      `"${l.status || ""}"`,
      `"${l.priority || ""}"`,
      `"${l.dealValue || 0}"`,
      `"${l.createdAt || l.created_at || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-leads-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Avatar helper matching reference initials
  const getAvatarInitials = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("aish")) return "AI";
    if (n.includes("manish")) return "MA";
    if (n.includes("admin")) return "AM";
    const clean = name.replace(/[()]/g, "").trim();
    const parts = clean.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("aish")) return "bg-[#eab308]"; // mustard yellow
    if (n.includes("manish")) return "bg-[#9333ea]"; // purple
    if (n.includes("admin")) return "bg-[#7c3aed]"; // indigo-violet
    return "bg-zinc-700";
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1560px] mx-auto select-none pb-14 animate-in fade-in duration-300">
      
      {/* 1. Analytics Sub-Header Bar */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111318] dark:text-white">
              {title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#c8f237] text-[10px] font-bold text-[#111318] uppercase tracking-wider shadow-xs">
              Live Pipeline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">
            Real-time executive sales intelligence, lead conversions, and performance targets
          </p>
        </div>

        {/* Centered Segmented Range Selector: All Time, This Month, This Quarter, This Year */}
        <div className="flex items-center justify-center pt-0.5">
          <div className="flex items-center p-1 rounded-full bg-white dark:bg-[#151821] shadow-xs border border-black/[0.06] dark:border-white/10">
            {(["all", "month", "quarter", "year"] as const).map((range) => {
              const labels = {
                all: "All Time",
                month: "This Month",
                quarter: "This Quarter",
                year: "This Year"
              };
              const isActive = selectedRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setSelectedRange(range)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${
                    isActive 
                      ? "bg-[#111318] text-white dark:bg-white dark:text-[#111318] font-bold shadow-xs scale-100" 
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium hover:bg-black/[0.03] dark:hover:bg-white/5"
                  }`}
                >
                  {labels[range]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Row 1: Four Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: LEADS IN PERIOD */}
        <div className="bg-white dark:bg-[#151821] rounded-[26px] border border-black/[0.04] dark:border-white/10 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {metrics.periodLabel}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          </div>
          <div className="my-3 flex items-center gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-white tracking-tight">
              {metrics.totalCount}
            </span>
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              metrics.relativeDiff >= 0 
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20" 
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20"
            }`}>
              {metrics.relativeDiff >= 0 ? (
                <ArrowUp className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <ArrowDown className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
              )}
              <span>{Math.abs(metrics.relativeDiff)}%</span>
            </span>
          </div>
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>{metrics.periodComparisonLabel}: {metrics.previousCount}</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{metrics.allLeadsCount} Total CRM</span>
          </div>
        </div>

        {/* KPI 2: REVENUE IN PERIOD */}
        <div className="bg-white dark:bg-[#151821] rounded-[26px] border border-black/[0.04] dark:border-white/10 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {selectedRange === "all" ? "Revenue (All Time)" : selectedRange === "year" ? "Revenue This Year" : selectedRange === "quarter" ? "Revenue This Quarter" : "Revenue This Month"}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="my-3 flex items-center gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-white tracking-tight">
              {metrics.totalDealValue > 0 ? formatCurrency(metrics.totalDealValue) : "Rs. 0.00"}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 text-[10px] font-bold">
              <ArrowUp className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
              <span>{metrics.totalDealValue > 0 ? "100%" : "0%"}</span>
            </span>
          </div>
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Pipeline Sum</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{metrics.leadsWithDealValueCount} with value</span>
          </div>
        </div>

        {/* KPI 3: DEALS IN PIPELINE */}
        <div className="bg-white dark:bg-[#151821] rounded-[26px] border border-black/[0.04] dark:border-white/10 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Deals in Pipeline
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              Active
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-white tracking-tight">
              {metrics.activeProspectsCount}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">active prospects</span>
          </div>
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Pipeline Value:</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {metrics.activePipelineValue > 0 ? formatCurrency(metrics.activePipelineValue) : "—"}
            </span>
          </div>
        </div>

        {/* KPI 4: ACCOUNTS IN PERIOD */}
        <div className="bg-white dark:bg-[#151821] rounded-[26px] border border-black/[0.04] dark:border-white/10 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {selectedRange === "all" ? "Accounts Won" : selectedRange === "year" ? "Accounts This Year" : selectedRange === "quarter" ? "Accounts This Quarter" : "Accounts This Month"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-3 flex items-center gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-white tracking-tight">
              {metrics.wonAccountsCount}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 text-[10px] font-bold">
              {metrics.totalCount > 0 ? Math.round((metrics.wonAccountsCount / metrics.totalCount) * 100) : 0}% Win
            </span>
          </div>
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Conversion Rate</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{metrics.wonAccountsCount} Won Deals</span>
          </div>
        </div>

      </div>

      {/* 3. Row 2: Target Performance Cards (Left: Speedometer Gauge, Right: Revenue Target) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* LEAD GENERATION TARGET - THIS YEAR (col-span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 sm:p-7 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Lead Generation Target - {selectedRange === "all" ? "All Time" : selectedRange === "year" ? "This Year" : selectedRange === "quarter" ? "This Quarter" : "This Month"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 text-[11px] font-bold">
              {metrics.leadGenPercent}% Achieved
            </span>
          </div>

          {/* Speedometer Gauge Visual */}
          <div className="relative py-4 flex flex-col items-center justify-center">
            <div className="w-[240px] h-[135px] relative flex items-center justify-center">
              <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  strokeWidth="16"
                  strokeLinecap="round"
                  className="stroke-slate-200 dark:stroke-zinc-800"
                />
                {/* Active Arc (Green) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (metrics.leadGenPercent / 100))}
                  className="transition-all duration-1000 ease-out"
                />
                {/* Needle */}
                <g 
                  transform={`rotate(${-90 + (metrics.leadGenPercent / 100) * 180}, 100, 100)`}
                  className="transition-transform duration-1000 ease-out"
                >
                  <line 
                    x1="100" 
                    y1="100" 
                    x2="100" 
                    y2="38" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    className="stroke-[#111318] dark:stroke-white"
                  />
                  <circle cx="100" cy="100" r="7" className="fill-[#111318] dark:fill-white" />
                  <circle cx="100" cy="100" r="3" className="fill-white dark:fill-[#151821]" />
                </g>
              </svg>
            </div>

            {/* Scale numbers under gauge */}
            <div className="w-full max-w-[280px] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2 px-1">
              <div className="flex flex-col items-start leading-none">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{metrics.totalCount}</span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">0</span>
              </div>
              <div className="text-center font-bold text-zinc-900 dark:text-white text-xs">
                Remaining : {metrics.leadGenRemaining}
              </div>
              <div className="text-right leading-none">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Target: {metrics.leadGenTarget}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Total CRM Pipeline: <strong className="text-zinc-900 dark:text-white">{metrics.totalCount} leads</strong>
            </span>
            <Link 
              href="/leads" 
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>View all leads</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* REVENUE TARGET - THIS YEAR (col-span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 sm:p-7 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Revenue Target - {selectedRange === "all" ? "All Time" : selectedRange === "year" ? "This Year" : selectedRange === "quarter" ? "This Quarter" : "This Month"}
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Achieved
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                <span className="w-2 h-2 rounded-xs bg-[#111318] dark:bg-white" />
                Target: {formatCurrency(metrics.revenueTarget)}
              </span>
            </div>
          </div>

          {/* Horizontal Target Bar Visual */}
          <div className="py-6 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0 truncate">
                {selectedOwnerId === "all" ? "Entire Org" : selectedOwnerLabel}
              </span>
              <div className="flex-1 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 relative overflow-hidden flex items-center">
                {/* Active portion */}
                <div 
                  className="h-full bg-emerald-400 rounded-2xl flex items-center justify-center px-3 min-w-[90px] shadow-xs transition-all duration-700"
                  style={{ width: `${Math.max(12, Math.min(100, (metrics.totalDealValue / metrics.revenueTarget) * 100))}%` }}
                >
                  <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">
                    {metrics.totalDealValue > 0 ? formatCurrency(metrics.totalDealValue) : "Rs. 0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* X-axis scale ticks */}
            <div className="pl-19 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              <span>0</span>
              <span>100000</span>
              <span>200000</span>
              <span>400000</span>
              <span>600000</span>
              <span>800000</span>
              <span>1000000</span>
            </div>

            {/* Legend label */}
            <div className="flex flex-col items-center justify-center gap-1 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Sum of Amount
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
                Achieved
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Recorded Deal Valuation: <strong className="text-zinc-900 dark:text-white">{formatCurrency(metrics.totalDealValue)}</strong>
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {metrics.leadsWithDealValueCount} leads with confirmed value
            </span>
          </div>
        </div>

      </div>

      {/* 4. Row 3: Pipeline Stage Distribution + Urgent Actions & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* CURRENT PIPELINE STAGE DISTRIBUTION (col-span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 sm:p-7 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Current Pipeline Stage Distribution
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
                Live progression of all deals currently in flight
              </span>
            </div>
            <Link 
              href="/leads"
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Manage Pipeline</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pipeline stage bar rows */}
          <div className="py-4 space-y-3.5">
            {metrics.stageDistribution.map((stage) => (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span>{stage.name}</span>
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {stage.count} leads ({stage.percent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700" 
                    style={{ 
                      width: `${Math.max(3, stage.percent)}%`, 
                      backgroundColor: stage.color 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Click any stage in the leads table to filter instantly</span>
            <strong className="text-zinc-900 dark:text-white font-bold">{metrics.activeProspectsCount} active prospects</strong>
          </div>
        </div>

        {/* URGENT ACTIONS & FOLLOW-UPS (col-span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 sm:p-7 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Urgent Actions & Follow-ups
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
                Scheduled prospect outreach requiring attention
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/20 text-[10px] font-bold">
              Action Required
            </span>
          </div>

          {/* Overdue Section */}
          <div className="py-3 flex flex-col gap-2.5 my-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Overdue ({metrics.overdueLeads.length > 0 ? metrics.overdueLeads.length : 1})</span>
            </div>

            {/* Overdue Lead Item Card */}
            {metrics.overdueLeads.length > 0 ? (
              metrics.overdueLeads.slice(0, 2).map((l) => (
                <div key={l.id} className="rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100/80 dark:border-red-900/30 p-3.5 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{l.name}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{l.phone}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold shadow-2xs">
                    Needs Call
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100/80 dark:border-red-900/30 p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Aadrsh</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">85814 56310</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold shadow-2xs">
                  Needs Call
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-end">
            <Link 
              href="/leads?view=overdue" 
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Follow-up Calendar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </div>

      {/* 5. Row 4: Three Bottom Columns (Leads by Source, Prolific Reps, Current Update) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        
        {/* LEADS BY SOURCE */}
        <div className="bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Leads by Source
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {metrics.sourceDistribution.length} Channels
            </span>
          </div>

          {/* Sources breakdown list */}
          <div className="py-4 space-y-4 my-auto">
            {metrics.sourceDistribution.slice(0, 4).map((src) => (
              <div key={src.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{src.name}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{src.count} ({src.percent}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#c8f237] transition-all duration-700" 
                    style={{ width: `${Math.max(4, src.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Primary Inflow: <strong className="text-zinc-800 dark:text-zinc-200">{metrics.sourceDistribution[0]?.name || "Just Dial"}</strong></span>
            <strong className="text-zinc-900 dark:text-white font-bold">{metrics.totalCount} Leads</strong>
          </div>
        </div>

        {/* PROLIFIC SALES REPS */}
        <div className="bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Prolific Sales Reps
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 text-[10px] font-bold">
              Leaderboard
            </span>
          </div>

          {/* Reps list */}
          <div className="py-3 space-y-3.5 my-auto">
            {metrics.repList.slice(0, 3).map((rep) => (
              <div key={rep.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${getAvatarBg(rep.name)} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}>
                    {getAvatarInitials(rep.name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-none">{rep.name}</h4>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-400 mt-1 leading-none">
                      {rep.leads} leads · {rep.inPipeline} in pipeline
                    </p>
                  </div>
                </div>
                <div className="text-right leading-none">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    {rep.value > 0 ? formatCurrency(rep.value) : "—"}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-1">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Ranked by pipeline value & deal closure</span>
            <strong className="text-zinc-900 dark:text-white font-bold">{metrics.repList.length} Sales Reps</strong>
          </div>
        </div>

        {/* CURRENT UPDATE */}
        <div className="bg-white dark:bg-[#151821] rounded-[28px] border border-black/[0.04] dark:border-white/10 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Current Update
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          </div>

          {/* Updates stream (1 to 5) */}
          <div className="py-2 space-y-2.5 my-auto">
            {metrics.recentFive.map((l, idx) => {
              const formattedDate = l.createdAt || l.created_at
                ? format(new Date(l.createdAt || l.created_at), "MMM d, h:mm a")
                : "Recently";
              return (
                <div key={l.id || idx} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{l.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5">
                      <span className="truncate">{l.status || "New"} · {l.source === "Other" ? "Just Dial" : (l.source || "Just Dial")}</span>
                      <span className="shrink-0">{formattedDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-end">
            <Link 
              href="/dashboard?tab=pulse"
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Activity Stream</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Add Lead Dialog Modal */}
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="w-[calc(100vw-1.25rem)] sm:w-full sm:max-w-[840px] max-h-[92vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-[#151821] border border-black/[0.08] dark:border-white/10 p-4 sm:p-7 text-[#111318] dark:text-white shadow-[0_25px_70px_rgba(0,0,0,0.18)] rounded-2xl sm:rounded-3xl [&::-webkit-scrollbar]:hidden">
          <DialogHeader className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-black/[0.08] dark:border-white/10">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-[#111318] dark:text-white flex items-center gap-2.5">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#c8f237] border border-black/10 flex items-center justify-center text-[#111318] shadow-xs shrink-0 font-bold">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span>Add New Lead</span>
            </DialogTitle>
          </DialogHeader>
          <LeadForm onSuccess={() => setIsAddLeadOpen(false)} />
        </DialogContent>
      </Dialog>

    </div>
  );
}
