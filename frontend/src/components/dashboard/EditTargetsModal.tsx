"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Target, 
  IndianRupee, 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  Check, 
  Users,
  UserCheck,
  Building2,
  Table,
  SlidersHorizontal,
} from "lucide-react";
import { useTargets, DEFAULT_TARGETS, getUserTarget } from "@/lib/targets";
import { useUser } from "@/components/providers/user-provider";
import { useTeamMembers } from "@/hooks/use-data";
import { toast } from "sonner";

interface EditTargetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFocus?: "leads" | "revenue";
  initialSelectedMemberId?: string;
}

export function EditTargetsModal({
  open,
  onOpenChange,
  defaultFocus = "leads",
  initialSelectedMemberId = "all",
}: EditTargetsModalProps) {
  const { user } = useUser();
  const { members } = useTeamMembers();
  const { targets, updateTargets, updateUserTarget, updateBatchUserTargets, resetTargets } = useTargets();

  const isAdmin = user?.role === "admin" || (!user && process.env.NODE_ENV === "development");

  // "all" = Entire Organization; otherwise member.id
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"single" | "table">("single");

  // Inputs for single mode
  const [leadTargetInput, setLeadTargetInput] = useState<string>("");
  const [revenueTargetInput, setRevenueTargetInput] = useState<string>("");

  // Grid state for table mode: keyed by member id
  const [tableGrid, setTableGrid] = useState<Record<string, { lead: string; rev: string }>>({});

  // Active members list (excluding deactivated)
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.is_active !== false && m.name);
  }, [members]);

  // Sync initial scope when opening
  useEffect(() => {
    if (open) {
      const initial = initialSelectedMemberId && initialSelectedMemberId !== "all" 
        ? initialSelectedMemberId 
        : "all";
      setSelectedScope(initial);
      setViewMode("single");
    }
  }, [open, initialSelectedMemberId]);

  // Load target values whenever scope or targets change
  useEffect(() => {
    if (!open) return;

    if (selectedScope === "all") {
      setLeadTargetInput(String(targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget));
      setRevenueTargetInput(String(targets.revenueTarget || DEFAULT_TARGETS.revenueTarget));
    } else {
      const selectedMember = activeMembers.find((m) => m.id === selectedScope);
      const targetInfo = getUserTarget(targets, selectedScope, selectedMember?.name);
      setLeadTargetInput(String(targetInfo.leadGenTarget));
      setRevenueTargetInput(String(targetInfo.revenueTarget));
    }

    // Populate table grid
    const grid: Record<string, { lead: string; rev: string }> = {};
    activeMembers.forEach((m) => {
      const info = getUserTarget(targets, m.id, m.name);
      grid[m.id] = {
        lead: String(info.leadGenTarget),
        rev: String(info.revenueTarget),
      };
    });
    setTableGrid(grid);
  }, [open, selectedScope, targets, activeMembers]);

  const numLeadTarget = Number(leadTargetInput) || 0;
  const numRevTarget = Number(revenueTargetInput) || 0;

  const currentMember = useMemo(() => {
    if (selectedScope === "all") return null;
    return activeMembers.find((m) => m.id === selectedScope) || null;
  }, [selectedScope, activeMembers]);

  const formatLakhsCr = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Permission denied. Only Administrators can configure sales targets.");
      return;
    }

    if (numLeadTarget <= 0) {
      toast.error("Lead generation target must be greater than 0");
      return;
    }

    if (numRevTarget <= 0) {
      toast.error("Revenue target must be greater than 0");
      return;
    }

    const adminName = user?.name || user?.email || "Admin";

    if (selectedScope === "all") {
      updateTargets(
        {
          leadGenTarget: numLeadTarget,
          revenueTarget: numRevTarget,
        },
        adminName
      );
      toast.success("Organization benchmark sales targets successfully updated!");
    } else {
      updateUserTarget(
        selectedScope,
        {
          leadGenTarget: numLeadTarget,
          revenueTarget: numRevTarget,
        },
        currentMember?.name,
        adminName
      );
      toast.success(`Sales target for ${currentMember?.name || "sales rep"} successfully updated!`);
    }

    onOpenChange(false);
  };

  const handleSaveAllTable = () => {
    if (!isAdmin) {
      toast.error("Permission denied. Only Administrators can configure sales targets.");
      return;
    }

    const adminName = user?.name || user?.email || "Admin";
    const batch: Record<string, { leadGenTarget: number; revenueTarget: number; userName?: string }> = {};

    activeMembers.forEach((m) => {
      const row = tableGrid[m.id];
      if (row) {
        batch[m.id] = {
          leadGenTarget: Number(row.lead) > 0 ? Number(row.lead) : targets.leadGenTarget,
          revenueTarget: Number(row.rev) > 0 ? Number(row.rev) : targets.revenueTarget,
          userName: m.name,
        };
      }
    });

    updateBatchUserTargets(batch, adminName);
    toast.success("All individual sales targets successfully updated!");
    onOpenChange(false);
  };

  const handleReset = () => {
    if (!isAdmin) return;
    const adminName = user?.name || user?.email || "Admin";
    if (selectedScope === "all") {
      resetTargets(adminName);
      setLeadTargetInput(String(DEFAULT_TARGETS.leadGenTarget));
      setRevenueTargetInput(String(DEFAULT_TARGETS.revenueTarget));
      toast.info("Organization targets reset to defaults (1,000 leads / ₹10,00,000)");
    } else {
      updateUserTarget(
        selectedScope,
        {
          leadGenTarget: targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget,
          revenueTarget: targets.revenueTarget || DEFAULT_TARGETS.revenueTarget,
        },
        currentMember?.name,
        adminName
      );
      setLeadTargetInput(String(targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget));
      setRevenueTargetInput(String(targets.revenueTarget || DEFAULT_TARGETS.revenueTarget));
      toast.info(`Target for ${currentMember?.name} reset to company benchmark`);
    }
  };

  // Quick preset pills
  const leadPills = [50, 100, 150, 250, 500, 1000];
  const revPills = [
    { label: "₹1L", value: 100000 },
    { label: "₹2.5L", value: 250000 },
    { label: "₹5L", value: 500000 },
    { label: "₹10L", value: 1000000 },
    { label: "₹25L", value: 2500000 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#151821] text-[#111318] dark:text-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/10 bg-gradient-to-br from-zinc-50 to-white dark:from-white/[0.03] dark:to-transparent shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#111318] dark:bg-white text-white dark:text-[#111318] flex items-center justify-center shadow-md">
                <Target className="w-5 h-5 text-[#c8f237] dark:text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Configure CRM Sales Targets</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Set unique targets for each team member or update company benchmarks
                </DialogDescription>
              </div>
            </div>

            {/* Admin Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#c8f237] dark:bg-[#c8f237]/20 text-[#111318] dark:text-[#c8f237] border border-black/10 dark:border-[#c8f237]/30 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Only</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-black/[0.06] dark:border-white/10">
            <div className="flex items-center p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "single"
                    ? "bg-white dark:bg-[#121319] text-[#111318] dark:text-white shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Single Person / Org</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-[#121319] text-[#111318] dark:text-white shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>All Team Members Grid</span>
              </button>
            </div>

            {viewMode === "single" && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                {currentMember ? `Target for ${currentMember.name}` : "Organization Target"}
              </span>
            )}
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!isAdmin ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-3">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Restricted to Administrators</p>
                <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                  Target configuration is restricted to administrators. Please contact an admin to adjust targets.
                </p>
              </div>
            </div>
          ) : null}

          {viewMode === "single" ? (
            <form id="singleTargetForm" noValidate onSubmit={handleSaveSingle} className="space-y-5">
              {/* Member Selector Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="scopeSelector" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Whose Target Are You Setting?</span>
                </Label>

                <div className="relative">
                  <select
                    id="scopeSelector"
                    value={selectedScope}
                    onChange={(e) => setSelectedScope(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full h-11 px-3.5 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border border-black/[0.1] dark:border-white/10 text-zinc-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#111318] dark:focus:ring-[#c8f237]"
                  >
                    <option value="all">Entire Organization (Company Benchmark)</option>
                    <optgroup label="Individual Team Members">
                      {activeMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role === "admin" ? "Admin" : "Client Manager"})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Field 1: Lead Generation Target */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="leadTargetInput" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Lead Generation Target</span>
                  </Label>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {numLeadTarget.toLocaleString("en-IN")} leads
                  </span>
                </div>

                <Input
                  id="leadTargetInput"
                  type="number"
                  min="0"
                  step="any"
                  disabled={!isAdmin}
                  autoFocus={defaultFocus === "leads"}
                  value={leadTargetInput}
                  onChange={(e) => setLeadTargetInput(e.target.value)}
                  placeholder="e.g. 150"
                  className="h-11 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border-black/[0.1] dark:border-white/10"
                />

                {isAdmin && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Quick set:</span>
                    {leadPills.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLeadTargetInput(String(val))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          numLeadTarget === val
                            ? "bg-[#111318] dark:bg-white text-white dark:text-[#111318] border-transparent shadow-xs"
                            : "bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border-black/[0.08] dark:border-white/10 hover:border-black/20"
                        }`}
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Revenue Target */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="revenueTargetInput" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Revenue Target</span>
                  </Label>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {formatLakhsCr(numRevTarget)}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold text-sm">
                    ₹
                  </div>
                  <Input
                    id="revenueTargetInput"
                    type="number"
                    min="0"
                    step="any"
                    disabled={!isAdmin}
                    autoFocus={defaultFocus === "revenue"}
                    value={revenueTargetInput}
                    onChange={(e) => setRevenueTargetInput(e.target.value)}
                    placeholder="e.g. 200000"
                    className="pl-8 h-11 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border-black/[0.1] dark:border-white/10"
                  />
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Quick set:</span>
                    {revPills.map((pill) => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => setRevenueTargetInput(String(pill.value))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          numRevTarget === pill.value
                            ? "bg-[#111318] dark:bg-white text-white dark:text-[#111318] border-transparent shadow-xs"
                            : "bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border-black/[0.08] dark:border-white/10 hover:border-black/20"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* All Members Grid Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Set different targets for each sales rep simultaneously:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{activeMembers.length} Team Members</span>
              </div>

              <div className="space-y-3">
                {activeMembers.map((m) => {
                  const row = tableGrid[m.id] || { lead: "150", rev: "200000" };
                  const revVal = Number(row.rev) || 0;
                  const revPreview = revVal >= 100000 ? formatLakhsCr(revVal) : `₹${revVal.toLocaleString("en-IN")}`;
                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 sm:w-48 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#111318] dark:bg-white text-white dark:text-[#111318] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight truncate">{m.name}</h4>
                          <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                            {m.role === "admin" ? "Admin" : "Client Manager"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 min-w-[110px] space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Lead Target</Label>
                            <span className="text-[10px] text-zinc-400 font-medium">leads</span>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            value={row.lead}
                            onChange={(e) =>
                              setTableGrid((prev) => ({
                                ...prev,
                                [m.id]: { ...prev[m.id], lead: e.target.value },
                              }))
                            }
                            placeholder="150"
                            className="h-10 text-sm font-semibold rounded-xl bg-white dark:bg-[#121319] border-black/10 dark:border-white/10 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        <div className="flex-1 min-w-[150px] space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Revenue Target</Label>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{revPreview}</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                            <Input
                              type="number"
                              min="0"
                              value={row.rev}
                              onChange={(e) =>
                                setTableGrid((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], rev: e.target.value },
                                }))
                              }
                              placeholder="200000"
                              className="h-10 text-sm font-semibold rounded-xl bg-white dark:bg-[#121319] border-black/10 dark:border-white/10 pl-7 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-white/[0.01] shrink-0">
          {isAdmin ? (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to defaults</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-10 px-4"
            >
              Cancel
            </Button>
            {isAdmin && (
              <Button
                type="button"
                onClick={() => {
                  if (viewMode === "single") {
                    const form = document.getElementById("singleTargetForm") as HTMLFormElement;
                    if (form) form.requestSubmit();
                  } else {
                    handleSaveAllTable();
                  }
                }}
                className="rounded-xl text-xs h-10 px-5 font-bold bg-[#111318] text-white hover:bg-black dark:bg-[#c8f237] dark:text-[#111318] dark:hover:bg-[#d4f55a] shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>{viewMode === "single" ? `Save Target for ${currentMember ? currentMember.name : "Org"}` : "Save All Targets"}</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
