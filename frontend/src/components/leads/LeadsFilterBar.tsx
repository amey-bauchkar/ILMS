"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
    LeadStatus,
    LeadSource,
    mockTeamMembers,
    mockLeads,
    statusColors,
} from "@/lib/mock-data";

// Collect all unique tags from leads for the tag filter dropdown
const ALL_TAGS = Array.from(new Set(mockLeads.flatMap((l) => l.tags))).sort();

const ALL_STATUSES: LeadStatus[] = [
    "New", "Attempted Contact", "Contacted", "Qualified", "Proposal Sent",
    "Negotiation", "Won", "Lost", "On Hold", "Junk",
];

const ALL_SOURCES: LeadSource[] = [
    "Reddit", "Google Business Profile", "Referral", "Website Inbound",
    "LinkedIn", "Cold Outreach", "WhatsApp", "Upwork", "Events", "Other",
];

export interface LeadFilters {
    search: string;
    statuses: LeadStatus[];
    sources: LeadSource[];
    ownerIds: string[];
    tags: string[];
    priority: "Hot" | "Warm" | "Cold" | "All";
}

export const emptyFilters: LeadFilters = {
    search: "",
    statuses: [],
    sources: [],
    ownerIds: [],
    tags: [],
    priority: "All",
};

function MultiSelectDropdown({
    label,
    options,
    selected,
    onChange,
}: {
    label: string;
    options: string[];
    selected: string[];
    onChange: (vals: string[]) => void;
}) {
    const toggle = (val: string) => {
        if (selected.includes(val)) {
            onChange(selected.filter((v) => v !== val));
        } else {
            onChange([...selected, val]);
        }
    };

    return (
        <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" />}>
                {label} {selected.length > 0 ? `(${selected.length})` : ""}
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {options.map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#262626] cursor-pointer text-sm"
                        >
                            <Checkbox
                                checked={selected.includes(opt)}
                                onCheckedChange={() => toggle(opt)}
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function LeadsFilterBar({
    filters,
    onChange,
}: {
    filters: LeadFilters;
    onChange: (f: LeadFilters) => void;
}) {
    const hasActiveFilters =
        filters.search !== "" ||
        filters.statuses.length > 0 ||
        filters.sources.length > 0 ||
        filters.ownerIds.length > 0 ||
        filters.tags.length > 0 ||
        filters.priority !== "All";

    return (
        <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Search by name, company, phone, or email..."
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    className="max-w-xs"
                />

                <MultiSelectDropdown
                    label="Status"
                    options={ALL_STATUSES}
                    selected={filters.statuses}
                    onChange={(vals) =>
                        onChange({ ...filters, statuses: vals as LeadStatus[] })
                    }
                />

                <MultiSelectDropdown
                    label="Source"
                    options={ALL_SOURCES}
                    selected={filters.sources}
                    onChange={(vals) =>
                        onChange({ ...filters, sources: vals as LeadSource[] })
                    }
                />

                <MultiSelectDropdown
                    label="Owner"
                    options={mockTeamMembers.map((m) => m.name)}
                    selected={mockTeamMembers
                        .filter((m) => filters.ownerIds.includes(m.id))
                        .map((m) => m.name)}
                    onChange={(names) => {
                        const ids = mockTeamMembers
                            .filter((m) => names.includes(m.name))
                            .map((m) => m.id);
                        onChange({ ...filters, ownerIds: ids });
                    }}
                />

                <MultiSelectDropdown
                    label="Tags"
                    options={ALL_TAGS}
                    selected={filters.tags}
                    onChange={(vals) =>
                        onChange({ ...filters, tags: vals })
                    }
                />

                <div className="flex gap-1">
                    {(["All", "Hot", "Warm", "Cold"] as const).map((p) => (
                        <Button
                            key={p}
                            size="sm"
                            variant={filters.priority === p ? "default" : "outline"}
                            onClick={() => onChange({ ...filters, priority: p })}
                        >
                            {p}
                        </Button>
                    ))}
                </div>

                {hasActiveFilters && (
                    <Button size="sm" variant="ghost" onClick={() => onChange(emptyFilters)}>
                        Clear All
                    </Button>
                )}
            </div>

            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.search && (
                        <Badge variant="secondary" className="gap-1">
                            Search: {filters.search}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => onChange({ ...filters, search: "" })}
                            />
                        </Badge>
                    )}
                    {filters.statuses.map((s) => (
                        <Badge
                            key={s}
                            style={{ backgroundColor: statusColors[s], color: "#fff" }}
                            className="gap-1"
                        >
                            {s}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() =>
                                    onChange({
                                        ...filters,
                                        statuses: filters.statuses.filter((x) => x !== s),
                                    })
                                }
                            />
                        </Badge>
                    ))}
                    {filters.sources.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() =>
                                    onChange({
                                        ...filters,
                                        sources: filters.sources.filter((x) => x !== s),
                                    })
                                }
                            />
                        </Badge>
                    ))}
                    {filters.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1">
                            Tag: {t}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() =>
                                    onChange({
                                        ...filters,
                                        tags: filters.tags.filter((x) => x !== t),
                                    })
                                }
                            />
                        </Badge>
                    ))}
                    {filters.priority !== "All" && (
                        <Badge variant="secondary" className="gap-1">
                            Priority: {filters.priority}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => onChange({ ...filters, priority: "All" })}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}