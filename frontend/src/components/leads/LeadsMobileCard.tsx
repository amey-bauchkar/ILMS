"use client";

import Link from "next/link";
import { Lead, statusColors, priorityColors } from "@/lib/mock-data";

export default function LeadsMobileCard({ lead }: { lead: Lead }) {
    const isOverdue =
        lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < new Date();

    return (
        <Link
            href={`/leads/${lead.id}`}
            className="block bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-4 mb-3 active:bg-[#262626]"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-white">{lead.name}</span>
                <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                        backgroundColor: priorityColors[lead.priority],
                        color: "#fff",
                    }}
                >
                    {lead.priority}
                </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: statusColors[lead.status], color: "#fff" }}
                >
                    {lead.status}
                </span>
            </div>

            <div className="flex justify-between items-center text-sm text-[#a3a3a3]">
                <span>{lead.owner.name}</span>
                {lead.nextFollowUpDate && (
                    <span className={isOverdue ? "text-[#ef4444]" : ""}>
                        Next: {lead.nextFollowUpDate}
                    </span>
                )}
            </div>
        </Link>
    );
}