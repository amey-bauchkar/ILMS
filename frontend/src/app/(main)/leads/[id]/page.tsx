import { notFound } from "next/navigation";
import { mockLeads } from "@/lib/mock-data";
import { LeadInfoCard } from "@/components/leads/LeadInfoCard";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { LeadStatusSection } from "@/components/leads/LeadStatusSection";

interface LeadPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LeadDetailPage({ params }: LeadPageProps) {
  const { id } = await params;
  const lead = mockLeads.find((l) => l.id === id);

  if (!lead) {
    notFound();
  }

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
