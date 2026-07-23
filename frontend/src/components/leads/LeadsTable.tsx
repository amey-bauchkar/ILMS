"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format, isBefore, startOfDay } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLeads, useStatuses, useTeamMembers, priorityColors, type EnrichedLead } from "@/hooks/use-data";
import { useUser } from "@/components/providers/user-provider";
import { Download } from "lucide-react";
import { avatarColor } from "@/lib/avatar-colors";
import LeadsFilterBar, { LeadFilters, emptyFilters } from "./LeadsFilterBar";
import LeadsMobileCard from "./LeadsMobileCard";
import { Loader2 } from "lucide-react";

type SavedView = "all" | "myOpen" | "overdue" | "hot" | "newWeek";
type SortKey = string;
const PAGE_SIZE = 20;

function applySavedView(leads: EnrichedLead[], view: SavedView, currentUserId?: string): EnrichedLead[] {
    const today = startOfDay(new Date());
    switch (view) {
        case "myOpen":
            return leads.filter(
                (l) =>
                    l.owner.id === currentUserId &&
                    !["Won", "Lost", "Junk"].includes(l.status)
            );
        case "overdue":
            return leads.filter(
                (l) => l.nextFollowUpDate && isBefore(new Date(l.nextFollowUpDate), today)
            );
        case "hot":
            return leads.filter((l) => l.priority === "Hot");
        case "newWeek": {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return leads.filter((l) => new Date(l.createdAt) >= weekAgo);
        }
        default:
            return leads;
    }
}

function applyFilters(leads: EnrichedLead[], f: LeadFilters): EnrichedLead[] {
    return leads.filter((l) => {
        if (f.search) {
            const q = f.search.toLowerCase();
            const match =
                l.name.toLowerCase().includes(q) ||
                (l.company ?? "").toLowerCase().includes(q) ||
                l.phone.toLowerCase().includes(q) ||
                (l.email ?? "").toLowerCase().includes(q);
            if (!match) return false;
        }
        if (f.statuses.length > 0 && !f.statuses.includes(l.status)) return false;
        if (f.sources.length > 0 && !f.sources.includes(l.source)) return false;
        if (f.ownerIds.length > 0 && !f.ownerIds.includes(l.owner.id)) return false;
        if (f.tags.length > 0 && !f.tags.some((t) => l.tags.includes(t))) return false;
        if (f.priority !== "All" && l.priority !== f.priority) return false;
        return true;
    });
}

function DotBadge({ color, label }: { color: string; label: string }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: `${color}1a`, color }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
            />
            {label}
        </span>
    );
}

const VIEWS: { key: SavedView; label: string }[] = [
    { key: "all", label: "All Leads" },
    { key: "myOpen", label: "My Open Leads" },
    { key: "overdue", label: "Overdue Follow-ups" },
    { key: "hot", label: "Hot Leads" },
    { key: "newWeek", label: "New This Week" },
];

export default function LeadsTable() {
    const { leads, loading, error, refresh } = useLeads();
    const { user } = useUser();
    const [view, setView] = useState<SavedView>("all");
    const [filters, setFilters] = useState<LeadFilters>(emptyFilters);
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortAsc, setSortAsc] = useState(false);
    const [page, setPage] = useState(1);

    const viewCounts = useMemo(() => {
        return {
            all: leads.length,
            myOpen: applySavedView(leads, "myOpen", user?.id).length,
            overdue: applySavedView(leads, "overdue", user?.id).length,
            hot: applySavedView(leads, "hot", user?.id).length,
            newWeek: applySavedView(leads, "newWeek", user?.id).length,
        };
    }, [leads, user?.id]);

    const filteredSorted = useMemo(() => {
        let result = applySavedView(leads, view, user?.id);
        result = applyFilters(result, filters);

        result = [...result].sort((a, b) => {
            let aVal: string | number = "";
            let bVal: string | number = "";

            if (sortKey === "ownerName") {
                aVal = a.owner.name;
                bVal = b.owner.name;
            } else {
                const av = (a as any)[sortKey];
                const bv = (b as any)[sortKey];
                aVal = av === null || av === undefined ? "" : av;
                bVal = bv === null || bv === undefined ? "" : bv;
            }

            if (aVal < bVal) return sortAsc ? -1 : 1;
            if (aVal > bVal) return sortAsc ? 1 : -1;
            return 0;
        });

        return result;
    }, [leads, view, filters, sortKey, sortAsc, user?.id]);

    const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
    const paginated = filteredSorted.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const SortableHead = ({
        label,
        sortField,
        align,
    }: {
        label: string;
        sortField: SortKey;
        align?: "right";
    }) => (
        <TableHead
            className={`cursor-pointer select-none text-xs uppercase tracking-wide text-[#737373] font-medium hover:text-white transition-colors ${align === "right" ? "text-right" : ""
                }`}
            onClick={() => toggleSort(sortField)}
        >
            {label}
            <span className="inline-block w-3 text-[#e87811]">
                {sortKey === sortField ? (sortAsc ? " ↑" : " ↓") : ""}
            </span>
        </TableHead>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading leads...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-destructive">Error loading leads: {error}</p>
                <Button variant="outline" className="mt-4" onClick={refresh}>Retry</Button>
            </div>
        );
    }

    return (
        <div>
            {/* Underline tabs and Export Button */}
            <div className="flex items-center justify-between border-b border-[#2e2e2e] mb-5">
                <div className="flex gap-6 overflow-x-auto">
                    {VIEWS.map((v) => (
                    <button
                        key={v.key}
                        onClick={() => {
                            setView(v.key);
                            setPage(1);
                        }}
                        className={`relative pb-3 text-sm whitespace-nowrap transition-colors ${view === v.key
                            ? "text-white font-medium"
                            : "text-[#a3a3a3] hover:text-white"
                            }`}
                    >
                        {v.label}
                        <span className="ml-1.5 text-xs text-[#737373]">
                            ({viewCounts[v.key]})
                        </span>
                        {view === v.key && (
                            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#e87811] rounded-full" />
                        )}
                    </button>
                ))}
                </div>
                
                {(user?.role === "admin" || user?.role === "client_manager") && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="mb-2 hidden sm:flex" 
                        onClick={() => window.location.href = "/api/export/leads"}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                )}
            </div>

            <LeadsFilterBar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />

            {/* Mobile view */}
            <div className="md:hidden">
                {paginated.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-[#a3a3a3] text-sm">No leads found.</p>
                        <p className="text-[#737373] text-xs mt-1">Try adjusting your filters.</p>
                    </div>
                ) : (
                    paginated.map((lead) => <LeadsMobileCard key={lead.id} lead={lead} />)
                )}
            </div>

            {/* Desktop / tablet view */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-[#2e2e2e] bg-[#0d0d0d]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-[#2e2e2e] hover:bg-transparent">
                            <SortableHead label="Lead Name" sortField="name" />
                            <SortableHead label="Company" sortField="company" />
                            <SortableHead label="Status" sortField="status" />
                            <SortableHead label="Priority" sortField="priority" />
                            <SortableHead label="Source" sortField="source" />
                            <SortableHead label="Owner" sortField="ownerName" />
                            <SortableHead label="Deal Value" sortField="dealValue" align="right" />
                            <SortableHead label="Next Follow-up" sortField="nextFollowUpDate" />
                            <SortableHead label="Last Contacted" sortField="lastContactedAt" />
                            <TableHead className="hidden lg:table-cell text-xs uppercase tracking-wide text-[#737373] font-medium">
                                Created
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-16">
                                    <p className="text-[#a3a3a3] text-sm">No leads found.</p>
                                    <p className="text-[#737373] text-xs mt-1">Try adjusting your filters.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginated.map((lead) => {
                                const isOverdue =
                                    lead.nextFollowUpDate &&
                                    isBefore(new Date(lead.nextFollowUpDate), startOfDay(new Date()));
                                const initials = lead.owner.name
                                    .split(" ")
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase();
                                const ownerColor = avatarColor(lead.owner.name);

                                return (
                                    <TableRow
                                        key={lead.id}
                                        className="border-b border-[#1f1f1f] hover:bg-[#161616] transition-colors"
                                    >
                                        <TableCell className="font-semibold py-3.5">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="hover:text-[#ff8c1a] transition-colors"
                                            >
                                                {lead.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-[#a3a3a3]">
                                            {lead.company ?? <span className="text-[#525252]">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <DotBadge color={lead.statusColor} label={lead.status} />
                                        </TableCell>
                                        <TableCell>
                                            <DotBadge color={priorityColors[lead.priority]} label={lead.priority} />
                                        </TableCell>
                                        <TableCell className="text-[#a3a3a3]">{lead.source}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                                                    style={{ backgroundColor: ownerColor }}
                                                >
                                                    {initials}
                                                </div>
                                                <span className="text-[#e5e5e5]">{lead.owner.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-[#e5e5e5]">
                                            {lead.dealValue
                                                ? `₹${lead.dealValue.toLocaleString("en-IN")}`
                                                : <span className="text-[#525252]">—</span>}
                                        </TableCell>
                                        <TableCell
                                            className={`tabular-nums ${isOverdue ? "text-[#ef4444] font-medium" : "text-[#a3a3a3]"}`}
                                        >
                                            {lead.nextFollowUpDate ?? <span className="text-[#525252]">—</span>}
                                        </TableCell>
                                        <TableCell className="text-[#737373] text-sm">
                                            {lead.lastContactedAt
                                                ? formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true })
                                                : <span className="text-[#525252]">—</span>}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-[#737373] text-sm">
                                            {format(new Date(lead.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-[#737373]">
                    {filteredSorted.length} leads · Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}