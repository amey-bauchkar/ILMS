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
    source: row.source,
    status: row.status?.name || "Unknown",
    statusColor: row.status?.color || "#737373",
    statusId: row.status_id,
    owner: row.owner || { id: "", name: "Unassigned", email: "", role: "" },
    priority: row.priority as "Hot" | "Warm" | "Cold",
    tags: (row.lead_tags || []).map((lt: any) => lt.tags?.name).filter(Boolean),
    dealValue: row.estimated_deal_value,
    createdAt: row.created_at,
    lastContactedAt: row.last_contacted_at,
    nextFollowUpDate: row.next_followup_date,
    lostReason: row.lost_reason,
  };

  return (
    <div className="space-y-6 pb-10">
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
