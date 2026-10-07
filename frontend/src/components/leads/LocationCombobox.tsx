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

interface LocationComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

type ViewMode = "search" | "browse-country" | "browse-state" | "browse-station";

export function LocationCombobox({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select location (Country, State, Station)...",
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
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
    <div ref={containerRef} className={cn("relative w-full", open ? "z-[100]" : "z-auto")}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm shadow-inner transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 text-white text-left backdrop-blur-md",
          !value && "text-zinc-400",
          open && "border-primary/60 bg-white/[0.09]",
          className
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <MapPin className={cn("h-4 w-4 shrink-0", value ? "text-primary" : "text-zinc-400")} />
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
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </div>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform duration-200",
              open && "rotate-180 text-white"
            )}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-full z-[120] rounded-2xl border border-white/20 bg-[#121319] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 text-white flex flex-col max-h-[460px]"
          style={{ transformOrigin: "top center" }}
        >
          {/* Mode Switcher Tabs */}
          <div className="p-2 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-xs",
                  activeTab === "search"
                    ? "bg-primary text-white shadow-xs font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Global Search</span>
                {searchQuery.trim() && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-black/30 font-bold text-white">
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
                    ? "bg-primary text-white shadow-xs font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
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
                className="text-[11px] text-primary hover:underline font-medium hidden sm:inline-block truncate max-w-[140px] shrink-0"
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
              <div className="p-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
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
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-8.5 pr-7 py-1.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white"
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
                    className="h-8.5 px-3 gap-1.5 font-medium shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-xs shadow-sm"
                  >
                    <Search className="h-3 w-3" />
                    <span>Search</span>
                  </Button>
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
                        <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
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
                                    ? "bg-primary/20 text-primary font-medium border border-primary/30"
                                    : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                                )}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="text-base shrink-0">{item.flag}</span>
                                  <div>
                                    <div className="flex items-center gap-1.5 font-medium text-white group-hover:text-primary">
                                      <Train className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                      <span>{item.station}</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                      {item.state && <span>{item.state}, </span>}
                                      <span className="font-semibold text-zinc-300">{item.country}</span>
                                    </div>
                                  </div>
                                </div>

                                {isSelected ? (
                                  <Check className="h-4 w-4 text-primary shrink-0 ml-2 mt-1" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white shrink-0 ml-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto text-zinc-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-medium text-white">
                          No standard station matching &quot;{searchQuery}&quot;
                        </p>
                        <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                          Click &quot;Use custom location&quot; above to use this, or browse by country ➔ state.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty search default suggestions */
                  <div className="space-y-3 p-1">
                    {/* Popular Country Quick Picks */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-1">
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
                              className="px-2 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] hover:border-primary/60 hover:bg-primary/10 text-zinc-300 hover:text-white transition-all flex items-center gap-1 shadow-xs"
                            >
                              <span>{country?.flag}</span>
                              <span>{cName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Frequently Selected Key Stations */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-1">
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
                            className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-left hover:bg-white/[0.08] hover:text-white transition-colors border border-white/10 bg-white/[0.03] text-zinc-300 group"
                          >
                            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                              <span className="text-sm shrink-0">{item.flag}</span>
                              <span className="truncate font-medium">{item.name}</span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:text-white shrink-0 ml-1.5" />
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <Globe2 className="h-3.5 w-3.5 text-primary" />
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
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-inner"
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
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-2.5 font-medium">
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                          <span className="text-[10px] text-zinc-500">({c.states.length} states/regions)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: PICK STATE */}
              {selectedCountry && !selectedState && (
                <div className="flex flex-col flex-1 min-h-0 space-y-2">
                  {/* Breadcrumb Header */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry(null);
                        setSelectedState(null);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Countries</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
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
                        className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-inner"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectLocation(selectedCountry.name)}
                      className="text-xs h-8 shrink-0 rounded-xl border-white/15 hover:bg-white/10 text-zinc-200 hover:text-white"
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
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-medium text-white">{st.name}</span>
                          <span className="text-[10px] text-zinc-500">({st.stations.length} stations/areas)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: PICK STATION / CITY / TRANSIT HUB */}
              {selectedCountry && selectedState && (
                <div className="flex flex-col flex-1 min-h-0 space-y-2">
                  {/* Breadcrumb Header */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedState(null)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to States</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs font-medium text-white truncate max-w-[200px]">
                      <span>{selectedCountry.flag}</span>
                      <span className="text-zinc-400 truncate">{selectedCountry.name}</span>
                      <span className="text-zinc-500">›</span>
                      <span className="font-semibold text-white truncate">{selectedState.name}</span>
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
                        className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-inner"
                      />
                      {stationFilter && (
                        <button
                          type="button"
                          onClick={() => setStationFilter("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white"
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
                      className="text-xs h-8 shrink-0 rounded-xl border-white/15 hover:bg-white/10 text-zinc-200 hover:text-white"
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
                        className="w-full flex items-center justify-between p-2 rounded-xl border border-dashed border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs text-primary font-medium transition-colors mb-1 text-left"
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
                                ? "bg-primary/20 text-primary font-medium border border-primary/30"
                                : "hover:bg-white/[0.08] text-zinc-300 hover:text-white"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Train className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate">{station}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No standard station matching &quot;{stationFilter}&quot;. Click the custom option above to use &quot;{stationFilter}&quot;!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Info & Quick Shortcuts */}
          <div className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-2 text-[11px] text-zinc-400 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Navigation className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">
                {value ? (
                  <>Selected: <strong className="text-white">{value}</strong></>
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
              className="h-6 text-xs px-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg shrink-0"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
