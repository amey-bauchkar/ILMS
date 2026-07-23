"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnrichedLead } from "@/hooks/use-data";

function buildTrend(leads: EnrichedLead[]) {
  const counts: Record<string, { won: number; lost: number }> = {};
  const MONTHS: string[] = [];
  
  // Build the last 6 months dynamically
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const dTemp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const mStr = dTemp.toLocaleString('default', { month: 'short' });
    MONTHS.push(mStr);
    counts[mStr] = { won: 0, lost: 0 };
  }

  leads.forEach((lead) => {
    const date = new Date(lead.createdAt);
    const mStr = date.toLocaleString('default', { month: 'short' });
    
    // Only tally if it's within our last 6 months window
    if (counts[mStr]) {
      if (lead.status === "Won") counts[mStr].won += 1;
      if (lead.status === "Lost") counts[mStr].lost += 1;
    }
  });

  return MONTHS.map((m) => ({ month: m, Won: counts[m].won, Lost: counts[m].lost }));
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg space-y-1">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function WonVsLostTrend({ leads }: { leads: EnrichedLead[] }) {
  const data = buildTrend(leads);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Won vs Lost Trend</CardTitle>
        <CardDescription>Monthly closed deal outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#a3a3a3" }} />
            <Line
              type="monotone"
              dataKey="Won"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: "#22c55e" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Lost"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4, fill: "#ef4444" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
