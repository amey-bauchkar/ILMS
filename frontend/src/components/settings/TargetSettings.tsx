"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Target, 
  IndianRupee, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Users, 
  Lock,
  UserCheck,
  Building2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTargets, DEFAULT_TARGETS, getUserTarget } from "@/lib/targets";
import { useUser } from "@/components/providers/user-provider";
import { useTeamMembers } from "@/hooks/use-data";
import { toast } from "sonner";

export function TargetSettings() {
  const { user } = useUser();
  const { members } = useTeamMembers();
  const { targets, updateTargets, updateUserTarget, updateBatchUserTargets, resetTargets } = useTargets();

  const isAdmin = user?.role === "admin" || (!user && process.env.NODE_ENV === "development");

  // Company default inputs
  const [leadTargetInput, setLeadTargetInput] = useState<string>("");
  const [revenueTargetInput, setRevenueTargetInput] = useState<string>("");

  // Individual member grid inputs: keyed by member id
  const [memberGrid, setMemberGrid] = useState<Record<string, { lead: string; rev: string }>>({});

  const activeMembers = useMemo(() => {
    return members.filter((m) => m.is_active !== false && m.name);
  }, [members]);

  useEffect(() => {
    setLeadTargetInput(String(targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget));
    setRevenueTargetInput(String(targets.revenueTarget || DEFAULT_TARGETS.revenueTarget));

    // Populate members grid
    const grid: Record<string, { lead: string; rev: string }> = {};
    activeMembers.forEach((m) => {
      const info = getUserTarget(targets, m.id, m.name);
      grid[m.id] = {
        lead: String(info.leadGenTarget),
        rev: String(info.revenueTarget),
      };
    });
    setMemberGrid(grid);
  }, [targets, activeMembers]);

  const numLeadTarget = Number(leadTargetInput) || 0;
  const numRevTarget = Number(revenueTargetInput) || 0;

  const formatLakhsCr = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const handleSaveCompany = (e: React.FormEvent) => {
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

    updateTargets(
      {
        leadGenTarget: numLeadTarget,
        revenueTarget: numRevTarget,
      },
      user?.name || user?.email || "Admin"
    );

    toast.success("Organization benchmark sales targets successfully updated!");
  };

  const handleSaveIndividual = (memberId: string, memberName: string) => {
    if (!isAdmin) {
      toast.error("Permission denied. Only Administrators can configure sales targets.");
      return;
    }

    const row = memberGrid[memberId];
    if (!row) return;

    const leadNum = Number(row.lead);
    const revNum = Number(row.rev);

    if (leadNum <= 0 || revNum <= 0) {
      toast.error("Targets must be greater than 0");
      return;
    }

    updateUserTarget(
      memberId,
      {
        leadGenTarget: leadNum,
        revenueTarget: revNum,
      },
      memberName,
      user?.name || user?.email || "Admin"
    );

    toast.success(`Sales target for ${memberName} successfully updated!`);
  };

  const handleSaveAllMembers = () => {
    if (!isAdmin) {
      toast.error("Permission denied. Only Administrators can configure sales targets.");
      return;
    }

    const adminName = user?.name || user?.email || "Admin";
    const batch: Record<string, { leadGenTarget: number; revenueTarget: number; userName?: string }> = {};

    activeMembers.forEach((m) => {
      const row = memberGrid[m.id];
      if (row) {
        batch[m.id] = {
          leadGenTarget: Number(row.lead) > 0 ? Number(row.lead) : targets.leadGenTarget,
          revenueTarget: Number(row.rev) > 0 ? Number(row.rev) : targets.revenueTarget,
          userName: m.name,
        };
      }
    });

    updateBatchUserTargets(batch, adminName);
    toast.success("All individual sales targets successfully updated and synced across dashboard!");
  };

  const handleResetCompany = () => {
    if (!isAdmin) return;
    resetTargets(user?.name || user?.email || "Admin");
    setLeadTargetInput(String(DEFAULT_TARGETS.leadGenTarget));
    setRevenueTargetInput(String(DEFAULT_TARGETS.revenueTarget));
    toast.info("Organization targets reset to default values (1,000 leads / ₹10,00,000)");
  };

  const leadPills = [500, 1000, 2500, 5000, 10000];
  const revPills = [
    { label: "₹5L", value: 500000 },
    { label: "₹10L", value: 1000000 },
    { label: "₹25L", value: 2500000 },
    { label: "₹50L", value: 5000000 },
    { label: "₹1 Cr", value: 10000000 },
  ];

  if (!isAdmin) {
    return (
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-3">
        <Lock className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Admin Permission Required</h4>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-xs">
            Performance targets configuration is restricted to organization administrators. Please contact your CRM admin to adjust targets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Intro Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111318] dark:bg-white text-white dark:text-[#111318] flex items-center justify-center shadow-xs">
            <Target className="w-5 h-5 text-[#c8f237] dark:text-emerald-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#111318] dark:text-white">Sales & Performance Targets</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure company-wide benchmarks and set different custom targets for each team member.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#c8f237] text-[#111318] shadow-xs shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Only</span>
        </div>
      </div>

      {/* SECTION 1: INDIVIDUAL TEAM MEMBER TARGETS (Manish, Aish, etc.) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Individual Team Member Targets</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Set unique target numbers for each sales rep (e.g. Manish set to different target than other team members)
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSaveAllMembers}
            className="rounded-xl text-xs h-9 px-4 font-bold bg-[#111318] text-white hover:bg-black dark:bg-[#c8f237] dark:text-[#111318] dark:hover:bg-[#d4f55a] shadow-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            <span>Save All Team Targets</span>
          </Button>
        </div>

        <div className="space-y-3">
          {activeMembers.map((m) => {
            const row = memberGrid[m.id] || { lead: "150", rev: "200000" };
            const isCustom = !!targets.userTargets?.[m.id];
            return (
              <div
                key={m.id}
                className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                {/* Rep Info */}
                <div className="flex items-center gap-3 md:w-56">
                  <div className="w-9 h-9 rounded-full bg-[#111318] dark:bg-white text-white dark:text-[#111318] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {isCustom && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          Custom
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      {m.role === "admin" ? "Admin" : "Client Manager"} • {m.email}
                    </span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 min-w-[110px] space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Lead Target
                      </Label>
                      <span className="text-[10px] text-zinc-400 font-medium">leads</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={row.lead}
                      onChange={(e) =>
                        setMemberGrid((prev) => ({
                          ...prev,
                          [m.id]: { ...prev[m.id], lead: e.target.value },
                        }))
                      }
                      placeholder="e.g. 150"
                      className="h-10 text-sm font-semibold rounded-xl bg-zinc-50 dark:bg-white/[0.04] border-black/[0.08] dark:border-white/10 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="flex-1 min-w-[150px] space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Revenue Target
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {formatLakhsCr(Number(row.rev) || 0)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={row.rev}
                        onChange={(e) =>
                          setMemberGrid((prev) => ({
                            ...prev,
                            [m.id]: { ...prev[m.id], rev: e.target.value },
                          }))
                        }
                        placeholder="e.g. 200000"
                        className="h-10 text-sm font-semibold rounded-xl bg-zinc-50 dark:bg-white/[0.04] border-black/[0.08] dark:border-white/10 pl-7 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveIndividual(m.id, m.name)}
                      className="h-10 px-3 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-[#111318] hover:text-white dark:bg-white/[0.06] dark:hover:bg-[#c8f237] dark:hover:text-[#111318] text-zinc-700 dark:text-zinc-200 border border-black/[0.06] dark:border-white/10 transition-all shrink-0 cursor-pointer"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: COMPANY-WIDE DEFAULT BENCHMARKS */}
      <form noValidate onSubmit={handleSaveCompany} className="space-y-4 pt-4 border-t border-black/[0.06] dark:border-white/10">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Organization Default Benchmark (Company Pipeline)</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Default targets displayed on the executive dashboard when viewing overall organization performance
          </p>
        </div>

        {/* Field 1: Lead Generation Target */}
        <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="leadTargetInputSettings" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Org Lead Generation Target</span>
            </Label>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              {numLeadTarget.toLocaleString("en-IN")} leads
            </span>
          </div>

          <Input
            id="leadTargetInputSettings"
            type="number"
            min="0"
            step="any"
            value={leadTargetInput}
            onChange={(e) => setLeadTargetInput(e.target.value)}
            placeholder="e.g. 1000"
            className="h-11 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border-black/[0.1] dark:border-white/10"
          />

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-zinc-400 font-medium">Quick presets:</span>
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
        </div>

        {/* Field 2: Revenue Target */}
        <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="revenueTargetInputSettings" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Org Revenue Target</span>
            </Label>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {formatLakhsCr(numRevTarget)}
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold text-sm">
              ₹
            </div>
            <Input
              id="revenueTargetInputSettings"
              type="number"
              min="0"
              step="any"
              value={revenueTargetInput}
              onChange={(e) => setRevenueTargetInput(e.target.value)}
              placeholder="e.g. 2500000"
              className="pl-8 h-11 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border-black/[0.1] dark:border-white/10"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-zinc-400 font-medium">Quick presets:</span>
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetCompany}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset org to defaults</span>
          </button>

          <Button
            type="submit"
            className="rounded-xl text-xs h-11 px-6 font-bold bg-[#111318] text-white hover:bg-black dark:bg-[#c8f237] dark:text-[#111318] dark:hover:bg-[#d4f55a] shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Save Org Benchmark
          </Button>
        </div>
      </form>
    </div>
  );
}
