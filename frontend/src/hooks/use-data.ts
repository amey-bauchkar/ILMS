"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lead, User, Status, Tag } from "@/types/database";

// ============================================================
// Enriched types used by the frontend (join owner + status info)
// ============================================================

export interface EnrichedLead {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  source: string;
  status: string;        // status name (e.g. "New", "Won")
  statusColor: string;   // hex color from statuses table
  statusId: string;
  owner: { id: string; name: string; email: string; role: string };
  priority: "Hot" | "Warm" | "Cold";
  tags: string[];
  dealValue: number | null;
  createdAt: string;
  lastContactedAt: string | null;
  nextFollowUpDate: string | null;
  lostReason: string | null;
}

// ============================================================
// Hook: useLeads — fetches leads from Supabase with joins
// ============================================================

export function useLeads() {
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from("leads")
      .select(`
        *,
        owner:users!leads_owner_id_fkey(id, name, email, role),
        status:statuses!leads_status_id_fkey(id, name, color, slug),
        lead_tags(tag_id, tags(id, name))
      `)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const enriched: EnrichedLead[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      company: row.company_name,
      phone: row.phone,
      email: row.email,
      source: row.source,
      status: row.status?.name || "Unknown",
      statusColor: row.status?.color || "#737373",
      statusId: row.status_id,
      owner: row.owner || { id: "", name: "Unassigned", email: "", role: "" },
      priority: row.priority,
      tags: (row.lead_tags || []).map((lt: any) => lt.tags?.name).filter(Boolean),
      dealValue: row.estimated_deal_value,
      createdAt: row.created_at,
      lastContactedAt: row.last_contacted_at,
      nextFollowUpDate: row.next_followup_date,
      lostReason: row.lost_reason,
    }));

    setLeads(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refresh: fetchLeads };
}

// ============================================================
// Hook: useStatuses — fetches statuses from the DB
// ============================================================

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("statuses")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      setStatuses(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { statuses, loading };
}

// ============================================================
// Hook: useTeamMembers — fetches users from the DB
// ============================================================

export function useTeamMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      setMembers(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { members, loading };
}

// ============================================================
// Hook: useTags — fetches tags from the DB
// ============================================================

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("tags")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      setTags(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { tags, loading };
}

// ============================================================
// Status color map (built from DB data)
// ============================================================

export function useStatusColors() {
  const { statuses } = useStatuses();
  const colorMap: Record<string, string> = {};
  statuses.forEach((s) => {
    colorMap[s.name] = s.color;
  });
  return colorMap;
}

// ============================================================
// Priority colors (these are fixed, no need for DB)
// ============================================================

export const priorityColors: Record<string, string> = {
  Hot: "#ef4444",
  Warm: "#e87811",
  Cold: "#3b82f6",
};

// ============================================================
// Hook: useActivities — fetches activities for a specific lead
// ============================================================

export function useActivities(leadId: string) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!leadId) return;
    
    setLoading(true);
    const supabase = createClient();
    
    const { data } = await supabase
      .from("activities")
      .select(`
        *,
        created_by:users!activities_created_by_fkey(id, name, email, role)
      `)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    // Map db fields to camelCase as expected by frontend
    const mapped = (data || []).map((a: any) => ({
      id: a.id,
      leadId: a.lead_id,
      type: a.type,
      notes: a.notes,
      outcome: a.outcome,
      fromStatus: a.from_status_id, // we might need to join status table if we want names
      toStatus: a.to_status_id,
      createdAt: a.created_at,
      createdBy: a.created_by || { id: "", name: "System", email: "", role: "" }
    }));

    setActivities(mapped);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, refresh: fetchActivities };
}

// ============================================================
// Hook: useDashboardData — fetches all data needed for dashboard
// ============================================================

export function useDashboardData() {
  const [data, setData] = useState<{ leads: EnrichedLead[]; activities: any[] }>({ leads: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(`
          *,
          owner:users!leads_owner_id_fkey(id, name, email, role),
          status:statuses!leads_status_id_fkey(id, name, color, slug),
          lead_tags(tag_id, tags(id, name))
        `)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      const enrichedLeads: EnrichedLead[] = (leadsData || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        company: row.company_name,
        phone: row.phone,
        email: row.email,
        source: row.source,
        status: row.status?.name || "Unknown",
        statusColor: row.status?.color || "#737373",
        statusId: row.status_id,
        owner: row.owner || { id: "", name: "Unassigned", email: "", role: "" },
        priority: row.priority,
        tags: (row.lead_tags || []).map((lt: any) => lt.tags?.name).filter(Boolean),
        dealValue: row.estimated_deal_value,
        createdAt: row.created_at,
        lastContactedAt: row.last_contacted_at,
        nextFollowUpDate: row.next_followup_date,
        lostReason: row.lost_reason,
      }));

      // Fetch activities
      const { data: actsData, error: actsError } = await supabase
        .from("activities")
        .select(`
          *,
          created_by:users!activities_created_by_fkey(id, name, email, role)
        `)
        .order("created_at", { ascending: false });

      if (actsError) throw actsError;

      const mappedActivities = (actsData || []).map((a: any) => ({
        id: a.id,
        leadId: a.lead_id,
        type: a.type,
        notes: a.notes,
        outcome: a.outcome,
        fromStatus: a.from_status_id,
        toStatus: a.to_status_id,
        createdAt: a.created_at,
        createdBy: a.created_by || { id: "", name: "System", email: "", role: "" }
      }));

      setData({ leads: enrichedLeads, activities: mappedActivities });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, error, refresh: fetchData };
}

// ============================================================
// Hook: useSavedViews — fetches saved views for the current user
// ============================================================
import type { SavedView } from "@/types/database";

export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from("saved_views")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setViews(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  return { views, loading, refresh: fetchViews };
}

// ============================================================
// Hook: useReminders — fetches reminders for the current user
// ============================================================
import type { Reminder } from "@/types/database";

export interface EnrichedReminder extends Reminder {
  lead?: { name: string; company_name: string | null };
}

export function useReminders() {
  const [reminders, setReminders] = useState<EnrichedReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from("reminders")
        .select("*, lead:leads(id, name, company_name)")
        .eq("assigned_to", user.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true });
      setReminders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { reminders, loading, refresh: fetchReminders };
}


