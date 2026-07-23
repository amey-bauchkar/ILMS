import { createClient } from '@/lib/supabase/server';

// ============================================================
// CSV Export Query — BRD §2.4, §2.13
// Gap #5 Fix: CSV export for Admin + Client Manager.
// ============================================================

/**
 * Get leads as flat data for CSV export.
 * Joins status name and owner name for readable output.
 */
export async function getLeadsForExport(filters: {
  status_id?: string;
  source?: string;
  owner_id?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
} = {}) {
  const supabase = await createClient();

  let query = supabase
    .from('leads')
    .select(`
      name,
      company_name,
      phone,
      email,
      source,
      status:statuses!leads_status_id_fkey(name),
      owner:users!leads_owner_id_fkey(name),
      priority,
      estimated_deal_value,
      next_followup_date,
      last_contacted_at,
      lost_reason,
      lost_reason_details,
      created_at,
      lead_tags(tags(name))
    `)
    .order('created_at', { ascending: false });

  if (filters.status_id) query = query.eq('status_id', filters.status_id);
  if (filters.source) query = query.eq('source', filters.source);
  if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((lead: any) => ({
    'Name': lead.name,
    'Company': lead.company_name || '',
    'Phone': lead.phone,
    'Email': lead.email || '',
    'Source': lead.source,
    'Status': lead.status?.name || '',
    'Owner': lead.owner?.name || '',
    'Priority': lead.priority,
    'Estimated Deal Value': lead.estimated_deal_value,
    'Next Follow-up': lead.next_followup_date || '',
    'Last Contacted': lead.last_contacted_at || '',
    'Lost Reason': lead.lost_reason || '',
    'Lost Details': lead.lost_reason_details || '',
    'Tags': lead.lead_tags?.map((lt: any) => lt.tags?.name).filter(Boolean).join(', ') || '',
    'Created': lead.created_at,
  }));
}

/**
 * Convert array of objects to CSV string.
 */
export function toCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '');
          // Escape commas, quotes, and newlines
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}
