"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { 
  MapPin, 
  Search, 
  X, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft, 
  Building2, 
  Compass, 
  Globe2, 
  Train, 
  Plus, 
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  COUNTRIES_DATA, 
  POPULAR_COUNTRIES, 
  searchLocations, 
  CountryData, 
  StateData, 
  LocationSearchResult 
} from "@/lib/location-data";

export const QUICK_LOCATION_TAGS = [
  { name: "Mumbai", formatted: "Mumbai, Maharashtra, India", flag: "🇮🇳" },
  { name: "Thane", formatted: "Thane, Maharashtra, India", flag: "🇮🇳" },
  { name: "Navi Mumbai", formatted: "Navi Mumbai, Maharashtra, India", flag: "🇮🇳" },
  { name: "Pune", formatted: "Pune, Maharashtra, India", flag: "🇮🇳" },
  { name: "Delhi NCR", formatted: "Delhi, Delhi NCR, India", flag: "🇮🇳" },
  { name: "Bengaluru", formatted: "Bengaluru, Karnataka, India", flag: "🇮🇳" },
  { name: "Hyderabad", formatted: "Hyderabad, Telangana, India", flag: "🇮🇳" },
  { name: "Ahmedabad", formatted: "Ahmedabad, Gujarat, India", flag: "🇮🇳" },
  { name: "Dubai", formatted: "Dubai, United Arab Emirates", flag: "🇦🇪" },
  { name: "London", formatted: "Greater London, United Kingdom", flag: "🇬🇧" },
  { name: "USA", formatted: "United States", flag: "🇺🇸" },
];

interface LocationComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  defaultOpen?: boolean;
}

type ViewMode = "search" | "browse-country" | "browse-state" | "browse-station";

export function LocationCombobox({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select location (Country, State, Station)...",
  defaultOpen = false,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("openLoc") === "1") {
      setOpen(true);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "hierarchy">("search");
  
  // Hierarchy drill-down states
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Reset drill-down if opened fresh without previous state
  const handleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  // Perform search across all dataset
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchLocations(searchQuery, 40);
  }, [searchQuery]);

  // Filtered Countries list
  const filteredCountries = useMemo(() => {
    if (!countryFilter.trim()) return COUNTRIES_DATA;
    const q = countryFilter.trim().toLowerCase();
    return COUNTRIES_DATA.filter((c) => 
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countryFilter]);

  // Filtered States list for currently selected country
  const filteredStates = useMemo(() => {
    if (!selectedCountry) return [];
    if (!stateFilter.trim()) return selectedCountry.states;
    const q = stateFilter.trim().toLowerCase();
    return selectedCountry.states.filter((s) => s.name.toLowerCase().includes(q));
  }, [selectedCountry, stateFilter]);

  // Filtered Stations list for currently selected state
  const filteredStations = useMemo(() => {
    if (!selectedState) return [];
    if (!stationFilter.trim()) return selectedState.stations;
    const q = stationFilter.trim().toLowerCase();
    return selectedState.stations.filter((st) => st.toLowerCase().includes(q));
  }, [selectedState, stationFilter]);

  // Handle final selection
  const handleSelectLocation = (formattedLocation: string) => {
    onChange(formattedLocation);
    setOpen(false);
    setSearchQuery("");
  };

  // Clear current location
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Trigger search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectLocation(searchResults[0].formatted);
      } else if (searchQuery.trim()) {
        handleSelectLocation(searchQuery.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Quick select helper from popular pills
  const handleSelectPopularCountry = (countryName: string) => {
    const found = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === countryName.toLowerCase());
    if (found) {
      setSelectedCountry(found);
      setSelectedState(null);
      setActiveTab("hierarchy");
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div ref={containerRef} className={cn("relative w-full", open ? "z-[100]" : "z-auto")}>
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleOpen}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-black/[0.12] dark:border-white/20 bg-white dark:bg-white/[0.05] px-3.5 py-2 text-sm shadow-xs transition-all hover:border-black/25 dark:hover:border-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111318] dark:focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 text-[#111318] dark:text-white text-left",
            !value && "text-zinc-400",
            open && "border-[#111318] dark:border-primary/60"
          )}
        >
        <div className="flex items-center gap-2.5 truncate">
          <MapPin className={cn("h-4 w-4 shrink-0", value ? "text-[#15803d]" : "text-zinc-400")} />
          <span className="truncate">{value || placeholder}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              title="Clear location"
              className="p-1 rounded-full text-zinc-400 hover:text-[#111318] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </div>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-500 transition-transform duration-200",
              open && "rotate-180 text-[#111318] dark:text-white"
            )}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-full z-[120] rounded-2xl border border-black/10 dark:border-white/20 bg-white dark:bg-[#121319] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 text-[#111318] dark:text-white flex flex-col max-h-[460px]"
          style={{ transformOrigin: "top center" }}
        >
          {/* Mode Switcher Tabs */}
          <div className="p-2 border-b border-black/[0.08] dark:border-white/10 bg-[#f8fafc] dark:bg-white/[0.02] flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-xs",
                  activeTab === "search"
                    ? "bg-[#c8f237] text-[#111318] border border-black/10 shadow-xs font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-[#111318] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                )}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Global Search</span>
                {searchQuery.trim() && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-black/10 font-bold text-[#111318]">
                    {searchResults.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("hierarchy")}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-xs",
                  activeTab === "hierarchy"
                    ? "bg-[#c8f237] text-[#111318] border border-black/10 shadow-xs font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-[#111318] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                )}
              >
                <Globe2 className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Browse Country ➔ State ➔ Station</span>
                <span className="sm:hidden">Browse</span>
              </button>
            </div>

            {value && (
              <button
                type="button"
                onClick={() => handleSelectLocation(value)}
                className="text-[11px] text-[#15803d] hover:underline font-semibold hidden sm:inline-block truncate max-w-[140px] shrink-0"
                title={`Current: ${value}`}
              >
                Current: {value}
              </button>
            )}
          </div>

          {/* TAB 1: REAL-TIME GLOBAL SEARCH VIEW */}
          {activeTab === "search" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Search Bar with Dedicated Search Button */}
              <div className="p-2.5 border-b border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search station, city, state, country..."
                      className="w-full bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.12] dark:border-white/15 rounded-xl pl-8.5 pr-7 py-1.5 text-xs sm:text-sm text-[#111318] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#111318] dark:focus:border-primary shadow-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-[#111318] dark:hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => {
                      if (searchResults.length > 0) {
                        handleSelectLocation(searchResults[0].formatted);
                      } else if (searchQuery.trim()) {
                        handleSelectLocation(searchQuery.trim());
                      }
                    }}
                    className="h-8.5 px-3 gap-1.5 font-bold shrink-0 rounded-xl bg-[#c8f237] hover:bg-[#b5e028] text-[#111318] border border-black/10 text-xs shadow-xs"
                  >
                    <Search className="h-3 w-3" />
                    <span>Search</span>
                  </Button>
                </div>

                {/* Quick Filter Tags within search popup */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 pb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 flex items-center gap-1">
                    <Compass className="h-3 w-3 text-[#15803d]" /> Filter Tags:
                  </span>
                  {QUICK_LOCATION_TAGS.map((tag) => {
                    const isSelected = searchQuery.toLowerCase() === tag.name.toLowerCase();
                    return (
                      <button
                        key={`search-tag-${tag.name}`}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag.name);
                          searchInputRef.current?.focus();
                        }}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-lg border transition-all shrink-0 flex items-center gap-1 active:scale-95",
                          isSelected
                            ? "bg-[#c8f237] text-[#111318] border-black/10 shadow-xs font-bold"
                            : "bg-[#f8fafc] dark:bg-white/[0.05] border-black/[0.08] dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-[#edf2f7] hover:text-[#111318]"
                        )}
                      >
                        <span>{tag.flag}</span>
                        <span>{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Results / Default suggestions */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px]">
                {searchQuery.trim() ? (
                  <>
                    {/* Custom query shortcut */}
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(searchQuery.trim())}
                        className="w-full flex items-center justify-between p-2 rounded-xl border border-dashed border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary truncate">
                              Use custom location: &quot;{searchQuery.trim()}&quot;
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              Click to save this exact text as location
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-primary/70 shrink-0" />
                      </button>
                    </div>

                    {/* Search Results List */}
                    {searchResults.length > 0 ? (
                      <div className="space-y-1">
                        <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                          <span>Matching Stations & Cities ({searchResults.length})</span>
                          <span className="text-[9px] lowercase text-zinc-500 font-normal">
                            Enter to pick top
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          {searchResults.map((item, idx) => {
                            const isSelected = value === item.formatted;
                            return (
                              <button
                                key={`sr-${item.formatted}-${idx}`}
                                type="button"
                                onClick={() => handleSelectLocation(item.formatted)}
                                className={cn(
                                  "w-full flex items-start justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors group",
                                  isSelected
                                    ? "bg-[#c8f237]/20 text-[#111318] dark:text-white font-medium border border-[#c8f237]/50"
                                    : "text-[#111318] dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                                )}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="text-base shrink-0">{item.flag}</span>
                                  <div>
                                    <div className="flex items-center gap-1.5 font-semibold text-[#111318] dark:text-white group-hover:text-[#15803d] dark:group-hover:text-primary">
                                      <Train className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                      <span>{item.station}</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                      {item.state && <span>{item.state}, </span>}
                                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">{item.country}</span>
                                    </div>
                                  </div>
                                </div>

                                {isSelected ? (
                                  <Check className="h-4 w-4 text-[#15803d] dark:text-primary shrink-0 ml-2 mt-1" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-[#111318] dark:group-hover:text-white shrink-0 ml-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/[0.05] flex items-center justify-center mx-auto text-zinc-500 dark:text-zinc-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-[#111318] dark:text-white">
                          No standard station matching &quot;{searchQuery}&quot;
                        </p>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
                          Click &quot;Use custom location&quot; above to use this, or browse by country ➔ state.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty search default suggestions */
                  <div className="space-y-3.5 p-1">
                    {/* Popular Country Quick Picks */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 px-1">
                        Popular Countries
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_COUNTRIES.map((cName, idx) => {
                          const country = COUNTRIES_DATA.find((c) => c.name === cName);
                          return (
                            <button
                              key={`pop-${cName}-${idx}`}
                              type="button"
                              onClick={() => handleSelectPopularCountry(cName)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-black/[0.08] dark:border-white/10 bg-[#f8fafc] dark:bg-white/[0.04] hover:border-[#111318] dark:hover:border-primary hover:bg-white dark:hover:bg-primary/10 text-[#111318] dark:text-zinc-200 font-semibold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                            >
                              <span>{country?.flag}</span>
                              <span>{cName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Frequently Selected Key Stations */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 px-1">
                        Featured Commercial Hubs & Stations
                      </p>
                      <div className="space-y-1">
                        {[
                          { name: "Andheri East (MIDC / SEEPZ), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Andheri West (Lokhandwala / Versova), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Bandra West (Linking Rd / Bandstand), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Bandra East (BKC / Kalanagar), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Dadar West (Shivaji Park), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Borivali West (IC Colony), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Thane West (Ghodbunder Road), Thane, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Cyber City, Gurugram, Delhi NCR, India", flag: "🇮🇳" },
                          { name: "Whitefield, Bengaluru, Karnataka, India", flag: "🇮🇳" },
                          { name: "Hinjewadi IT Park, Pune, Maharashtra, India", flag: "🇮🇳" },
                          { name: "Dubai Marina, Dubai, United Arab Emirates", flag: "🇦🇪" },
                          { name: "London King's Cross, Greater London, United Kingdom", flag: "🇬🇧" },
                        ].map((item, idx) => (
                          <button
                            key={`feat-${item.name}-${idx}`}
                            type="button"
                            onClick={() => handleSelectLocation(item.name)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors border border-black/[0.06] dark:border-white/10 bg-[#f8fafc]/70 dark:bg-white/[0.03] text-[#111318] dark:text-zinc-200 group active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                              <span className="text-sm shrink-0">{item.flag}</span>
                              <span className="truncate font-semibold text-[#111318] dark:text-white group-hover:text-[#15803d] dark:group-hover:text-primary">{item.name}</span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-[#111318] dark:group-hover:text-white shrink-0 ml-1.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CASCADING HIERARCHY (Country ➔ State ➔ Station) */}
          {activeTab === "hierarchy" && (
            <div className="flex flex-col flex-1 min-h-0 p-2 space-y-2">
              {/* STEP 1: PICK COUNTRY */}
              {!selectedCountry && (
                <div className="flex flex-col flex-1 min-h-0 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#111318] dark:text-white">
                      <Globe2 className="h-3.5 w-3.5 text-[#15803d] dark:text-primary" />
                      <span>Select Country ({COUNTRIES_DATA.length})</span>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      placeholder="Filter countries..."
                      className="w-full bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.12] dark:border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#111318] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#111318] dark:focus:border-primary shadow-xs"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[300px]">
                    {filteredCountries.map((c, idx) => (
                      <button
                        key={`country-${c.code}-${c.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setSelectedState(null);
                          setCountryFilter("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[#111318] dark:text-zinc-200 transition-colors font-medium"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{c.flag}</span>
                          <span className="font-semibold text-[#111318] dark:text-white">{c.name}</span>
                          <span className="text-[10px] text-zinc-500 font-normal">({c.states.length} states/regions)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: PICK STATE */}
              {selectedCountry && !selectedState && (
                <div className="flex flex-col flex-1 min-h-0 space-y-2">
                  {/* Breadcrumb Header */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafc] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry(null);
                        setSelectedState(null);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#15803d] dark:text-primary hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Countries</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#111318] dark:text-white">
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        placeholder={`Filter states in ${selectedCountry.name}...`}
                        className="w-full bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.12] dark:border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#111318] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#111318] dark:focus:border-primary shadow-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectLocation(selectedCountry.name)}
                      className="text-xs h-8 shrink-0 rounded-xl border border-black/[0.12] dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 text-[#111318] dark:text-zinc-200 font-semibold"
                      title={`Select entire ${selectedCountry.name}`}
                    >
                      Select &quot;{selectedCountry.name}&quot;
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[300px]">
                    {filteredStates.map((st, idx) => (
                      <button
                        key={`state-${st.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedState(st);
                          setStateFilter("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[#111318] dark:text-zinc-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span className="font-semibold text-[#111318] dark:text-white">{st.name}</span>
                          <span className="text-[10px] text-zinc-500 font-normal">({st.stations.length} stations/areas)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: PICK STATION / CITY / TRANSIT HUB */}
              {selectedCountry && selectedState && (
                <div className="flex flex-col flex-1 min-h-0 space-y-2">
                  {/* Breadcrumb Header */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafc] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedState(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#15803d] dark:text-primary hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to States</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs font-medium text-[#111318] dark:text-white truncate max-w-[200px]">
                      <span>{selectedCountry.flag}</span>
                      <span className="text-zinc-600 dark:text-zinc-400 truncate">{selectedCountry.name}</span>
                      <span className="text-zinc-400">›</span>
                      <span className="font-bold text-[#111318] dark:text-white truncate">{selectedState.name}</span>
                    </div>
                  </div>

                  {/* Single Filter / Search Row */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        value={stationFilter}
                        onChange={(e) => setStationFilter(e.target.value)}
                        placeholder={`Filter stations in ${selectedState.name}...`}
                        className="w-full bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.12] dark:border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#111318] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#111318] dark:focus:border-primary shadow-xs"
                      />
                      {stationFilter && (
                        <button
                          type="button"
                          onClick={() => setStationFilter("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-[#111318] dark:hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectLocation(`${selectedState.name}, ${selectedCountry.name}`)}
                      className="text-xs h-8 shrink-0 rounded-xl border border-black/[0.12] dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 text-[#111318] dark:text-zinc-200 font-semibold"
                      title={`Select entire state ${selectedState.name}`}
                    >
                      Entire State
                    </Button>
                  </div>

                  {/* Stations List */}
                  <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[300px]">
                    {/* If user typed custom station, offer adding it directly */}
                    {stationFilter.trim() && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectLocation(
                            `${stationFilter.trim()}, ${selectedState.name}, ${selectedCountry.name}`
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-xl border border-dashed border-[#15803d]/40 dark:border-primary/40 bg-[#15803d]/10 dark:bg-primary/10 hover:bg-[#15803d]/20 text-xs text-[#15803d] dark:text-primary font-medium transition-colors mb-1 text-left"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Plus className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Use &quot;{stationFilter.trim()}&quot;</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    )}

                    {filteredStations.length > 0 ? (
                      filteredStations.map((station, idx) => {
                        const formatted = `${station}, ${selectedState.name}, ${selectedCountry.name}`;
                        const isSelected = value === formatted;
                        return (
                          <button
                            key={`station-${station}-${idx}`}
                            type="button"
                            onClick={() => handleSelectLocation(formatted)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors",
                              isSelected
                                ? "bg-[#c8f237]/20 text-[#111318] dark:text-white font-medium border border-[#c8f237]/50"
                                : "hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[#111318] dark:text-zinc-200"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Train className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                              <span className="truncate font-semibold text-[#111318] dark:text-white">{station}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-[#15803d] dark:text-primary shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        No standard station matching &quot;{stationFilter}&quot;. Click the custom option above to use &quot;{stationFilter}&quot;!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Info & Quick Shortcuts */}
          <div className="p-2.5 border-t border-black/[0.08] dark:border-white/10 bg-[#f8fafc] dark:bg-white/[0.02] flex items-center justify-between gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Compass className="h-3.5 w-3.5 text-[#15803d] dark:text-primary shrink-0" />
              <span className="truncate">
                {value ? (
                  <>Selected: <strong className="text-[#111318] dark:text-white font-bold">{value}</strong></>
                ) : (
                  "Tip: Search directly or browse country ➔ state"
                )}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 text-xs px-2.5 text-zinc-700 dark:text-zinc-400 hover:text-[#111318] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg shrink-0 font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

