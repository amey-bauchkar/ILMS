import { createClient } from '@/lib/supabase/server';

// ============================================================
// Lead Queries — BRD §2.5, §2.12
// ============================================================

export interface LeadFilters {
  search?: string;
  status_id?: string;
  source?: string;
  owner_id?: string;
  priority?: string;
  tag_ids?: string[];
  date_from?: string;
  date_to?: string;
  followup_overdue?: boolean;
  followup_today?: boolean;
  exclude_terminal?: boolean;
}

export interface LeadSort {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Get paginated, filtered, sorted leads list.
 * BRD §2.12: "Global search by name, company, phone, email.
 * Filter by Status, Source, Owner, Tag, Priority, date range."
 */
export async function getLeads(
  filters: LeadFilters = {},
  sort: LeadSort = { column: 'created_at', direction: 'desc' },
  page: number = 1,
  pageSize: number = 25
) {
  const supabase = await createClient();

  let query = supabase
    .from('leads')
    .select(`
      *,
      owner:users!leads_owner_id_fkey(id, name, avatar_url),
      status:statuses!leads_status_id_fkey(id, name, slug, color, is_terminal),
      lead_tags(tag_id, tags(id, name, category))
    `, { count: 'exact' });

  // Full-text search (BRD §2.12)
  if (filters.search) {
    const searchTerms = filters.search.trim().split(/\s+/).join(' & ');
    query = query.textSearch('name', searchTerms, { type: 'websearch' });
  }

  // Filters
  if (filters.status_id) query = query.eq('status_id', filters.status_id);
  if (filters.source) query = query.eq('source', filters.source);
  if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);

  // Overdue follow-ups
  if (filters.followup_overdue) {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('next_followup_date', today);
  }

  // Today's follow-ups
  if (filters.followup_today) {
    const today = new Date().toISOString().split('T')[0];
    query = query.eq('next_followup_date', today);
  }

  // Exclude terminal statuses (Won, Lost, Junk)
  if (filters.exclude_terminal) {
    query = query.eq('status.is_terminal', false);
  }

  // Sorting
  query = query.order(sort.column, { ascending: sort.direction === 'asc' });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  // Filter by tags (post-query since it's a join)
  let filteredData = data || [];
  if (filters.tag_ids && filters.tag_ids.length > 0) {
    filteredData = filteredData.filter((lead: any) =>
      filters.tag_ids!.some((tagId) =>
        lead.lead_tags?.some((lt: any) => lt.tag_id === tagId)
      )
    );
  }

  return {
    data: filteredData,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get a single lead with full details (owner, status, tags, activities).
 */
export async function getLeadById(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      owner:users!leads_owner_id_fkey(id, name, email, avatar_url, role),
      creator:users!leads_created_by_fkey(id, name),
      status:statuses!leads_status_id_fkey(*),
      lead_tags(tag_id, tags(id, name, category))
    `)
    .eq('id', leadId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get active statuses ordered by display_order.
 * BRD §2.6: Used for pipeline dropdowns and Kanban view.
 */
export async function getStatuses(includeInactive: boolean = false) {
  const supabase = await createClient();

  let query = supabase
    .from('statuses')
    .select('*')
    .order('display_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get active tags for the tag picker.
 * BRD §2.7: Autocomplete "+" tag dropdown.
 */
export async function getActiveTags() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get leads grouped by status for the pipeline/Kanban view.
 */
export async function getLeadsByStatus() {
  const supabase = await createClient();

  const { data: statuses } = await supabase
    .from('statuses')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      owner:users!leads_owner_id_fkey(id, name, avatar_url),
      status:statuses!leads_status_id_fkey(id, name, slug, color)
    `);

  // Group leads by status
  const grouped = (statuses || []).map((status) => ({
    ...status,
    leads: (leads || []).filter((l: any) => l.status_id === status.id),
  }));

  return grouped;
}
