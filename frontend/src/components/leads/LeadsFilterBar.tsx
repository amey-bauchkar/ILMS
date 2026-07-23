"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Save, Bookmark } from "lucide-react";
import { useStatuses, useTeamMembers, useTags, useSavedViews } from "@/hooks/use-data";
import { saveView, deleteView } from "@/actions/views";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ALL_SOURCES = [
    "Reddit", "Google Business Profile", "Referral", "Website Inbound",
    "LinkedIn", "Cold Outreach", "WhatsApp", "Upwork", "Events", "Other",
];

export interface LeadFilters {
    search: string;
    statuses: string[];
    sources: string[];
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
    options: { value: string; label: string }[];
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
                            key={opt.value}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#262626] cursor-pointer text-sm"
                        >
                            <Checkbox
                                checked={selected.includes(opt.value)}
                                onCheckedChange={() => toggle(opt.value)}
                            />
                            {opt.label}
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
    const { statuses } = useStatuses();
    const { members } = useTeamMembers();
    const { tags } = useTags();
    const { views, refresh: refreshViews } = useSavedViews();

    const [isSavingView, setIsSavingView] = useState(false);
    const [newViewName, setNewViewName] = useState("");

    const handleSaveView = async () => {
        if (!newViewName.trim()) return;
        try {
            await saveView(newViewName, filters as any, false);
            setNewViewName("");
            setIsSavingView(false);
            refreshViews();
        } catch (err) {
            console.error("Failed to save view", err);
        }
    };

    const handleApplyView = (viewFilters: any) => {
        onChange(viewFilters as LeadFilters);
    };

    const statusColorMap: Record<string, string> = {};
    statuses.forEach((s) => { statusColorMap[s.name] = s.color; });

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
                    options={statuses.map((s) => ({ value: s.name, label: s.name }))}
                    selected={filters.statuses}
                    onChange={(vals) => onChange({ ...filters, statuses: vals })}
                />

                <MultiSelectDropdown
                    label="Source"
                    options={ALL_SOURCES.map((s) => ({ value: s, label: s }))}
                    selected={filters.sources}
                    onChange={(vals) => onChange({ ...filters, sources: vals })}
                />

                <MultiSelectDropdown
                    label="Owner"
                    options={members.map((m) => ({ value: m.id, label: m.name }))}
                    selected={filters.ownerIds}
                    onChange={(vals) => onChange({ ...filters, ownerIds: vals })}
                />

                <MultiSelectDropdown
                    label="Tags"
                    options={tags.map((t) => ({ value: t.name, label: t.name }))}
                    selected={filters.tags}
                    onChange={(vals) => onChange({ ...filters, tags: vals })}
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

                <div className="flex-1" />

                {/* Saved Views Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
                        <Bookmark className="w-4 h-4" />
                        My Views
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {views.length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">No saved views.</div>
                        ) : (
                            views.map((v) => (
                                <DropdownMenuItem 
                                    key={v.id} 
                                    onClick={() => handleApplyView(v.filters)}
                                    className="flex justify-between items-center"
                                >
                                    <span>{v.name}</span>
                                    <X 
                                        className="w-3 h-3 text-muted-foreground hover:text-destructive" 
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await deleteView(v.id);
                                            refreshViews();
                                        }}
                                    />
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Save Current View */}
                {hasActiveFilters && (
                    <Popover open={isSavingView} onOpenChange={setIsSavingView}>
                        <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 text-primary")}>
                            <Save className="w-4 h-4" />
                            Save View
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-64 p-3">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium">Save current filters</span>
                                <Input 
                                    placeholder="View Name" 
                                    value={newViewName} 
                                    onChange={(e) => setNewViewName(e.target.value)}
                                    className="h-8 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
                                />
                                <Button size="sm" onClick={handleSaveView}>Save</Button>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                            style={{ backgroundColor: statusColorMap[s] || "#737373", color: "#fff" }}
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