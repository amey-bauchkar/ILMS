"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Briefcase,
  FileSpreadsheet,
  CheckSquare,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EnrichedLead } from "@/hooks/use-data";

// -------------------------------------------------------------
// Data Types
// -------------------------------------------------------------

export interface DailyActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  activity: string;
  hours: number;
  status: "Completed" | "In Progress" | "In Review" | "Blocker";
  loggedBy: string;
  nextStep?: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
  weight: number; // percentage weight
}

export interface ProjectTrackerData {
  leadId: string;
  projectName: string;
  status: "Planning" | "In Progress" | "On Track" | "At Risk" | "Completed";
  progressPercent: number; // 0 - 100
  kickoffDate: string;
  targetDeliveryDate: string;
  projectManager: string;
  budget?: number;
  notes: string;
  milestones: ProjectMilestone[];
  dailyLogs: DailyActivityLog[];
  lastUpdated: string;
}

// -------------------------------------------------------------
// Localhost Storage Helper
// -------------------------------------------------------------

const STORAGE_PREFIX = "foremark_project_tracker_";

function getDefaultTrackerData(lead: EnrichedLead): ProjectTrackerData {
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const manager = lead.owner?.name && lead.owner.name !== "Unassigned" 
    ? lead.owner.name 
    : "Project Manager";

  // Project update milestones & deliverables
  const defaultMilestones: ProjectMilestone[] = [
    {
      id: "m-1",
      title: "1. Project Kickoff & Client Onboarding Sign-Off",
      targetDate: yesterdayStr,
      completed: true,
      completedAt: yesterdayStr,
      weight: 20
    },
    {
      id: "m-2",
      title: "2. Work Scope & Deliverables Checklist Finalized",
      targetDate: today,
      completed: true,
      completedAt: today,
      weight: 20
    },
    {
      id: "m-3",
      title: "3. Phase 1: Core Project Deliverables & Execution",
      targetDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      completed: false,
      weight: 20
    },
    {
      id: "m-4",
      title: "4. Phase 2: Client Review, Feedback & Progress Revisions",
      targetDate: new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10),
      completed: false,
      weight: 20
    },
    {
      id: "m-5",
      title: "5. Final Project Delivery & Sign-Off",
      targetDate: targetDateStr,
      completed: false,
      weight: 20
    }
  ];

  // Daily project updates
  const defaultLogs: DailyActivityLog[] = [
    {
      id: "log-1",
      date: yesterdayStr,
      activity: "Deal marked Won! Project initiated. Client onboarding and initial project scope finalized.",
      hours: 2.5,
      status: "Completed",
      loggedBy: manager,
      nextStep: "Schedule project execution kickoff with team",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "log-2",
      date: today,
      activity: "Phase 1 project execution in progress. Daily task checklist reviewed with client stakeholders.",
      hours: 4.0,
      status: "Completed",
      loggedBy: manager,
      nextStep: "Prepare initial deliverables for review",
      createdAt: new Date().toISOString()
    }
  ];

  return {
    leadId: lead.id,
    projectName: lead.company ? `${lead.company} Project Update` : `${lead.name} Project Update`,
    status: "On Track",
    progressPercent: 40, // 2 out of 5 milestones done
    kickoffDate: yesterdayStr,
    targetDeliveryDate: targetDateStr,
    projectManager: manager,
    budget: lead.dealValue || 50000,
    notes: "Active project delivery tracker running on localhost storage.",
    milestones: defaultMilestones,
    dailyLogs: defaultLogs,
    lastUpdated: new Date().toISOString()
  };
}

export function loadTracker(lead: EnrichedLead): ProjectTrackerData {
  if (typeof window === "undefined") {
    return getDefaultTrackerData(lead);
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${lead.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.leadId === lead.id) {
        if (!Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
          parsed.milestones = getDefaultTrackerData(lead).milestones;
        }
        if (!Array.isArray(parsed.dailyLogs)) {
          parsed.dailyLogs = [];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load local project tracker data:", e);
  }
  const defaultData = getDefaultTrackerData(lead);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${lead.id}`, JSON.stringify(defaultData));
  } catch {}
  return defaultData;
}

export function saveTracker(data: ProjectTrackerData): void {
  if (typeof window === "undefined") return;
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(`${STORAGE_PREFIX}${data.leadId}`, JSON.stringify(data));
    // Dispatch asynchronously to prevent cross-component setState during render warnings
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("foremark_tracker_saved", { detail: data }));
    }, 0);
  } catch (e) {
    console.error("Failed to save local project tracker data:", e);
  }
}

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------

interface WonProjectTrackerProps {
  lead: EnrichedLead;
  className?: string;
}

export function WonProjectTracker({ lead, className }: WonProjectTrackerProps) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ProjectTrackerData>(() => loadTracker(lead));
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // New Daily Log Form State
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newActivity, setNewActivity] = useState("");
  const [newHours, setNewHours] = useState("3.5");
  const [newStatus, setNewStatus] = useState<DailyActivityLog["status"]>("Completed");
  const [newLoggedBy, setNewLoggedBy] = useState(data.projectManager || "Admin");
  const [newNextStep, setNewNextStep] = useState("");

  // New Milestone Form State
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  // Re-read storage on client mount or if lead id changes
  useEffect(() => {
    setMounted(true);
    setData(loadTracker(lead));
  }, [lead.id]);

  // Persist helper
  const updateData = (updater: (prev: ProjectTrackerData) => ProjectTrackerData) => {
    setData((prev) => {
      const updated = updater(prev);
      queueMicrotask(() => {
        saveTracker(updated);
      });
      return updated;
    });
  };

  // 1. Progress Management: Adjust percent directly
  const handleProgressChange = (newPct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newPct)));
    updateData((prev) => ({
      ...prev,
      progressPercent: clamped,
      status: clamped === 100 ? "Completed" : prev.status === "Completed" ? "On Track" : prev.status
    }));
    toast.success(`Work completed updated to ${clamped}%`);
  };

  // 2. Toggle Milestone completion & automatically sync progress
  const handleToggleMilestone = (milestoneId: string) => {
    updateData((prev) => {
      const newMilestones = prev.milestones.map((m) => {
        if (m.id === milestoneId) {
          const nextCompleted = !m.completed;
          return {
            ...m,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString().slice(0, 10) : undefined
          };
        }
        return m;
      });

      // Recalculate progress based on milestone weights
      const totalWeight = newMilestones.reduce((acc, m) => acc + (m.weight || 0), 0);
      const completedWeight = newMilestones.reduce((acc, m) => acc + (m.completed ? m.weight || 0 : 0), 0);
      const calculatedPct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : prev.progressPercent;

      return {
        ...prev,
        milestones: newMilestones,
        progressPercent: calculatedPct,
        status: calculatedPct === 100 ? "Completed" : prev.status === "Completed" ? "On Track" : prev.status
      };
    });
  };

  // 3. Add Milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) {
      toast.error("Please enter milestone title");
      return;
    }
    const newM: ProjectMilestone = {
      id: `m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      targetDate: newMilestoneDate,
      completed: false,
      weight: 20
    };
    updateData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, newM]
    }));
    setNewMilestoneTitle("");
    setShowAddMilestone(false);
    toast.success("New project update milestone added!");
  };

  // 4. Add Daily Activity Log
  const handleAddDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) {
      toast.error("Please enter activity details");
      return;
    }
    const log: DailyActivityLog = {
      id: `log-${Date.now()}`,
      date: newDate,
      activity: newActivity.trim(),
      hours: parseFloat(newHours) || 0,
      status: newStatus,
      loggedBy: newLoggedBy.trim() || data.projectManager || "Project Lead",
      nextStep: newNextStep.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    updateData((prev) => ({
      ...prev,
      dailyLogs: [log, ...prev.dailyLogs]
    }));

    setNewActivity("");
    setNewNextStep("");
    setShowAddLog(false);
    toast.success("Daily project activity logged!");
  };

  // 5. Delete Daily Log
  const handleDeleteLog = (logId: string) => {
    updateData((prev) => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter((l) => l.id !== logId)
    }));
    toast.success("Log entry removed");
  };

  // 6. Export Tracker to CSV (just like a tracker sheet)
  const handleExportCSV = () => {
    const headers = ["Date", "Project Update / Work Done", "Hours Logged", "Status", "Logged By", "Next Action / Deliverable"];
    const rows = data.dailyLogs.map((l) => [
      `"${l.date}"`,
      `"${l.activity.replace(/"/g, '""')}"`,
      `"${l.hours}"`,
      `"${l.status}"`,
      `"${l.loggedBy}"`,
      `"${(l.nextStep || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(lead.company || lead.name).toLowerCase().replace(/\s+/g, "-")}-project-activity-sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Project tracker sheet exported as CSV!");
  };

  // Computed summary metrics
  const totalHours = useMemo(() => {
    return data.dailyLogs.reduce((acc, l) => acc + (l.hours || 0), 0);
  }, [data.dailyLogs]);

  const completedMilestones = useMemo(() => {
    return data.milestones.filter((m) => m.completed).length;
  }, [data.milestones]);

  const healthColor = {
    "On Track": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    "In Progress": "bg-[#c8f237]/25 text-[#111318] dark:text-white border-black/15 dark:border-white/20",
    "Planning": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
    "At Risk": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    "Completed": "bg-emerald-600 text-white border-emerald-700"
  }[data.status] || "bg-zinc-100 text-zinc-700";

  return (
    <div className={cn("space-y-5 select-none animate-in fade-in duration-200", className)} data-testid="won-project-tracker">
      
      {/* ------------------------------------------------------- */}
      {/* 1. Main Project Card Header with Live Status & Delivery */}
      {/* ------------------------------------------------------- */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#121319] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        
        {/* Top Badges & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/10 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8f237] border border-black/10 text-[#111318] flex items-center justify-center shrink-0 shadow-xs font-black">
              <Trophy className="w-5 h-5 text-[#111318]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 suppressHydrationWarning className="text-base sm:text-lg font-extrabold text-[#111318] dark:text-white tracking-tight">
                  {data.projectName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c8f237] text-[#111318] shadow-xs">
                  Won Deal Active
                </span>
                
                {/* Status Switcher Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={data.status}
                    onChange={(e) => {
                      const next = e.target.value as ProjectTrackerData["status"];
                      updateData((prev) => ({ ...prev, status: next }));
                      toast.success(`Project status updated to ${next}`);
                    }}
                    className={cn(
                      "appearance-none text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 pr-5 border cursor-pointer focus:outline-none transition-all shadow-2xs",
                      healthColor
                    )}
                  >
                    <option value="On Track">On Track</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planning">Planning</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Client: <strong>{lead.name}</strong></span>
                {lead.company && <span>• Organization: <strong>{lead.company}</strong></span>}
                <span>• Lead Manager: <strong>{data.projectManager}</strong></span>
                <span>• Kickoff: <strong>{data.kickoffDate}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#f8fafc] dark:bg-white/[0.05] text-xs font-semibold text-[#111318] dark:text-white hover:bg-black/[0.04] transition-all shadow-2xs active:scale-95"
              title="Download Tracker Sheet as CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Export Sheet</span>
            </button>
            <div className="px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/10 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
              💾 Localhost Synced
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- */}
        {/* 2. "How Much the Work is Done" — Completion Progress */}
        {/* ----------------------------------------------------- */}
        <div className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#15803d] dark:text-[#c8f237]" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Work Completed Progress
                </span>
                <span className="text-2xl font-black text-[#111318] dark:text-white tracking-tight ml-1">
                  {data.progressPercent}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {completedMilestones} of {data.milestones.length} major deliverables checked • {totalHours} total hours logged
              </p>
            </div>

            {/* Quick Adjust Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">Quick Set:</span>
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleProgressChange(pct)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95",
                    data.progressPercent === pct
                      ? "bg-[#111318] dark:bg-white text-white dark:text-[#111318]"
                      : "bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-black/30"
                  )}
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleProgressChange(data.progressPercent - 5)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 active:scale-95"
                title="Decrease 5%"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => handleProgressChange(data.progressPercent + 5)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 active:scale-95"
                title="Increase 5%"
              >
                +5%
              </button>
            </div>
          </div>

          {/* Interactive Visual Progress Bar */}
          <div className="relative w-full h-3.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-black/[0.06] dark:border-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out shadow-xs flex items-center justify-end pr-1.5"
              style={{
                width: `${data.progressPercent}%`,
                background: data.progressPercent === 100 
                  ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" 
                  : "linear-gradient(90deg, #c8f237 0%, #10b981 100%)"
              }}
            >
              {data.progressPercent >= 15 && (
                <span className="text-[9px] font-black text-[#111318]">
                  {data.progressPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- */}
        {/* 3. Deliverables & Milestones Checklist                 */}
        {/* ----------------------------------------------------- */}
        <div className="pt-5 border-t border-black/[0.06] dark:border-white/10 mt-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#15803d] dark:text-[#c8f237]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-white">
                Project Milestones & Deliverables Roadmap
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMilestone(!showAddMilestone)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d] dark:text-[#c8f237] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddMilestone ? "Close" : "Add Milestone"}</span>
            </button>
          </div>

          {/* Add Milestone Inline Form */}
          {showAddMilestone && (
            <form onSubmit={handleAddMilestone} className="p-3 mb-3 rounded-xl bg-[#f8fafc] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/10 flex flex-col sm:flex-row gap-2.5 items-end animate-in fade-in duration-150">
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Milestone Title</label>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="e.g. Scope Sign-off, Core Deliverables, Client Handover"
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-3 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none focus:border-[#111318]"
                />
              </div>
              <div className="w-full sm:w-44 space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Target Date</label>
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-3 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>
              <Button type="submit" size="sm" className="bg-[#111318] text-white hover:bg-black font-bold text-xs h-8 rounded-lg px-4 shrink-0">
                Save Milestone
              </Button>
            </form>
          )}

          {/* Milestones List */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {data.milestones.map((m, idx) => {
              return (
                <div
                  key={m.id}
                  onClick={() => handleToggleMilestone(m.id)}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none group",
                    m.completed
                      ? "bg-emerald-500/[0.04] border-emerald-500/25 hover:border-emerald-500/40"
                      : "bg-[#f8fafc]/70 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/25"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {m.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-xs font-semibold leading-tight transition-colors",
                      m.completed 
                        ? "text-[#111318] dark:text-white line-through opacity-85" 
                        : "text-[#111318] dark:text-zinc-200"
                    )}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {m.targetDate}
                      </span>
                      <span>•</span>
                      <span className={m.completed ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-zinc-500"}>
                        {m.completed ? "Done" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- */}
      {/* 4. Daily Activity Tracker Sheet ("Tracker Sheet")       */}
      {/* ------------------------------------------------------- */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#121319] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        
        {/* Table Controls & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c8f237]/20 border border-black/10 flex items-center justify-center text-[#111318] dark:text-[#c8f237] shrink-0 font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#111318] dark:text-white uppercase tracking-wider">
                  Daily Project Activity Tracker Sheet
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#111318] dark:text-white">
                  {data.dailyLogs.length} Entries
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Log and monitor day-to-day deliverables, effort, and blockers
              </p>
            </div>
          </div>

          {/* "+ Log Daily Activity" CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => setShowAddLog(!showAddLog)}
              className="bg-[#c8f237] hover:bg-[#b5e028] text-[#111318] font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddLog ? "Cancel Entry" : "Log Daily Activity"}</span>
            </Button>
          </div>
        </div>

        {/* Add Daily Log Inline Form */}
        {showAddLog && (
          <form
            onSubmit={handleAddDailyLog}
            className="p-4 my-4 rounded-xl bg-[#f8fafc] dark:bg-white/[0.03] border border-black/[0.1] dark:border-white/15 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/10 pb-2">
              <span className="text-xs font-bold uppercase text-[#111318] dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#15803d] dark:text-[#c8f237]" />
                Log Daily Project Activity
              </span>
              <span className="text-[10px] text-zinc-400">Saved to localhost session</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Hours Logged</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                  placeholder="e.g. 4.0"
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DailyActivityLog["status"])}
                  className="w-full bg-white dark:bg-zinc-800 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Blocker">Blocker</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Logged By</label>
                <input
                  type="text"
                  value={newLoggedBy}
                  onChange={(e) => setNewLoggedBy(e.target.value)}
                  placeholder="e.g. Manish"
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Work Done / Daily Activity Description</label>
              <textarea
                rows={2}
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Describe today's deliverables, tasks done, or client communication..."
                required
                className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg p-2.5 text-xs text-[#111318] dark:text-white focus:outline-none focus:border-[#111318]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Next Step / Blocker (Optional)</label>
              <input
                type="text"
                value={newNextStep}
                onChange={(e) => setNewNextStep(e.target.value)}
                placeholder="e.g. Schedule technical discovery session, follow up with client"
                className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddLog(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#111318] text-white hover:bg-black font-bold text-xs h-8 px-4"
              >
                Save Daily Activity
              </Button>
            </div>
          </form>
        )}

        {/* Spreadsheet Table */}
        <div className="rounded-xl border border-black/[0.08] dark:border-white/10 overflow-hidden bg-white dark:bg-[#121319] mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/10 text-zinc-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5 w-28">Date</th>
                <th className="py-2.5 px-3.5">Work Done / Daily Activity</th>
                <th className="py-2.5 px-3.5 w-20 text-center">Hours</th>
                <th className="py-2.5 px-3.5 w-28 text-center">Status</th>
                <th className="py-2.5 px-3.5 w-28">Logged By</th>
                <th className="py-2.5 px-3.5">Next Step</th>
                <th className="py-2.5 px-3.5 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {data.dailyLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FileSpreadsheet className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-xs font-semibold">No daily activity logged yet.</p>
                      <p className="text-[11px] text-zinc-400">Click &ldquo;+ Log Daily Activity&rdquo; above to record your first daily entry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.dailyLogs.map((log) => {
                  const statusBadge = {
                    Completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
                    "In Progress": "bg-[#c8f237]/25 text-[#111318] dark:text-[#c8f237] border-black/10 dark:border-white/20",
                    "In Review": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
                    Blocker: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25"
                  }[log.status] || "bg-zinc-100 text-zinc-700";

                  return (
                    <tr key={log.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                          {log.date}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#111318] dark:text-zinc-200 font-medium">
                        {log.activity}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {log.hours ? `${log.hours}h` : "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block", statusBadge)}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          {log.loggedBy}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        {log.nextStep || "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 transition-all p-1"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-3">
          <span>⚡ All entries & progress % are updated and stored locally on your localhost session.</span>
          <span suppressHydrationWarning>
            {mounted && data?.lastUpdated ? `Last modified: ${new Date(data.lastUpdated).toLocaleTimeString()}` : "⚡ Localhost Storage Active"}
          </span>
        </div>
      </div>

    </div>
  );
}
