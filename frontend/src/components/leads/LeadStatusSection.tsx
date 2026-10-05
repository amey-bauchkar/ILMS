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
    <div className="w-full bg-card/80 backdrop-blur-md border border-border rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
      <StatusPipeline
        currentStatus={lead.status}
        onStatusChange={async (newStatusId, lostReason) => {
          const result = await updateLead(lead.id, {
            status_id: newStatusId,
            lost_reason: lostReason || null,
          });
          
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Lead status updated successfully!");
          }
        }}
      />
    </div>
  );
}
