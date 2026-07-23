"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnrichedLead } from "@/hooks/use-data";
import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg space-y-1">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: ₹{(p.value / 1000).toFixed(0)}K
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface PipelineValueProps {
  leads: EnrichedLead[];
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function PipelineValue({ leads, dateFilter = "month", customRange }: PipelineValueProps) {
  const filteredLeads = leads.filter(l => isWithinFilter(l.createdAt, dateFilter, customRange));

  const uniqueOwners = Array.from(new Set(filteredLeads.map(l => l.owner.id)))
    .map(id => filteredLeads.find(l => l.owner.id === id)!.owner);

  // Group deal value by owner and status bucket (active / won / lost)
  const data = uniqueOwners.map((member) => {
    const memberLeads = filteredLeads.filter(
      (l) => l.owner.id === member.id && l.dealValue
    );
    const active = memberLeads
      .filter((l) => !["Won", "Lost"].includes(l.status))
      .reduce((s, l) => s + (l.dealValue || 0), 0);
    const won = memberLeads
      .filter((l) => l.status === "Won")
      .reduce((s, l) => s + (l.dealValue || 0), 0);
    const lost = memberLeads
      .filter((l) => l.status === "Lost")
      .reduce((s, l) => s + (l.dealValue || 0), 0);

    return { name: member.name, Active: active, Won: won, Lost: lost };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Value</CardTitle>
        <CardDescription>Deal value by owner (₹)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#a3a3a3" }} />
            <Bar dataKey="Active" stackId="a" fill="#e87811" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Won" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Lost" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
