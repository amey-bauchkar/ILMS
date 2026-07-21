"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockLeads, LeadSource } from "@/lib/mock-data";
import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

const SOURCE_COLORS: Record<string, string> = {
  "Reddit": "#ff6314",
  "Google Business Profile": "#4285f4",
  "Referral": "#22c55e",
  "Website Inbound": "#e87811",
  "LinkedIn": "#0a66c2",
  "Cold Outreach": "#8b5cf6",
  "WhatsApp": "#25d366",
  "Upwork": "#14a800",
  "Events": "#eab308",
  "Other": "#737373",
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value} leads ({(payload[0].payload.percent * 100).toFixed(0)}%)</p>
      </div>
    );
  }
  return null;
};

interface LeadsBySourceProps {
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function LeadsBySource({ dateFilter = "month", customRange }: LeadsBySourceProps) {
  const filteredLeads = mockLeads.filter(l => isWithinFilter(l.createdAt, dateFilter, customRange));

  const sourceCounts = filteredLeads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Source</CardTitle>
        <CardDescription>Distribution across acquisition channels</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={SOURCE_COLORS[entry.name as LeadSource] ?? "#737373"}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "#a3a3a3" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
