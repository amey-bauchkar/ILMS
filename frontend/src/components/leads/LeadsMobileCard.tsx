import Link from "next/link";
import { formatDistanceToNow, format, isBefore, startOfDay } from "date-fns";
import { priorityColors, type EnrichedLead } from "@/hooks/use-data";
import { avatarColor } from "@/lib/avatar-colors";
import { Pencil, Trash2 } from "lucide-react";

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

export default function LeadsMobileCard({ 
    lead, 
    onEdit,
    onDelete,
}: { 
    lead: EnrichedLead; 
    onEdit?: (lead: EnrichedLead) => void;
    onDelete?: (lead: EnrichedLead) => void;
}) {
    const isOverdue = lead.nextFollowUpDate && isBefore(new Date(lead.nextFollowUpDate), startOfDay(new Date()));
    const initials = lead.owner.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const ownerColor = avatarColor(lead.owner.name);

    return (
        <div className="block mb-3">
            <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all relative">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/leads/${lead.id}`} className="hover:text-primary transition-colors">
                        <h3 className="font-semibold text-foreground hover:text-primary text-base transition-colors">{lead.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <DotBadge color={lead.statusColor} label={lead.status} />
                        {onEdit && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEdit(lead);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                title="Edit Lead"
                            >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(lead);
                                }}
                                className="p-1.5 rounded-lg bg-secondary text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Delete Lead"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                {lead.company && <p className="text-sm text-muted-foreground mb-2">{lead.company}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <DotBadge color={priorityColors[lead.priority]} label={lead.priority} />
                    <span>{lead.source}</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ backgroundColor: ownerColor }}>{initials}</div>
                        <span className="text-foreground font-medium">{lead.owner.name}</span>
                    </div>
                </div>
                {lead.dealValue && (
                    <p className="text-sm text-foreground font-semibold mt-2 tabular-nums">₹{lead.dealValue.toLocaleString("en-IN")}</p>
                )}
                {lead.nextFollowUpDate && (
                    <p className={`text-xs mt-1.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        Follow-up: {(() => {
                            try {
                                let d: Date;
                                if (lead.nextFollowUpDate.length === 10 && !lead.nextFollowUpDate.includes("T")) {
                                    d = new Date(`${lead.nextFollowUpDate}T10:00:00`);
                                } else {
                                    d = new Date(lead.nextFollowUpDate);
                                }
                                if (isNaN(d.getTime())) return lead.nextFollowUpDate;
                                return format(d, "MMM d, yyyy · h:mm a");
                            } catch {
                                return lead.nextFollowUpDate;
                            }
                        })()}
                    </p>
                )}
                {lead.lastContactedAt && (
                    <p className="text-xs mt-1 text-muted-foreground">
                        Last Contacted: {lead.lastContactedAt.includes('T') ? format(new Date(lead.lastContactedAt), "MMM d, yyyy · h:mm a") : lead.lastContactedAt}
                    </p>
                )}
            </div>
        </div>
    );
}