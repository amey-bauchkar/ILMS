"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnrichedLead, useTeamMembers } from "@/hooks/use-data";
import { Users } from "lucide-react";
import { avatarColor } from "@/lib/avatar-colors";
import { DateFilter, CustomDateRange, isWithinFilter } from "@/lib/utils";

interface TeamLeaderboardProps {
  leads: EnrichedLead[];
  dateFilter?: DateFilter;
  customRange?: CustomDateRange;
}

export function TeamLeaderboard({ leads, dateFilter = "month", customRange }: TeamLeaderboardProps) {
  const { members } = useTeamMembers();
  const filteredLeads = leads.filter(l => isWithinFilter(l.createdAt, dateFilter, customRange));

  // Build employee directory with performance stats
  const employeeMap = new Map<string, {
    id: string;
    name: string;
    role: string;
    won: number;
    pipeline: number;
    revenue: number;
    total: number;
  }>();

  // 1. Seed all active team members from the DB so all employees appear
  members.forEach((m) => {
    const key = m.name.toLowerCase().trim();
    employeeMap.set(key, {
      id: m.id,
      name: m.name,
      role: m.role || "Member",
      won: 0,
      pipeline: 0,
      revenue: 0,
      total: 0,
    });
  });

  // 2. Also ensure any lead owners not already in members are included (except Unassigned)
  filteredLeads.forEach((l) => {
    if (!l.owner?.name || l.owner.name === "Unassigned") return;
    const key = l.owner.name.toLowerCase().trim();
    if (!employeeMap.has(key)) {
      employeeMap.set(key, {
        id: l.owner.id || key,
        name: l.owner.name,
        role: l.owner.role || "Member",
        won: 0,
        pipeline: 0,
        revenue: 0,
        total: 0,
      });
    }

    const emp = employeeMap.get(key)!;
    emp.total += 1;
    if (l.status === "Won") {
      emp.won += 1;
      emp.revenue += l.dealValue || 0;
    } else if (!["Lost", "Junk"].includes(l.status)) {
      emp.pipeline += 1;
    }
  });

  // Sort employees alphabetically by name instead of ranking
  const employeeList = Array.from(employeeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Overview of all employees and active leads</CardDescription>
            </div>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/50 border border-border/40">
            {employeeList.length} {employeeList.length === 1 ? "Employee" : "Employees"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {employeeList.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No team members found.
          </div>
        ) : (
          <div className="space-y-2">
            {employeeList.map((entry) => {
              const dName = entry.name;
              const cleanName = dName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
              const initials = (cleanName || dName)
                .split(/\s+/)
                .filter(Boolean)
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const color = avatarColor(dName);

              return (
                <div
                  key={entry.id || entry.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{dName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {entry.role.replace(/_/g, " ")}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center min-w-[36px]">
                      <p className="text-sm font-bold text-green-500 tabular-nums">
                        {entry.won}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Won</p>
                    </div>
                    <div className="text-center min-w-[36px]">
                      <p className="text-sm font-bold text-primary tabular-nums">
                        {entry.pipeline}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center min-w-[48px] hidden sm:block">
                      <p className="text-sm font-bold text-zinc-200 tabular-nums">
                        ₹{(entry.revenue / 1000).toFixed(0)}K
                      </p>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
