"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockLeads, LeadSource } from "@/lib/mock-data";
import { TrendingUp } from "lucide-react";

import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

const SOURCES: LeadSource[] = [
  "Website Inbound", "Referral", "LinkedIn", "Cold Outreach",
  "Google Business Profile", "WhatsApp", "Events", "Reddit",
];

interface ConversionRateProps {
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function ConversionRate({ dateFilter = "month", customRange }: ConversionRateProps) {
  const filteredLeads = mockLeads.filter(l => isWithinFilter(l.createdAt, dateFilter, customRange));
  const total = filteredLeads.length;
  const won = filteredLeads.filter((l) => l.status === "Won").length;
  const overallRate = total > 0 ? Math.round((won / total) * 100) : 0;

  const sourceBreakdown = SOURCES.map((source) => {
    const sourceLeads = filteredLeads.filter((l) => l.source === source);
    const sourceWon = sourceLeads.filter((l) => l.status === "Won").length;
    const rate = sourceLeads.length > 0 ? Math.round((sourceWon / sourceLeads.length) * 100) : 0;
    return { source, total: sourceLeads.length, won: sourceWon, rate };
  }).filter((s) => s.total > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-500/10 rounded-md">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Won leads vs. total</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall rate */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/40 border border-border/50">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color: "#22c55e" }}
          >
            {overallRate}%
          </span>
          <div>
            <p className="text-sm font-medium">Overall Win Rate</p>
            <p className="text-xs text-muted-foreground">{won} won of {total} total leads</p>
          </div>
        </div>

        {/* By source */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Source</p>
          {sourceBreakdown.map(({ source, rate, won: w, total: t }) => (
            <div key={source} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground truncate max-w-[140px]">{source}</span>
                <span className="text-muted-foreground tabular-nums">
                  {w}/{t} · {rate}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${rate}%`,
                    backgroundColor: rate >= 50 ? "#22c55e" : rate >= 25 ? "#e87811" : "#3b82f6",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
