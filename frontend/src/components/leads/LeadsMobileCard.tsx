"use client";

import Link from "next/link";
import { formatDistanceToNow, isBefore, startOfDay } from "date-fns";
import { priorityColors, type EnrichedLead } from "@/hooks/use-data";
import { avatarColor } from "@/lib/avatar-colors";

function DotBadge({ color, label }: { color: string; label: string }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: `${color}1a`, color }}
        >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {label}
        </span>
    );
}

export default function LeadsMobileCard({ lead }: { lead: EnrichedLead }) {
    const isOverdue = lead.nextFollowUpDate && isBefore(new Date(lead.nextFollowUpDate), startOfDay(new Date()));
    const initials = lead.owner.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const ownerColor = avatarColor(lead.owner.name);

    return (
        <Link href={`/leads/${lead.id}`} className="block mb-3">
            <div className="rounded-xl border border-[#2e2e2e] bg-[#0d0d0d] p-4 hover:bg-[#161616] transition-colors">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{lead.name}</h3>
                    <DotBadge color={lead.statusColor} label={lead.status} />
                </div>
                {lead.company && <p className="text-sm text-[#a3a3a3] mb-2">{lead.company}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373]">
                    <DotBadge color={priorityColors[lead.priority]} label={lead.priority} />
                    <span>{lead.source}</span>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: ownerColor }}>{initials}</div>
                        <span>{lead.owner.name}</span>
                    </div>
                </div>
                {lead.dealValue && (
                    <p className="text-sm text-[#e5e5e5] mt-2 tabular-nums">₹{lead.dealValue.toLocaleString("en-IN")}</p>
                )}
                {lead.nextFollowUpDate && (
                    <p className={`text-xs mt-1 ${isOverdue ? "text-[#ef4444]" : "text-[#737373]"}`}>
                        Follow-up: {lead.nextFollowUpDate}
                    </p>
                )}
            </div>
        </Link>
    );
}