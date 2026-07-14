"use client";

import { StatusPipeline } from "@/components/shared/StatusPipeline";
import { Lead } from "@/lib/mock-data";

interface LeadStatusSectionProps {
  lead: Lead;
}

export function LeadStatusSection({ lead }: LeadStatusSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Pipeline Status
      </p>
      <StatusPipeline
        currentStatus={lead.status}
        onStatusChange={(newStatus, lostReason) => {
          console.log("LeadStatusChange:", {
            leadId: lead.id,
            leadName: lead.name,
            newStatus,
            lostReason: lostReason ?? null,
          });
        }}
      />
    </div>
  );
}
