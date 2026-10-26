"use client";

import { useState, useEffect, useCallback } from "react";

export interface MemberTarget {
  leadGenTarget: number;
  revenueTarget: number;
  userName?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PerformanceTargets {
  // Global / Organization default benchmark targets
  leadGenTarget: number;
  revenueTarget: number;
  updatedAt?: string;
  updatedBy?: string;
  // Per-person targets: keyed by userId or normalized username/email
  userTargets?: Record<string, MemberTarget>;
}

export const DEFAULT_TARGETS: PerformanceTargets = {
  leadGenTarget: 1000,
  revenueTarget: 1000000, // Rs. 10,00,000 (10 Lakhs)
  userTargets: {},
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
    const userTargets: Record<string, MemberTarget> = {};
    if (parsed.userTargets && typeof parsed.userTargets === "object") {
      Object.entries(parsed.userTargets).forEach(([k, v]: [string, any]) => {
        if (v && (Number(v.leadGenTarget) > 0 || Number(v.revenueTarget) > 0)) {
          userTargets[k] = {
            leadGenTarget: Number(v.leadGenTarget) > 0 ? Math.round(Number(v.leadGenTarget)) : DEFAULT_TARGETS.leadGenTarget,
            revenueTarget: Number(v.revenueTarget) > 0 ? Math.round(Number(v.revenueTarget)) : DEFAULT_TARGETS.revenueTarget,
            userName: v.userName,
            updatedAt: v.updatedAt,
            updatedBy: v.updatedBy,
          };
        }
      });
    }

    return {
      leadGenTarget: Number(parsed.leadGenTarget) > 0 ? Number(parsed.leadGenTarget) : DEFAULT_TARGETS.leadGenTarget,
      revenueTarget: Number(parsed.revenueTarget) > 0 ? Number(parsed.revenueTarget) : DEFAULT_TARGETS.revenueTarget,
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
      userTargets,
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
      userTargets: newTargets.userTargets !== undefined 
        ? newTargets.userTargets 
        : current.userTargets || {},
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
 * Get target for a specific user (or fallback to org target)
 */
export function getUserTarget(
  targets: PerformanceTargets,
  userIdOrKey?: string | null,
  userName?: string | null
): { leadGenTarget: number; revenueTarget: number; isCustom: boolean } {
  if (!userIdOrKey || userIdOrKey === "all") {
    return {
      leadGenTarget: targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget,
      revenueTarget: targets.revenueTarget || DEFAULT_TARGETS.revenueTarget,
      isCustom: false,
    };
  }

  // 1. Direct match by ID
  if (targets.userTargets?.[userIdOrKey]) {
    const custom = targets.userTargets[userIdOrKey];
    return {
      leadGenTarget: custom.leadGenTarget || targets.leadGenTarget,
      revenueTarget: custom.revenueTarget || targets.revenueTarget,
      isCustom: true,
    };
  }

  // 2. Match by normalized username or email
  if (userName) {
    const norm = userName.toLowerCase().trim();
    for (const [key, val] of Object.entries(targets.userTargets || {})) {
      if (
        key.toLowerCase().trim() === norm ||
        val.userName?.toLowerCase().trim() === norm
      ) {
        return {
          leadGenTarget: val.leadGenTarget || targets.leadGenTarget,
          revenueTarget: val.revenueTarget || targets.revenueTarget,
          isCustom: true,
        };
      }
    }
  }

  // Fallback to org default benchmark
  return {
    leadGenTarget: targets.leadGenTarget || DEFAULT_TARGETS.leadGenTarget,
    revenueTarget: targets.revenueTarget || DEFAULT_TARGETS.revenueTarget,
    isCustom: false,
  };
}

/**
 * Save target for an individual user
 */
export function saveUserTarget(
  userId: string,
  target: Partial<MemberTarget>,
  userName?: string,
  updatedBy: string = "Admin"
): PerformanceTargets {
  const current = loadPerformanceTargets();
  const existingUserTargets = { ...(current.userTargets || {}) };
  const prev = existingUserTargets[userId] || {
    leadGenTarget: current.leadGenTarget,
    revenueTarget: current.revenueTarget,
  };

  existingUserTargets[userId] = {
    leadGenTarget: target.leadGenTarget !== undefined && Number(target.leadGenTarget) > 0
      ? Math.round(Number(target.leadGenTarget))
      : prev.leadGenTarget,
    revenueTarget: target.revenueTarget !== undefined && Number(target.revenueTarget) > 0
      ? Math.round(Number(target.revenueTarget))
      : prev.revenueTarget,
    userName: userName || target.userName || prev.userName,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  return savePerformanceTargets(
    {
      userTargets: existingUserTargets,
    },
    updatedBy
  );
}

/**
 * Save targets for multiple users at once
 */
export function saveBatchUserTargets(
  batch: Record<string, { leadGenTarget: number; revenueTarget: number; userName?: string }>,
  updatedBy: string = "Admin"
): PerformanceTargets {
  const current = loadPerformanceTargets();
  const existingUserTargets = { ...(current.userTargets || {}) };

  Object.entries(batch).forEach(([id, t]) => {
    existingUserTargets[id] = {
      leadGenTarget: Math.round(Number(t.leadGenTarget) || current.leadGenTarget),
      revenueTarget: Math.round(Number(t.revenueTarget) || current.revenueTarget),
      userName: t.userName || existingUserTargets[id]?.userName,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
  });

  return savePerformanceTargets(
    {
      userTargets: existingUserTargets,
    },
    updatedBy
  );
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

  const updateUserTarget = useCallback(
    (userId: string, target: Partial<MemberTarget>, userName?: string, updatedBy?: string) => {
      const saved = saveUserTarget(userId, target, userName, updatedBy);
      setTargets(saved);
      return saved;
    },
    []
  );

  const updateBatchUserTargets = useCallback(
    (batch: Record<string, { leadGenTarget: number; revenueTarget: number; userName?: string }>, updatedBy?: string) => {
      const saved = saveBatchUserTargets(batch, updatedBy);
      setTargets(saved);
      return saved;
    },
    []
  );

  const resetTargets = useCallback((updatedBy?: string) => {
    const saved = savePerformanceTargets(DEFAULT_TARGETS, updatedBy);
    setTargets(saved);
    return saved;
  }, []);

  return {
    targets,
    mounted,
    updateTargets,
    updateUserTarget,
    updateBatchUserTargets,
    resetTargets,
    getTargetForUser: (userIdOrKey?: string | null, userName?: string | null) =>
      getUserTarget(targets, userIdOrKey, userName),
  };
}
