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
  const [customStationInput, setCustomStationInput] = useState("");

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
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex h-9.5 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground text-left",
          !value && "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin className={cn("h-4 w-4 shrink-0", value ? "text-primary" : "text-muted-foreground")} />
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
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </div>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[340px] sm:min-w-[460px] md:min-w-[520px] max-w-[95vw] z-[120] rounded-xl border border-border bg-popover/98 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 text-foreground"
          style={{ transformOrigin: "top left" }}
        >
          {/* Header Search Bar with Dedicated Search Button */}
          <div className="p-3 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== "search") setActiveTab("search");
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search station, city, state, country (e.g. Andheri, Dadar, Dubai)..."
                  className="w-full bg-background border border-input rounded-lg pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dedicated Search Action Button */}
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => {
                  if (activeTab !== "search") setActiveTab("search");
                  searchInputRef.current?.focus();
                }}
                className="h-9 px-3.5 gap-1.5 font-medium shrink-0 shadow-sm"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </Button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-border/40 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className={cn(
                    "px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5",
                    activeTab === "search"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Compass className="h-3.5 w-3.5" />
                  Global Search
                  {searchQuery.trim() && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-background/20 font-bold">
                      {searchResults.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("hierarchy")}
                  className={cn(
                    "px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5",
                    activeTab === "hierarchy"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Browse by Country ➔ State ➔ Station
                </button>
              </div>

              {value && (
                <button
                  type="button"
                  onClick={() => handleSelectLocation(value)}
                  className="text-[11px] text-primary hover:underline font-medium hidden sm:inline-block truncate max-w-[150px]"
                  title={`Current: ${value}`}
                >
                  Current: {value}
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: REAL-TIME GLOBAL SEARCH VIEW */}
          {activeTab === "search" && (
            <div className="max-h-[360px] overflow-y-auto p-2 space-y-2">
              {searchQuery.trim() ? (
                <>
                  {/* Custom query shortcut */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectLocation(searchQuery.trim())}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-xs font-semibold text-primary">
                            Use custom location: &quot;{searchQuery.trim()}&quot;
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Click to save this exact text as the lead location
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary/70" />
                    </button>
                  </div>

                  {/* Search Results List */}
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Matching Stations & Cities ({searchResults.length})</span>
                        <span className="text-[10px] lowercase text-muted-foreground/80 font-normal">
                          press Enter to pick top
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {searchResults.map((item, idx) => {
                          const isSelected = value === item.formatted;
                          return (
                            <button
                              key={`${item.formatted}-${idx}`}
                              type="button"
                              onClick={() => handleSelectLocation(item.formatted)}
                              className={cn(
                                "w-full flex items-start justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors group",
                                isSelected
                                  ? "bg-primary/15 text-primary font-medium"
                                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-base shrink-0 mt-0.5">{item.flag}</span>
                                <div>
                                  <div className="flex items-center gap-1.5 font-medium text-foreground group-hover:text-primary">
                                    <Train className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>{item.station}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    {item.state && <span>{item.state}, </span>}
                                    <span className="font-semibold text-foreground/80">{item.country}</span>
                                  </div>
                                </div>
                              </div>

                              {isSelected ? (
                                <Check className="h-4 w-4 text-primary shrink-0 ml-2 mt-1" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground shrink-0 ml-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Search className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No standard station matching &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        You can still click the &quot;Use custom location&quot; button above, or browse step-by-step using the Country ➔ State ➔ Station tab.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Empty search default suggestions */
                <div className="space-y-4 p-1">
                  {/* Popular Country Quick Picks */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Popular Countries & Transit Hubs
                    </p>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      {POPULAR_COUNTRIES.map((cName) => {
                        const country = COUNTRIES_DATA.find((c) => c.name === cName);
                        return (
                          <button
                            key={cName}
                            type="button"
                            onClick={() => handleSelectPopularCountry(cName)}
                            className="px-2.5 py-1 text-xs rounded-full border border-border/80 bg-background hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-1.5 shadow-sm"
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
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Featured Business Hubs & Stations
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                      {[
                        { name: "Andheri, Mumbai, Maharashtra, India", flag: "🇮🇳" },
                        { name: "Bandra Kurla Complex (BKC), Mumbai, Maharashtra, India", flag: "🇮🇳" },
                        { name: "Dadar, Mumbai, Maharashtra, India", flag: "🇮🇳" },
                        { name: "Borivali, Mumbai, Maharashtra, India", flag: "🇮🇳" },
                        { name: "Cyber City, Gurugram, Delhi NCR, India", flag: "🇮🇳" },
                        { name: "Whitefield, Bengaluru, Karnataka, India", flag: "🇮🇳" },
                        { name: "Hinjewadi IT Park, Pune, Maharashtra, India", flag: "🇮🇳" },
                        { name: "Dubai Marina, Dubai, United Arab Emirates", flag: "🇦🇪" },
                        { name: "London King's Cross, Greater London, United Kingdom", flag: "🇬🇧" },
                        { name: "Manhattan, New York, United States", flag: "🇺🇸" },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSelectLocation(item.name)}
                          className="flex items-center justify-between p-2 rounded-lg text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors border border-border/40"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>{item.flag}</span>
                            <span className="truncate">{item.name}</span>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CASCADING HIERARCHY (Country ➔ State ➔ Station) */}
          {activeTab === "hierarchy" && (
            <div className="p-2 space-y-2">
              {/* STEP 1: PICK COUNTRY */}
              {!selectedCountry && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Globe2 className="h-4 w-4 text-primary" />
                      <span>Step 1: Select Country (Total: {COUNTRIES_DATA.length})</span>
                    </div>
                  </div>

                  <div className="px-1">
                    <input
                      type="text"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      placeholder="Filter countries..."
                      className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="max-h-[260px] overflow-y-auto space-y-0.5 p-1">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setSelectedState(null);
                          setCountryFilter("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2.5 font-medium">
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                          <span className="text-[10px] text-muted-foreground">({c.states.length} states/regions)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: PICK STATE */}
              {selectedCountry && !selectedState && (
                <div className="space-y-2">
                  {/* Breadcrumb Header */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="text"
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      placeholder={`Filter states in ${selectedCountry.name}...`}
                      className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectLocation(selectedCountry.name)}
                      className="text-xs h-7.5 shrink-0"
                      title={`Select entire ${selectedCountry.name}`}
                    >
                      Use &quot;{selectedCountry.name}&quot;
                    </Button>
                  </div>

                  <div className="max-h-[240px] overflow-y-auto space-y-0.5 p-1">
                    {filteredStates.map((st) => (
                      <button
                        key={st.name}
                        type="button"
                        onClick={() => {
                          setSelectedState(st);
                          setStateFilter("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{st.name}</span>
                          <span className="text-[10px] text-muted-foreground">({st.stations.length} stations/areas)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: PICK STATION / CITY / TRANSIT HUB */}
              {selectedCountry && selectedState && (
                <div className="space-y-2">
                  {/* Breadcrumb Header */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
                    <button
                      type="button"
                      onClick={() => setSelectedState(null)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to States</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground truncate max-w-[240px]">
                      <span>{selectedCountry.flag}</span>
                      <span className="text-muted-foreground">{selectedCountry.name}</span>
                      <span>›</span>
                      <span className="font-semibold text-foreground">{selectedState.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="text"
                      value={stationFilter}
                      onChange={(e) => setStationFilter(e.target.value)}
                      placeholder={`Filter stations in ${selectedState.name}...`}
                      className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectLocation(`${selectedState.name}, ${selectedCountry.name}`)}
                      className="text-xs h-7.5 shrink-0"
                      title={`Select entire state ${selectedState.name}`}
                    >
                      Entire State
                    </Button>
                  </div>

                  {/* Add Custom Station/Place in this state */}
                  <div className="px-1">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40 border border-border/40">
                      <input
                        type="text"
                        value={customStationInput}
                        onChange={(e) => setCustomStationInput(e.target.value)}
                        placeholder="Type custom locality/station..."
                        className="flex-1 bg-background border border-input rounded px-2.5 py-1 text-xs text-foreground"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!customStationInput.trim()}
                        onClick={() => {
                          if (customStationInput.trim()) {
                            handleSelectLocation(
                              `${customStationInput.trim()}, ${selectedState.name}, ${selectedCountry.name}`
                            );
                          }
                        }}
                        className="h-7 text-xs px-2.5 font-medium"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Stations List */}
                  <div className="max-h-[220px] overflow-y-auto space-y-0.5 p-1">
                    {filteredStations.length > 0 ? (
                      filteredStations.map((station) => {
                        const formatted = `${station}, ${selectedState.name}, ${selectedCountry.name}`;
                        const isSelected = value === formatted;
                        return (
                          <button
                            key={station}
                            type="button"
                            onClick={() => handleSelectLocation(formatted)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors",
                              isSelected
                                ? "bg-primary/15 text-primary font-medium"
                                : "hover:bg-accent hover:text-accent-foreground text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Train className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{station}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No standard station matching &quot;{stationFilter}&quot;. Use the custom locality box above!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Info & Quick Shortcuts */}
          <div className="p-2.5 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Navigation className="h-3 w-3 text-primary" />
              <span>
                {value ? (
                  <>Selected: <strong className="text-foreground">{value}</strong></>
                ) : (
                  "Tip: Search station directly or browse country ➔ state"
                )}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
