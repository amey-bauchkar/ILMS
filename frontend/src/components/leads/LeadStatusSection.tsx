"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { StatusPipeline } from "@/components/shared/StatusPipeline";
import { WonProjectTracker } from "@/components/leads/WonProjectTracker";
import type { EnrichedLead } from "@/hooks/use-data";
import { useStatuses } from "@/hooks/use-data";
import { updateLead } from "@/actions/leads";
import { toast } from "sonner";
import { Trophy, FileSpreadsheet, Sparkles } from "lucide-react";

interface LeadStatusSectionProps {
  lead: EnrichedLead;
}

export function LeadStatusSection({ lead }: LeadStatusSectionProps) {
  const { statuses } = useStatuses();
  const searchParams = useSearchParams();
  const initialWon = searchParams?.get("won") === "1";
  const [currentStatusName, setCurrentStatusName] = useState(initialWon ? "Won" : lead.status);
  const [manualTrackerOpen, setManualTrackerOpen] = useState(
    initialWon || searchParams?.get("tracker") === "1"
  );

  useEffect(() => {
    if (searchParams?.get("won") === "1") {
      setCurrentStatusName("Won");
      setManualTrackerOpen(true);
    } else if (searchParams?.get("tracker") === "1") {
      setManualTrackerOpen(true);
    }
  }, [searchParams]);

  const isWon = currentStatusName.toLowerCase() === "won";

  return (
    <div className="space-y-4">
      {/* 1. Pipeline Stage Progression Card */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#121319] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-white">
              Pipeline Stage Progression
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {isWon ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Deal Won • Project Update Active</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setManualTrackerOpen(!manualTrackerOpen)}
                className="text-[11px] text-zinc-500 hover:text-[#111318] dark:text-zinc-400 dark:hover:text-white font-medium flex items-center gap-1.5 hover:underline transition-colors px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/10"
                title="Preview project update on localhost"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{manualTrackerOpen ? "Hide Project Update" : "Preview Project Update (Localhost)"}</span>
              </button>
            )}
          </div>
        </div>

        <StatusPipeline
          currentStatus={currentStatusName}
          lostReason={lead.lostReason}
          onStatusChange={async (newStatusId, lostReason) => {
            const newStatusObj = statuses.find((s) => s.id === newStatusId);
            if (newStatusObj) {
              setCurrentStatusName(newStatusObj.name);
            }
            
            const result = await updateLead(lead.id, {
              status_id: newStatusId,
              lost_reason: lostReason || null,
            });
            
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success("Status updated!");
              if (newStatusObj?.name.toLowerCase() === "won") {
                toast.success("🎉 Deal Won! Project Update & Daily Activity Sheet activated below.", {
                  duration: 5000,
                });
              }
            }
          }}
        />
      </div>

      {/* 2. Project Update & Daily Activity Tracker (Shown automatically upon Deal Won or manual preview) */}
      {(isWon || manualTrackerOpen) && (
        <WonProjectTracker lead={{ ...lead, status: currentStatusName }} />
      )}
    </div>
  );
}
