"use client";

import { StatusPipeline } from "@/components/shared/StatusPipeline";
import type { EnrichedLead } from "@/hooks/use-data";
import { updateLead } from "@/actions/leads";
import { toast } from "sonner";

interface LeadStatusSectionProps {
  lead: EnrichedLead;
}

export function LeadStatusSection({ lead }: LeadStatusSectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#181a24]/90 to-[#12141c]/80 backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Pipeline Stage Progression
          </h3>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline-block">
          Click any stage to transition lead
        </span>
      </div>
      <StatusPipeline
        currentStatus={lead.status}
        lostReason={lead.lostReason}
        onStatusChange={async (newStatusId, lostReason) => {
          const result = await updateLead(lead.id, {
            status_id: newStatusId,
            lost_reason: lostReason || null,
          });
          
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Status updated!");
          }
        }}
      />
    </div>
  );
}
