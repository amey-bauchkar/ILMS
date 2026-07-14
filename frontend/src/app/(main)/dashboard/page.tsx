"use client";

import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { NewLeadsStats } from "@/components/dashboard/NewLeadsStats";
import { LeadsBySource } from "@/components/dashboard/LeadsBySource";
import { ConversionRate } from "@/components/dashboard/ConversionRate";
import { PipelineValue } from "@/components/dashboard/PipelineValue";
import { FollowUpsSummary } from "@/components/dashboard/FollowUps";
import { TeamLeaderboard } from "@/components/dashboard/TeamLeaderboard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { WonVsLostTrend } from "@/components/dashboard/WonVsLostTrend";

// Demo preview imports — removable section
import { CallLogModal } from "@/components/shared/CallLogModal";
import { StatusPipeline } from "@/components/shared/StatusPipeline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockLeads } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground text-base">
          Welcome back to Foremark CRM. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Row 1 — KPI stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <NewLeadsStats />
        <ConversionRate />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineSummary />
        <LeadsBySource />
      </div>

      {/* Row 3 — Pipeline value + Won vs Lost */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineValue />
        <WonVsLostTrend />
      </div>

      {/* Row 4 — Follow-ups */}
      <FollowUpsSummary />

      {/* Row 5 — Leaderboard + Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamLeaderboard />
        <RecentActivityFeed />
      </div>

      {/* ============================================================
          COMPONENT PREVIEW — for testing purposes only.
          This entire section is isolated and can be removed cleanly.
          ============================================================ */}
      <div className="border-t border-dashed border-border pt-6 space-y-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold tracking-tight text-muted-foreground">
            🧪 Component Preview{" "}
            <span className="text-xs font-normal bg-secondary px-2 py-0.5 rounded-full ml-1">
              Dev Only — Removable
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Isolated demo of shared components. Remove this section before production.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* CallLogModal demo */}
          <Card>
            <CardHeader>
              <CardTitle>Call Log Modal</CardTitle>
              <CardDescription>
                Shared component: <code className="text-xs bg-secondary px-1 py-0.5 rounded">components/shared/CallLogModal.tsx</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Click to open the call logging modal for <strong>{mockLeads[0].name}</strong>.
              </p>
              <CallLogModal leadName={mockLeads[0].name} />
            </CardContent>
          </Card>

          {/* StatusPipeline demo */}
          <Card>
            <CardHeader>
              <CardTitle>Status Pipeline</CardTitle>
              <CardDescription>
                Shared component: <code className="text-xs bg-secondary px-1 py-0.5 rounded">components/shared/StatusPipeline.tsx</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Interactive stepper for <strong>{mockLeads[2].name}</strong> (currently: <em>{mockLeads[2].status}</em>).
              </p>
              <StatusPipeline
                currentStatus={mockLeads[2].status}
                onStatusChange={(s, reason) =>
                  console.log("Status changed:", s, reason ?? "")
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* END COMPONENT PREVIEW */}
    </div>
  );
}
