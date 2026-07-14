"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLeads, Lead } from "@/lib/mock-data";
import { AlertTriangle, Clock, Phone } from "lucide-react";
import { avatarColor } from "@/lib/avatar-colors";

const TODAY = new Date("2026-07-14");

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function daysOverdue(dateStr: string) {
  const d = new Date(dateStr);
  const diff = TODAY.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function LeadRow({ lead, badge }: { lead: Lead; badge?: React.ReactNode }) {
  const initials = lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const color = avatarColor(lead.name);

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{lead.name}</p>
        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
      </div>
      {badge}
    </div>
  );
}

export function OverdueFollowUps() {
  const overdue = mockLeads.filter((l) => {
    if (!l.nextFollowUpDate) return false;
    const d = new Date(l.nextFollowUpDate);
    return d < TODAY && l.status !== "Won" && l.status !== "Lost";
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle>Overdue Follow-Ups</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {overdue.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">🎉 All caught up!</p>
        ) : (
          <div>
            {overdue.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                badge={
                  <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full shrink-0">
                    {daysOverdue(lead.nextFollowUpDate!)}d overdue
                  </span>
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TodaysFollowUps() {
  const todayStr = TODAY.toISOString().split("T")[0];
  const todayLeads = mockLeads.filter(
    (l) => l.nextFollowUpDate === todayStr && l.status !== "Won" && l.status !== "Lost"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <CardTitle>Today&apos;s Follow-Ups</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {todayLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No follow-ups scheduled for today.</p>
        ) : (
          <div>
            {todayLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                badge={
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: lead.priority === "Hot" ? "#ef444420" : lead.priority === "Warm" ? "#e8781120" : "#3b82f620",
                        color: lead.priority === "Hot" ? "#ef4444" : lead.priority === "Warm" ? "#e87811" : "#3b82f6",
                      }}
                    >
                      {lead.priority}
                    </span>
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FollowUpsSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TodaysFollowUps />
      <OverdueFollowUps />
    </div>
  );
}
