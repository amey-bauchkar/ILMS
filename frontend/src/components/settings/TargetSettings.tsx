"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, 
  IndianRupee, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Users, 
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTargets, DEFAULT_TARGETS } from "@/lib/targets";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

export function TargetSettings() {
  const { user } = useUser();
  const { targets, updateTargets, resetTargets } = useTargets();

  const isAdmin = user?.role === "admin" || (!user && process.env.NODE_ENV === "development");

  const [leadTargetInput, setLeadTargetInput] = useState<string>("");
  const [revenueTargetInput, setRevenueTargetInput] = useState<string>("");

  useEffect(() => {
    setLeadTargetInput(String(targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget));
    setRevenueTargetInput(String(targets.revenueTarget || DEFAULT_TARGETS.revenueTarget));
  }, [targets]);

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

  const handleSave = (e: React.FormEvent) => {
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

    toast.success("Sales targets successfully updated and synced across dashboard!");
  };

  const handleReset = () => {
    if (!isAdmin) return;
    resetTargets(user?.name || user?.email || "Admin");
    setLeadTargetInput(String(DEFAULT_TARGETS.leadGenTarget));
    setRevenueTargetInput(String(DEFAULT_TARGETS.revenueTarget));
    toast.info("Sales targets reset to default values (1,000 leads / ₹10,00,000)");
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
    <form noValidate onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Intro Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111318] dark:bg-white text-white dark:text-[#111318] flex items-center justify-center">
            <Target className="w-5 h-5 text-[#c8f237] dark:text-emerald-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#111318] dark:text-white">Organization Performance Targets</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Set the benchmarks displayed on the executive dashboard speedometer and revenue bars.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#c8f237] text-[#111318] shadow-xs shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Only</span>
        </div>
      </div>

      {/* Field 1: Lead Generation Target */}
      <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="leadTargetInputSettings" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Lead Generation Target</span>
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
            <span>Revenue Target</span>
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
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to defaults</span>
        </button>

        <Button
          type="submit"
          className="rounded-xl text-xs h-11 px-6 font-bold bg-[#111318] text-white hover:bg-black dark:bg-[#c8f237] dark:text-[#111318] dark:hover:bg-[#d4f55a] shadow-sm"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Save Targets
        </Button>
      </div>
    </form>
  );
}
