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
import { EnrichedLead } from "@/hooks/use-data";
import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

const SOURCE_COLORS: Record<string, string> = {
  "LinkedIn": "#0a66c2",
  "Twitter / X": "#1da1f2",
  "Instagram": "#e1306c",
  "Facebook": "#1877f2",
  "YouTube": "#ff0000",
  "Reddit": "#ff4500",
  "WhatsApp": "#25d366",
  "Telegram": "#0088cc",
  "Discord": "#5865f2",
  "Threads": "#101010",
  "Upwork": "#14a800",
  "Fiverr": "#1dbf73",
  "Freelancer": "#29b2fe",
  "Indeed": "#2164f3",
  "Naukri": "#0090e8",
  "Wellfound (AngelList)": "#f43f5e",
  "Glassdoor": "#0caa41",
  "Internshala": "#00a5ec",
  "TopTal": "#204ecf",
  "Guru": "#4b5563",
  "PeoplePerHour": "#ff6f00",
  "Website Inbound": "#e87811",
  "Google Search / SEO": "#4285f4",
  "Google My Business": "#34a853",
  "Google Business Profile": "#34a853",
  "Just Dial": "#ff5200",
  "Local Business": "#059669",
  "Referral": "#22c55e",
  "Cold Outreach": "#8b5cf6",
  "Events / Conferences": "#eab308",
  "Clutch": "#1e394b",
  "Dribbble": "#ea4c89",
  "Behance": "#053eff",
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
  leads: EnrichedLead[];
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function LeadsBySource({ leads, dateFilter = "month", customRange }: LeadsBySourceProps) {
  const filteredLeads = leads.filter(l => isWithinFilter(l.createdAt, dateFilter, customRange));

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
                  fill={SOURCE_COLORS[entry.name] ?? "#737373"}
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
