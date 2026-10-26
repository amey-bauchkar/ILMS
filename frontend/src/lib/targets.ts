"use client";

import { useState, useEffect, useCallback } from "react";

export interface PerformanceTargets {
  leadGenTarget: number;
  revenueTarget: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_TARGETS: PerformanceTargets = {
  leadGenTarget: 1000,
  revenueTarget: 1000000, // Rs. 10,00,000 (10 Lakhs)
};

export const TARGETS_STORAGE_KEY = "foremark_crm_targets";
export const TARGETS_CHANGED_EVENT = "foremark_targets_changed";

/**
 * Load performance targets from localStorage (fallback to defaults)
 */
export function loadPerformanceTargets(): PerformanceTargets {
  if (typeof window === "undefined") {
    return DEFAULT_TARGETS;
  }

  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!raw) return DEFAULT_TARGETS;

    const parsed = JSON.parse(raw);
    return {
      leadGenTarget: Number(parsed.leadGenTarget) > 0 ? Number(parsed.leadGenTarget) : DEFAULT_TARGETS.leadGenTarget,
      revenueTarget: Number(parsed.revenueTarget) > 0 ? Number(parsed.revenueTarget) : DEFAULT_TARGETS.revenueTarget,
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
    };
  } catch (err) {
    console.error("Failed to load targets from localStorage:", err);
    return DEFAULT_TARGETS;
  }
}

/**
 * Save performance targets to localStorage and notify all listeners
 */
export function savePerformanceTargets(
  newTargets: Partial<PerformanceTargets>,
  updatedBy: string = "Admin"
): PerformanceTargets {
  if (typeof window === "undefined") {
    return DEFAULT_TARGETS;
  }

  try {
    const current = loadPerformanceTargets();
    const updated: PerformanceTargets = {
      leadGenTarget: newTargets.leadGenTarget !== undefined && Number(newTargets.leadGenTarget) > 0 
        ? Math.round(Number(newTargets.leadGenTarget)) 
        : current.leadGenTarget,
      revenueTarget: newTargets.revenueTarget !== undefined && Number(newTargets.revenueTarget) > 0 
        ? Math.round(Number(newTargets.revenueTarget)) 
        : current.revenueTarget,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event to inform other components / tabs
    window.dispatchEvent(new CustomEvent(TARGETS_CHANGED_EVENT, { detail: updated }));

    return updated;
  } catch (err) {
    console.error("Failed to save targets to localStorage:", err);
    return DEFAULT_TARGETS;
  }
}

/**
 * Custom hook to subscribe to and update targets reactively
 */
export function useTargets() {
  const [targets, setTargets] = useState<PerformanceTargets>(DEFAULT_TARGETS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTargets(loadPerformanceTargets());
    setMounted(true);

    const handleTargetsChange = (e: Event) => {
      const customEvent = e as CustomEvent<PerformanceTargets>;
      if (customEvent.detail) {
        setTargets(customEvent.detail);
      } else {
        setTargets(loadPerformanceTargets());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TARGETS_STORAGE_KEY) {
        setTargets(loadPerformanceTargets());
      }
    };

    window.addEventListener(TARGETS_CHANGED_EVENT, handleTargetsChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(TARGETS_CHANGED_EVENT, handleTargetsChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateTargets = useCallback((newTargets: Partial<PerformanceTargets>, updatedBy?: string) => {
    const saved = savePerformanceTargets(newTargets, updatedBy);
    setTargets(saved);
    return saved;
  }, []);

  const resetTargets = useCallback((updatedBy?: string) => {
    const saved = savePerformanceTargets(DEFAULT_TARGETS, updatedBy);
    setTargets(saved);
    return saved;
  }, []);

  return {
    targets,
    mounted,
    updateTargets,
    resetTargets,
  };
}
