"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEAD_SOURCES } from "@/lib/validations";

export interface SourceCategory {
  category: string;
  sources: string[];
}

export const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    category: "Inbound, Directories & Outreach",
    sources: [
      "Just Dial",
      "Google My Business",
      "Google Business Profile",
      "Google Search / SEO",
      "Website Inbound",
      "Local Business",
      "Referral",
      "Cold Outreach",
      "Events / Conferences",
      "Clutch",
      "Other",
    ],
  },
  {
    category: "Social Media & Messaging",
    sources: [
      "LinkedIn",
      "Twitter / X",
      "Instagram",
      "Facebook",
      "YouTube",
      "Reddit",
      "WhatsApp",
      "Telegram",
      "Discord",
      "Threads",
    ],
  },
  {
    category: "Job Boards & Freelance",
    sources: [
      "Upwork",
      "Fiverr",
      "Freelancer",
      "Indeed",
      "Naukri",
      "Wellfound (AngelList)",
      "Glassdoor",
      "Internshala",
      "TopTal",
      "Guru",
      "PeoplePerHour",
      "Dribbble",
      "Behance",
    ],
  },
];

const SOURCE_ALIASES: Record<string, string[]> = {
  "Just Dial": ["justdial", "just dial", "jd", "just-dial"],
  "Google My Business": ["google", "gmb", "my business", "google map", "gmaps", "business listing"],
  "Google Business Profile": ["google", "gbp", "gmb", "business profile", "maps"],
  "Google Search / SEO": ["google", "search", "seo", "organic", "google search"],
  "Website Inbound": ["website", "site", "web", "inbound", "form", "landing page"],
  "LinkedIn": ["linkedin", "li", "linked in"],
  "Twitter / X": ["twitter", "x", "twt", "tweet"],
  "Instagram": ["instagram", "insta", "ig"],
  "Facebook": ["facebook", "fb", "meta"],
  "YouTube": ["youtube", "yt"],
  "Reddit": ["reddit"],
  "WhatsApp": ["whatsapp", "wa", "whats app"],
  "Telegram": ["telegram", "tg"],
  "Discord": ["discord", "dc"],
  "Threads": ["threads"],
  "Upwork": ["upwork"],
  "Fiverr": ["fiverr"],
  "Freelancer": ["freelancer"],
  "Indeed": ["indeed"],
  "Naukri": ["naukri"],
  "Wellfound (AngelList)": ["wellfound", "angel", "angellist", "angel list"],
  "Glassdoor": ["glassdoor"],
  "Internshala": ["internshala"],
  "TopTal": ["toptal"],
  "Guru": ["guru"],
  "PeoplePerHour": ["peopleperhour", "pph"],
  "Local Business": ["local", "offline", "walkin", "store", "shop"],
  "Referral": ["referral", "ref", "word of mouth", "recommendation", "client"],
  "Cold Outreach": ["cold", "outreach", "email", "cold call", "dm"],
  "Events / Conferences": ["event", "events", "conference", "expo", "meetup", "summit"],
  "Clutch": ["clutch"],
  "Dribbble": ["dribbble"],
  "Behance": ["behance"],
  "Other": ["other", "custom", "misc"],
};

function matchesSource(sourceName: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const s = sourceName.toLowerCase();

  // Exact substring
  if (s.includes(q)) return true;

  // Normalized alphanumeric (ignoring spaces, dashes, slashes, parens)
  const normQ = q.replace(/[^a-z0-9]/g, "");
  const normS = s.replace(/[^a-z0-9]/g, "");
  if (normQ.length > 0 && normS.includes(normQ)) return true;

  // Alias lookup
  const aliases = SOURCE_ALIASES[sourceName] || [];
  return aliases.some((alias) => {
    const normAlias = alias.replace(/[^a-z0-9]/g, "");
    return normAlias.includes(normQ) || (normQ.length > 1 && alias.includes(q));
  });
}

interface SourceComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SourceCombobox({
  value,
  onChange,
  disabled,
  className,
}: SourceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [open]);

  // Filter sources based on query
  const filteredCategories = useMemo(() => {
    return SOURCE_CATEGORIES.map((cat) => ({
      category: cat.category,
      sources: cat.sources.filter((s) => matchesSource(s, search)),
    })).filter((cat) => cat.sources.length > 0);
  }, [search]);

  // Flat list of all matches for quick Enter key selection
  const allFilteredSources = useMemo(() => {
    return filteredCategories.flatMap((cat) => cat.sources);
  }, [filteredCategories]);

  const handleSelect = (selectedSource: string) => {
    onChange(selectedSource);
    setOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (allFilteredSources.length > 0) {
        handleSelect(allFilteredSources[0]);
      } else if (search.trim()) {
        handleSelect(search.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const displayValue = value || "Select a source";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground text-left",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionAvoidance={{ side: "none" }}
        className="w-[var(--anchor-width)] min-w-[300px] max-w-[calc(100vw-2rem)] p-0 shadow-2xl border-border bg-popover/95 backdrop-blur-md rounded-xl overflow-hidden"
      >
        {/* Search Input Box */}
        <div className="relative border-b border-border p-2.5 bg-secondary/30">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search (e.g. Just dial, GMB)..."
            className="w-full bg-background border border-input rounded-lg pl-8.5 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-4.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sources List */}
        <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-3">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.category}
                </div>
                <div className="space-y-0.5">
                  {group.sources.map((source) => {
                    const isSelected = value === source;
                    return (
                      <button
                        key={source}
                        type="button"
                        onClick={() => handleSelect(source)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm text-left transition-colors",
                          isSelected
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <span className="truncate">{source}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No standard source matching <span className="font-medium text-foreground">&quot;{search}&quot;</span>
              </p>
              {search.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full gap-1.5 text-xs border-dashed border-primary/40 hover:border-primary text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Use &quot;{search.trim()}&quot; as source
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Footer */}
        {search.trim() && allFilteredSources.length > 0 && (
          <div className="p-2 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-foreground font-mono">Enter ↵</kbd> to select <span className="text-foreground font-medium">{allFilteredSources[0]}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
