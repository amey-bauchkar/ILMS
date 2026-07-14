"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockLeads, LeadStatus } from "@/lib/mock-data";

const STATUSES: LeadStatus[] = [
  "New", "Attempted Contact", "Contacted", "Qualified",
  "Proposal Sent", "Negotiation", "Won", "Lost",
];

const STATUS_COLORS: Record<string, string> = {
  "New": "#737373",
  "Attempted Contact": "#3b82f6",
  "Contacted": "#06b6d4",
  "Qualified": "#8b5cf6",
  "Proposal Sent": "#6366f1",
  "Negotiation": "#e87811",
  "Won": "#22c55e",
  "Lost": "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-muted-foreground">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export function PipelineSummary() {
  const data = STATUSES.map((status) => ({
    name: status,
    count: mockLeads.filter((l) => l.status === status).length,
  })).filter((d) => d.count > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Summary</CardTitle>
          <CardDescription>Leads by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No leads in pipeline.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Summary</CardTitle>
        <CardDescription>Lead count by stage</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#a3a3a3" }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#e87811"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
