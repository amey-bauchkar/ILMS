"use client";

import { useActivities } from "@/hooks/use-data";
import { TimelineEntry } from "./TimelineEntry";
import { AddNoteInline } from "./AddNoteInline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ActivityTimeline({ leadId }: { leadId: string }) {
  const { activities, loading } = useActivities(leadId);

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-xl">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <AddNoteInline leadId={leadId} />
        
        <div className="mt-8">
          {loading ? (
            <div className="py-12 flex justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              No activity recorded yet.
            </div>
          ) : (
            activities.map((activity) => (
              <TimelineEntry key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
