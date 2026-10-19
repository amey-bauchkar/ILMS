"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Focus search input when opening
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
    <div ref={containerRef} className={cn("relative w-full", open ? "z-[100]" : "z-auto")}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-black/[0.12] dark:border-white/20 bg-white dark:bg-white/[0.05] px-3.5 py-2 text-sm shadow-xs transition-all hover:border-black/25 dark:hover:border-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111318] dark:focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 text-[#111318] dark:text-white text-left",
          !value && "text-zinc-400",
          open && "border-[#111318] dark:border-primary/60",
          className
        )}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
            open && "rotate-180 text-[#111318] dark:text-white"
          )}
        />
      </button>

      {/* Downward Dropdown Menu */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-full max-w-full z-[100] rounded-2xl border border-black/10 dark:border-white/20 bg-white dark:bg-[#121319] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 text-[#111318] dark:text-white"
          style={{ transformOrigin: "top center" }}
        >
          {/* Search Input Box */}
          <div className="relative border-b border-black/[0.08] dark:border-white/10 p-2.5 bg-[#f8fafc] dark:bg-white/[0.02]">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search (e.g. Just dial, GMB)..."
              className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.12] dark:border-white/15 rounded-xl pl-8.5 pr-8 py-2 text-sm text-[#111318] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#111318] dark:focus:border-primary shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-[#111318] dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sources List */}
          <div className="max-h-[260px] overflow-y-auto p-2 space-y-3">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((group) => (
                <div key={group.category} className="space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
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
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition-colors",
                            isSelected
                              ? "bg-[#c8f237]/25 text-[#111318] font-bold border border-[#a3e635]"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-[#111318] dark:hover:text-white"
                          )}
                        >
                          <span className="truncate">{source}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-[#15803d] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  No standard source matching <span className="font-semibold text-[#111318] dark:text-white">&quot;{search}&quot;</span>
                </p>
                {search.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelect(search.trim())}
                    className="w-full gap-1.5 text-xs border-dashed border-[#15803d]/40 dark:border-primary/40 hover:border-[#15803d] text-[#15803d] dark:text-primary bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-xl font-medium"
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
            <div className="p-2.5 border-t border-black/[0.08] dark:border-white/10 bg-[#f8fafc] dark:bg-white/[0.02] text-[11px] text-zinc-600 dark:text-zinc-400 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/[0.08] border border-black/10 dark:border-white/15 text-[#111318] dark:text-white font-mono text-[10px]">Enter ↵</kbd> to select <span className="text-[#111318] dark:text-white font-semibold">{allFilteredSources[0]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
