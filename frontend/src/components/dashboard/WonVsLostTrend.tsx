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
import { mockLeads } from "@/lib/mock-data";

// Build monthly won/lost trend from mock data (last 6 months relative to 2026-07)
const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const MONTH_INDICES: Record<string, number> = {
  Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6,
};

function buildTrend() {
  const counts: Record<string, { won: number; lost: number }> = {};
  MONTHS.forEach((m) => (counts[m] = { won: 0, lost: 0 }));

  mockLeads.forEach((lead) => {
    const date = new Date(lead.createdAt);
    const monthIdx = date.getMonth(); // 0-indexed
    const monthName = MONTHS.find((m) => MONTH_INDICES[m] === monthIdx + 1);
    if (!monthName) return;

    if (lead.status === "Won") counts[monthName].won += 1;
    if (lead.status === "Lost") counts[monthName].lost += 1;
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

export function WonVsLostTrend() {
  const data = buildTrend();

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
