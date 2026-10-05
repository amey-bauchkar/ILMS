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
    <div className="bg-card border border-border rounded-xl px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Pipeline Status
      </p>
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
            toast.success("Status updated!");
          }
        }}
      />
    </div>
  );
}
