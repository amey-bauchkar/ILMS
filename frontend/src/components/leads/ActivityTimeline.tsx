"use client";

import { Activity, mockTeamMembers } from "@/lib/mock-data";
import { TimelineEntry } from "./TimelineEntry";
import { AddNoteInline } from "./AddNoteInline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mocking some activities for this lead
const generateMockActivities = (leadId: string): Activity[] => [
  {
    id: "act-1",
    leadId,
    type: "note",
    notes: "Client seems very interested in a full website revamp. Need to send a proposal by Friday.",
    createdBy: mockTeamMembers[1], // Janhavi
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: "act-2",
    leadId,
    type: "call",
    outcome: "Answered",
    notes: "Discussed budget and timeline. They are looking for Q3 launch.",
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "act-3",
    leadId,
    type: "status_change",
    fromStatus: "Attempted Contact",
    toStatus: "Contacted",
    notes: null,
    createdBy: mockTeamMembers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "act-4",
    leadId,
    type: "call",
    outcome: "Not Answered",
    notes: null,
    createdBy: mockTeamMembers[2], // Tanmay
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: "act-5",
    leadId,
    type: "status_change",
    fromStatus: "New",
    toStatus: "Attempted Contact",
    notes: null,
    createdBy: mockTeamMembers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  }
];

export function ActivityTimeline({ leadId }: { leadId: string }) {
  const activities = generateMockActivities(leadId);

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-xl">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <AddNoteInline leadId={leadId} />
        
        <div className="mt-8">
          {activities.map((activity) => (
            <TimelineEntry key={activity.id} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
