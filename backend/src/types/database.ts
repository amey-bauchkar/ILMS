/**
 * Foremark CRM — Database Type Definitions
 *
 * These types mirror the PostgreSQL schema exactly.
 * After Supabase project is created, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * For now, we manually define them to match our migration files.
 */

// ============================================================
// ENUM Types (matching PostgreSQL ENUMs from migration 001)
// ============================================================

export type LeadSource =
  | 'Reddit'
  | 'Google Business Profile'
  | 'Referral'
  | 'Website Inbound'
  | 'LinkedIn'
  | 'Cold Outreach'
  | 'WhatsApp'
  | 'Upwork'
  | 'Events'
  | 'Other';

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export type UserRole = 'admin' | 'client_manager' | 'sales';

export type ActivityType =
  | 'call'
  | 'note'
  | 'status_change'
  | 'tag_change'
  | 'reassignment';

export type CallOutcome =
  | 'Answered'
  | 'Not Answered'
  | 'Busy'
  | 'Wrong Number'
  | 'Voicemail'
  | 'Call Back Requested';

export type ReminderStatus = 'pending' | 'completed' | 'dismissed';

export type LostReasonCategory =
  | 'Budget'
  | 'Timing'
  | 'Went with competitor'
  | 'Not a fit'
  | 'No response'
  | 'Other';

// ============================================================
// Table Row Types
// ============================================================

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Status {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  color: string;
  is_active: boolean;
  is_terminal: boolean;
  exclude_from_conversion: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  source: LeadSource;
  status_id: string;
  owner_id: string;
  created_by: string;
  priority: LeadPriority;
  estimated_deal_value: number;
  next_followup_date: string | null;
  last_contacted_at: string | null;
  lost_reason: LostReasonCategory | null;
  lost_reason_details: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  outcome: CallOutcome | null;
  notes: string | null;
  from_status_id: string | null;
  to_status_id: string | null;
  from_owner_id: string | null;
  to_owner_id: string | null;
  created_by: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LeadTag {
  lead_id: string;
  tag_id: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  lead_id: string;
  title: string;
  due_date: string;
  status: ReminderStatus;
  assigned_to: string;
  created_by: string;
  completed_at: string | null;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  from_status_id: string;
  to_status_id: string;
  changed_by: string;
  created_at: string;
}

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
}

// ============================================================
// Supabase Database Type (for typed client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      statuses: {
        Row: Status;
        Insert: Omit<Status, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Status, 'id' | 'created_at'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'last_contacted_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_contacted_at?: string;
        };
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Tag, 'id' | 'created_at'>>;
      };
      lead_tags: {
        Row: LeadTag;
        Insert: Omit<LeadTag, 'created_at'> & { created_at?: string };
        Update: Partial<LeadTag>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Reminder, 'id' | 'created_at'>>;
      };
      lead_status_history: {
        Row: LeadStatusHistory;
        Insert: Omit<LeadStatusHistory, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
      saved_views: {
        Row: SavedView;
        Insert: Omit<SavedView, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SavedView, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      lead_source: LeadSource;
      lead_priority: LeadPriority;
      user_role: UserRole;
      activity_type: ActivityType;
      call_outcome: CallOutcome;
      reminder_status: ReminderStatus;
      lost_reason_category: LostReasonCategory;
    };
  };
}
