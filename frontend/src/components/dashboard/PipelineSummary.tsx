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
import { EnrichedLead } from "@/hooks/use-data";
import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

// Removed hardcoded STATUSES/COLORS to use dynamic ones from data, 
// but for order and color consistency, we can group by the actual statuses in `leads`.

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

interface PipelineSummaryProps {
  leads: EnrichedLead[];
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function PipelineSummary({ leads, dateFilter = "month", customRange }: PipelineSummaryProps) {
  const filteredLeads = leads.filter(l => isWithinFilter(l.createdAt, dateFilter, customRange));

  // Group by status dynamically from the passed leads
  const countsByStatus = filteredLeads.reduce((acc, lead) => {
    if (!acc[lead.status]) {
      acc[lead.status] = { count: 0, color: lead.statusColor };
    }
    acc[lead.status].count += 1;
    return acc;
  }, {} as Record<string, { count: number; color: string }>);

  const data = Object.entries(countsByStatus).map(([name, { count, color }]) => ({
    name,
    count,
    color,
  })).sort((a, b) => b.count - a.count); // sort by count descending

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
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
