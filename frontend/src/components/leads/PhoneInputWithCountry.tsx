"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COUNTRY_DIAL_LIST,
  DEFAULT_COUNTRY_DIAL,
  CountryDialInfo,
  getCountryDialInfo,
  extractCountryFromLocation,
  detectCountryFromPhone,
} from "@/lib/location-data";

interface PhoneInputWithCountryProps {
  value?: string;
  onChange: (value: string) => void;
  location?: string | null;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function PhoneInputWithCountry({
  value = "",
  onChange,
  location,
  disabled,
  className,
}: PhoneInputWithCountryProps) {
  // Current active country dial info
  const [selectedCountry, setSelectedCountry] = useState<CountryDialInfo>(() => {
    if (value) {
      const detected = detectCountryFromPhone(value);
      if (detected) return detected;
    }
    if (location) {
      return extractCountryFromLocation(location);
    }
    return DEFAULT_COUNTRY_DIAL;
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Sync country when Location changes in the form
  useEffect(() => {
    if (!location) return;
    const locationCountry = extractCountryFromLocation(location);
    if (locationCountry && locationCountry.dialCode !== selectedCountry.dialCode) {
      setSelectedCountry(locationCountry);

      // If current value is empty or just contains old dial code prefix
      if (!value || value.trim() === "" || value.trim() === selectedCountry.dialCode) {
        onChange(`${locationCountry.dialCode} `);
      } else {
        // If phone currently starts with the old dial code, replace dial code with new one
        const detected = detectCountryFromPhone(value);
        if (detected && detected.dialCode !== locationCountry.dialCode) {
          const rawDigits = value.replace(detected.dialCode, "").trim();
          onChange(`${locationCountry.dialCode} ${rawDigits}`.trim());
        }
      }
    }
  }, [location]);

  // If external value changes and starts with a different dial code, detect country
  useEffect(() => {
    if (!value) return;
    const detected = detectCountryFromPhone(value);
    if (detected && detected.dialCode !== selectedCountry.dialCode) {
      setSelectedCountry(detected);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [open]);

  // Filter country dial list
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_DIAL_LIST;
    const q = search.trim().toLowerCase();
    return COUNTRY_DIAL_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q)
    );
  }, [search]);

  // Switch country from dropdown
  const handleSelectCountry = (country: CountryDialInfo) => {
    const oldDial = selectedCountry.dialCode;
    setSelectedCountry(country);
    setOpen(false);

    let rawDigits = "";
    if (value) {
      if (value.startsWith(oldDial)) {
        rawDigits = value.slice(oldDial.length).trim();
      } else {
        const detected = detectCountryFromPhone(value);
        if (detected) {
          rawDigits = value.slice(detected.dialCode.length).trim();
        } else {
          rawDigits = value.trim();
        }
      }
    }

    if (rawDigits) {
      onChange(`${country.dialCode} ${rawDigits}`);
    } else {
      onChange(`${country.dialCode} `);
    }

    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  // Handle phone input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // Check if user typed or pasted an international prefix like +44 or +1 or +971
    if (inputVal.startsWith("+")) {
      const detected = detectCountryFromPhone(inputVal);
      if (detected && detected.dialCode !== selectedCountry.dialCode) {
        setSelectedCountry(detected);
      }
    }

    onChange(inputVal);
  };

  return (
    <div ref={dropdownRef} className={cn("relative flex w-full min-w-0", open ? "z-[100]" : "z-auto", className)}>
      {/* Country Code Picker Dropdown Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-l-xl border border-r-0 border-white/20 bg-white/[0.06] px-2.5 sm:px-3 py-2 text-sm font-medium transition-all hover:bg-white/[0.1] hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 text-white shrink-0 select-none backdrop-blur-md shadow-inner",
          open && "bg-white/[0.12] border-primary/60"
        )}
        title={`Country: ${selectedCountry.name} (${selectedCountry.dialCode})`}
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-xs font-semibold text-white tracking-tight">
          {selectedCountry.dialCode}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ml-0.5",
            open && "rotate-180 text-white"
          )}
        />
      </button>

      {/* Actual Phone Number Input Field */}
      <div className="relative flex-1 min-w-0">
        <input
          ref={phoneInputRef}
          type="tel"
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          placeholder={selectedCountry.placeholder || `${selectedCountry.dialCode} 9876543210`}
          className="flex h-10 w-full min-w-0 rounded-r-xl border border-white/20 bg-white/[0.05] px-3 py-2 text-sm shadow-inner transition-all hover:border-white/35 focus:border-primary focus:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 text-white placeholder:text-zinc-500 backdrop-blur-md"
        />

        {value && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear phone number"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Country Code Dropdown Popover */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-[300px] sm:w-[340px] max-w-[calc(100vw-2rem)] z-[150] rounded-2xl border border-white/20 bg-[#121319] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 text-white"
          style={{ transformOrigin: "top left" }}
        >
          {/* Search Box */}
          <div className="p-2.5 border-b border-white/10 bg-white/[0.02] relative">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code (e.g. India, +1, UAE)..."
              className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-8.5 pr-7 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Popular Country Pills */}
          {!search.trim() && (
            <div className="p-2.5 border-b border-white/10 bg-white/[0.01]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 px-1">
                Popular Countries
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["India", "United States", "United Kingdom", "United Arab Emirates", "Canada", "Australia", "Singapore", "Saudi Arabia"].map(
                  (cName) => {
                    const info = COUNTRY_DIAL_LIST.find((c) => c.name === cName);
                    if (!info) return null;
                    const isCurrent = selectedCountry.dialCode === info.dialCode && selectedCountry.name === info.name;
                    return (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => handleSelectCountry(info)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] border transition-all flex items-center gap-1.5",
                          isCurrent
                            ? "bg-primary/20 border-primary text-primary font-semibold shadow-xs"
                            : "bg-white/[0.04] border-white/10 hover:border-white/25 hover:bg-white/[0.08] text-zinc-300"
                        )}
                      >
                        <span>{info.flag}</span>
                        <span>{info.dialCode}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Country List */}
          <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected =
                  selectedCountry.code === country.code ||
                  selectedCountry.name === country.name;
                return (
                  <button
                    key={`${country.code}-${country.dialCode}-${country.name}`}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors",
                      isSelected
                        ? "bg-primary/20 text-primary font-medium border border-primary/30"
                        : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0">{country.flag}</span>
                      <span className="truncate font-medium">
                        {country.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="font-mono text-zinc-400 font-semibold text-[11px]">
                        {country.dialCode}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500">
                No country found matching &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
