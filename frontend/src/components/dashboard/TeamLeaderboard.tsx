"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockLeads, mockTeamMembers } from "@/lib/mock-data";
import { Trophy } from "lucide-react";
import { avatarColor } from "@/lib/avatar-colors";

export function TeamLeaderboard() {
  const leaderboard = mockTeamMembers
    .map((member) => {
      const memberLeads = mockLeads.filter((l) => l.owner.id === member.id);
      const won = memberLeads.filter((l) => l.status === "Won").length;
      const pipeline = memberLeads
        .filter((l) => !["Won", "Lost", "Junk"].includes(l.status))
        .length;
      const revenue = memberLeads
        .filter((l) => l.status === "Won")
        .reduce((s, l) => s + (l.dealValue || 0), 0);

      return { member, won, pipeline, revenue, total: memberLeads.length };
    })
    .sort((a, b) => b.won - a.won || b.revenue - a.revenue);

  const rankColors = ["#eab308", "#a3a3a3", "#e87811"];
  const rankLabels = ["🥇", "🥈", "🥉"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/10 rounded-md">
            <Trophy className="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <CardTitle>Team Leaderboard</CardTitle>
            <CardDescription>Ranked by closed deals</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const initials = entry.member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const color = avatarColor(entry.member.name);

            return (
              <div
                key={entry.member.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                {/* Rank */}
                <span className="text-lg w-6 text-center shrink-0">
                  {idx < 3 ? rankLabels[idx] : `#${idx + 1}`}
                </span>

                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.member.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.member.role}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "#22c55e" }}>
                      {entry.won}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Won</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">{entry.pipeline}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold" style={{ color: rankColors[idx] ?? "#ffffff" }}>
                      ₹{(entry.revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
