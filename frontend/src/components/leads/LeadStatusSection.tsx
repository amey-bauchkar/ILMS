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
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#c8f237] animate-pulse shadow-xs" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111318]">
            Pipeline Stage Progression
          </h3>
        </div>
        <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline-block">
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
