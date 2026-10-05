import { notFound } from "next/navigation";
import { LeadInfoCard } from "@/components/leads/LeadInfoCard";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { LeadStatusSection } from "@/components/leads/LeadStatusSection";
import { createClient } from "@/lib/supabase/server";
import { EnrichedLead } from "@/hooks/use-data";

interface LeadPageProps {
  params: Promise<{
    id: string;
  }>;
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resolveStatusColor } from "@/lib/utils";

export default async function LeadDetailPage({ params }: LeadPageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  
  const { data: rawRow, error } = await supabase
    .from("leads")
    .select(`
      *,
      owner:users!leads_owner_id_fkey(id, name, email, role),
      status:statuses!leads_status_id_fkey(id, name, color, slug),
      lead_tags(tag_id, tags(id, name))
    `)
    .eq("id", id)
    .single();

  if (error || !rawRow) {
    notFound();
  }
  
  const row = rawRow as any;

  const lead: EnrichedLead = {
    id: row.id,
    name: row.name,
    company: row.company_name,
    phone: row.phone,
    email: row.email,
    source: (row.custom_fields as any)?.source || row.source,
    sourceLink: (row.custom_fields as any)?.source_link || null,
    status: row.status?.name || "Unknown",
    statusColor: resolveStatusColor(row.status?.name, row.status?.color),
    statusId: row.status_id,
    owner: row.owner || { id: "", name: "Unassigned", email: "", role: "" },
    priority: ((row.custom_fields as any)?.priority || row.priority) as "Hot" | "Warm" | "Cold" | "Dead",
    tags: (row.lead_tags || []).map((lt: any) => lt.tags?.name).filter(Boolean),
    dealValue: row.estimated_deal_value,
    createdAt: row.created_at,
    location: row.location || (row.custom_fields as any)?.location || null,
    lastContactedAt: row.last_contacted_at,
    nextFollowUpDate: row.next_followup_date,
    lostReason: row.lost_reason,
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Leads</span>
          </Link>
          <span className="text-muted-foreground/40 font-mono">/</span>
          <span className="font-semibold text-foreground truncate max-w-[280px]">
            {lead.name}
          </span>
          {lead.company && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              ({lead.company})
            </span>
          )}
        </div>
      </div>

      {/* Status Pipeline — interactive stepper with confirmation dialog */}
      <LeadStatusSection lead={lead} />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Panel: Sticky Info Card (30% on desktop) */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 lg:sticky lg:top-6">
          <LeadInfoCard lead={lead} />
        </div>

        {/* Right Panel: Activity Timeline (70% on desktop) */}
        <div className="w-full flex-1">
          <ActivityTimeline leadId={lead.id} />
        </div>
      </div>
    </div>
  );
}
