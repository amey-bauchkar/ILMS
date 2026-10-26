"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
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
  Users 
} from "lucide-react";
import { useTargets, DEFAULT_TARGETS } from "@/lib/targets";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface EditTargetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFocus?: "leads" | "revenue";
}

export function EditTargetsModal({
  open,
  onOpenChange,
  defaultFocus = "leads",
}: EditTargetsModalProps) {
  const { user } = useUser();
  const { targets, updateTargets, resetTargets } = useTargets();

  const isAdmin = user?.role === "admin" || (!user && process.env.NODE_ENV === "development");

  const [leadTargetInput, setLeadTargetInput] = useState<string>("");
  const [revenueTargetInput, setRevenueTargetInput] = useState<string>("");

  useEffect(() => {
    if (open) {
      setLeadTargetInput(String(targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget));
      setRevenueTargetInput(String(targets.revenueTarget || DEFAULT_TARGETS.revenueTarget));
    }
  }, [open, targets]);

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
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#151821] text-[#111318] dark:text-white shadow-2xl">
        <form onSubmit={handleSave}>
          {/* Header */}
          <div className="p-6 border-b border-black/[0.06] dark:border-white/10 bg-gradient-to-br from-zinc-50 to-white dark:from-white/[0.03] dark:to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#111318] dark:bg-white text-white dark:text-[#111318] flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-[#c8f237] dark:text-emerald-500" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Configure CRM Sales Targets</DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                    Set company-wide milestone targets for the pipeline
                  </DialogDescription>
                </div>
              </div>

              {/* Admin Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#c8f237] dark:bg-[#c8f237]/20 text-[#111318] dark:text-[#c8f237] border border-black/10 dark:border-[#c8f237]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Only</span>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-6">
            {!isAdmin ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-3">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Restricted to Administrators</p>
                  <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                    Your account does not have admin permissions to modify company performance targets. Contact an organization admin to update these values.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Field 1: Lead Generation Target */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="leadTargetInput" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Lead Generation Target (Total Leads)</span>
                </Label>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {numLeadTarget.toLocaleString("en-IN")} leads
                </span>
              </div>

              <div className="relative">
                <Input
                  id="leadTargetInput"
                  type="number"
                  min="1"
                  step="1"
                  disabled={!isAdmin}
                  autoFocus={defaultFocus === "leads"}
                  value={leadTargetInput}
                  onChange={(e) => setLeadTargetInput(e.target.value)}
                  placeholder="e.g. 1000"
                  className="h-11 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border-black/[0.1] dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#111318] dark:focus-visible:ring-[#c8f237]"
                />
              </div>

              {/* Quick Preset Pills for Leads */}
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
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="revenueTargetInput" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Revenue Target (₹ INR)</span>
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
                  min="1"
                  step="50000"
                  disabled={!isAdmin}
                  autoFocus={defaultFocus === "revenue"}
                  value={revenueTargetInput}
                  onChange={(e) => setRevenueTargetInput(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="pl-8 h-11 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-white/[0.04] border-black/[0.1] dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#111318] dark:focus-visible:ring-[#c8f237]"
                />
              </div>

              {/* Quick Preset Pills for Revenue */}
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
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-white/[0.01]">
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
                  type="submit"
                  className="rounded-xl text-xs h-10 px-5 font-bold bg-[#111318] text-white hover:bg-black dark:bg-[#c8f237] dark:text-[#111318] dark:hover:bg-[#d4f55a] shadow-sm"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Save Targets
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
