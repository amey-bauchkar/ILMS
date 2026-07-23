"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnrichedLead } from "@/hooks/use-data";
import { avatarColor } from "@/lib/avatar-colors";
import { Phone, FileText, ArrowRight, Tag, UserCheck } from "lucide-react";
import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

export interface Activity {
  id: string;
  leadId: string;
  type: "call" | "note" | "status_change" | "tag_change" | "reassignment";
  notes?: string;
  outcome?: string;
  fromStatus?: string;
  toStatus?: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string; role: string };
}

function displayName(name: string): string {
  return name;
}

function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_ICONS: Record<Activity["type"], React.ElementType> = {
  call: Phone,
  note: FileText,
  status_change: ArrowRight,
  tag_change: Tag,
  reassignment: UserCheck,
};

const ACTIVITY_COLORS: Record<Activity["type"], string> = {
  call: "#e87811",
  note: "#8b5cf6",
  status_change: "#3b82f6",
  tag_change: "#06b6d4",
  reassignment: "#22c55e",
};

function activityDescription(activity: Activity, leads: EnrichedLead[]): string {
  const lead = leads.find((l) => l.id === activity.leadId);
  const leadName = lead?.name ?? "Unknown Lead";

  switch (activity.type) {
    case "call":
      return `Called ${leadName} — ${activity.outcome ?? ""}`;
    case "note":
      return `Note on ${leadName}: ${activity.notes?.slice(0, 55) ?? ""}`;
    case "status_change":
      return `${leadName}: ${activity.fromStatus} → ${activity.toStatus}`;
    case "tag_change":
      return activity.notes ?? `Tag updated on ${leadName}`;
    case "reassignment":
      return `${leadName} reassigned`;
    default:
      return `Activity on ${leadName}`;
  }
}

interface RecentActivityFeedProps {
  leads: EnrichedLead[];
  activities: Activity[];
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function RecentActivityFeed({ leads, activities, dateFilter = "month", customRange }: RecentActivityFeedProps) {
  const filteredActivities = activities.filter(a => isWithinFilter(a.createdAt, dateFilter, customRange));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest team actions across all leads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {/* Vertical timeline line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" aria-hidden="true" />

          {filteredActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity found.</p>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type];
            const color = ACTIVITY_COLORS[activity.type];
            const name = displayName(activity.createdBy?.name || "System");
            const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const avatarBg = avatarColor(name);

            return (
              <div key={activity.id} className="flex gap-4 pb-5 last:pb-0 relative">
                {/* Icon bubble */}
                <div
                  className="z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2"
                  style={{ backgroundColor: `${color}20`, borderColor: "var(--background)" }}
                >
                  <Icon className="h-3 w-3" style={{ color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-foreground leading-snug">
                    {activityDescription(activity, leads)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {name} · {timeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </CardContent>
    </Card>
  );
}
