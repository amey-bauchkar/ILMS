"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrichedLead } from "@/hooks/use-data";
import { Users, TrendingUp } from "lucide-react";

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function NewLeadsStats({ leads }: { leads: EnrichedLead[] }) {
  const today = leads.filter((l) => isWithinDays(l.createdAt, 1)).length;
  const week = leads.filter((l) => isWithinDays(l.createdAt, 7)).length;
  const month = leads.filter((l) => isWithinDays(l.createdAt, 30)).length;

  const stats = [
    { label: "Today", value: today, color: "#e87811" },
    { label: "This Week", value: week, color: "#3b82f6" },
    { label: "This Month", value: month, color: "#22c55e" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <CardTitle>New Leads</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-secondary/40 border border-border/50"
            >
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span>
            <span className="text-foreground font-medium">{leads.length}</span> total leads in system
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
