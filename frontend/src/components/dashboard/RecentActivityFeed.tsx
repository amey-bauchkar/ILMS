"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockLeads, mockTeamMembers, Activity } from "@/lib/mock-data";
import { avatarColor } from "@/lib/avatar-colors";
import { Phone, FileText, ArrowRight, Tag, UserCheck } from "lucide-react";

// Display-name mapping for the activity feed (UI only, per BRD name replacement spec):
// mockTeamMembers[0] = Amey  → display as "Tanmay"
// mockTeamMembers[1] = Janhavi → display as "Amey"
// mockTeamMembers[2] = Tanmay → display as "Rahul"
// mockTeamMembers[3] = Manish → unchanged
const DISPLAY_NAMES: Record<string, string> = {
  "TM-1": "Tanmay",   // Amey → Tanmay
  "TM-2": "Amey",    // Janhavi → Amey
  "TM-3": "Rahul",   // Tanmay → Rahul
  "TM-4": "Manish",
};

function displayName(member: (typeof mockTeamMembers)[number]): string {
  return DISPLAY_NAMES[member.id] ?? member.name;
}

// 18 deterministic activities (BRD requires 15-20)
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "ra-1",
    leadId: "L-1004",
    type: "call",
    outcome: "Answered",
    notes: "Discussed proposal timeline with client.",
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "ra-2",
    leadId: "L-1001",
    type: "status_change",
    fromStatus: "New",
    toStatus: "Attempted Contact",
    notes: null,
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "ra-3",
    leadId: "L-1003",
    type: "note",
    notes: "Client requested revised pricing sheet.",
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "ra-4",
    leadId: "L-1008",
    type: "call",
    outcome: "Not Answered",
    notes: null,
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "ra-5",
    leadId: "L-1010",
    type: "status_change",
    fromStatus: "Contacted",
    toStatus: "Proposal Sent",
    notes: null,
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "ra-6",
    leadId: "L-1002",
    type: "tag_change",
    notes: "Added tag: High Intent",
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "ra-7",
    leadId: "L-1009",
    type: "call",
    outcome: "Busy",
    notes: null,
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "ra-8",
    leadId: "L-1005",
    type: "status_change",
    fromStatus: "Negotiation",
    toStatus: "Won",
    notes: null,
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "ra-9",
    leadId: "L-1012",
    type: "note",
    notes: "Hospital board approved the digital health module. Starting onboarding next week.",
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "ra-10",
    leadId: "L-1006",
    type: "call",
    outcome: "Voicemail",
    notes: "Left voicemail about follow-up pricing.",
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
  },
  {
    id: "ra-11",
    leadId: "L-1011",
    type: "reassignment",
    notes: null,
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "ra-12",
    leadId: "L-1007",
    type: "status_change",
    fromStatus: "Negotiation",
    toStatus: "Lost",
    notes: null,
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
  },
  {
    id: "ra-13",
    leadId: "L-1003",
    type: "call",
    outcome: "Answered",
    notes: "Client confirmed budget approval. Waiting for PO.",
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "ra-14",
    leadId: "L-1002",
    type: "tag_change",
    notes: "Added tag: Website Rebuild",
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString(),
  },
  {
    id: "ra-15",
    leadId: "L-1010",
    type: "note",
    notes: "Sent revised proposal with revised payment milestones.",
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "ra-16",
    leadId: "L-1004",
    type: "status_change",
    fromStatus: "Qualified",
    toStatus: "Proposal Sent",
    notes: null,
    createdBy: mockTeamMembers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 78).toISOString(),
  },
  {
    id: "ra-17",
    leadId: "L-1008",
    type: "call",
    outcome: "Call Back Requested",
    notes: "Client asked to call back Thursday afternoon.",
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 84).toISOString(),
  },
  {
    id: "ra-18",
    leadId: "L-1001",
    type: "note",
    notes: "Initial discovery call done. Strong fit for digital transformation package.",
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

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

function activityDescription(activity: Activity): string {
  const lead = mockLeads.find((l) => l.id === activity.leadId);
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

export function RecentActivityFeed() {
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

          {MOCK_ACTIVITIES.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];
            const color = ACTIVITY_COLORS[activity.type];
            const name = displayName(activity.createdBy);
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
                    {activityDescription(activity)}
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
          })}
        </div>
      </CardContent>
    </Card>
  );
}
