-- ============================================================
-- Migration 001: Create Custom ENUM Types
-- Foremark CRM — BRD/FRD v1.0
-- ============================================================
-- These ENUMs are ONLY for values that are truly fixed and
-- will never be edited by a user at runtime.
-- Note: lead_status is NOT an ENUM — it uses a reference table
-- (see 003_create_statuses_table.sql) because BRD §2.6 requires
-- Admin-configurable statuses.
-- ============================================================

-- Lead source channels (BRD §1.4)
CREATE TYPE lead_source AS ENUM (
  'Reddit',
  'Google Business Profile',
  'Referral',
  'Website Inbound',
  'LinkedIn',
  'Cold Outreach',
  'WhatsApp',
  'Upwork',
  'Events',
  'Other'
);

-- Priority levels (BRD §2.5)
CREATE TYPE lead_priority AS ENUM ('Hot', 'Warm', 'Cold');

-- User roles (BRD §2.4)
CREATE TYPE user_role AS ENUM ('admin', 'client_manager', 'sales');

-- Activity types (BRD §2.9)
CREATE TYPE activity_type AS ENUM (
  'call',
  'note',
  'status_change',
  'tag_change',
  'reassignment'
);

-- Call outcomes (BRD §2.8)
CREATE TYPE call_outcome AS ENUM (
  'Answered',
  'Not Answered',
  'Busy',
  'Wrong Number',
  'Voicemail',
  'Call Back Requested'
);

-- Reminder status
CREATE TYPE reminder_status AS ENUM ('pending', 'completed', 'dismissed');

-- Lost reason categories (BRD §2.5)
CREATE TYPE lost_reason_category AS ENUM (
  'Budget',
  'Timing',
  'Went with competitor',
  'Not a fit',
  'No response',
  'Other'
);
