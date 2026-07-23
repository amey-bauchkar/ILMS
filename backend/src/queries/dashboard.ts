import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '../actions/auth';

// ============================================================
// Dashboard Queries — BRD §2.10 (All 10 Widgets + Filters)
// Gap #7 Fix: Complete coverage of all dashboard widgets.
// ============================================================

interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  owner_id?: string;  // Admin-only filter
}

/**
 * Get all dashboard summary cards.
 * BRD §2.10: Pipeline Summary, New Leads, Win Rate, etc.
 */
export async function getDashboardStats(filters: DashboardFilters = {}) {
  const supabase = await createClient();

  // Build a base filter
  const applyFilters = (query: any) => {
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);
    return query;
  };

  // Total leads (all time)
  const { count: totalLeads } = await applyFilters(
    supabase.from('leads').select('*', { count: 'exact', head: true })
  );

  // New leads today
  const today = new Date().toISOString().split('T')[0];
  const { count: newToday } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);

  // New leads this week
  const weekStart = getStartOfWeek();
  const { count: newThisWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekStart);

  // New leads this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: newThisMonth } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart.toISOString());

  // Get statuses for calculation
  const { data: statuses } = await supabase
    .from('statuses')
    .select('id, slug, is_terminal, exclude_from_conversion');

  const wonId = statuses?.find((s) => s.slug === 'won')?.id;
  const lostId = statuses?.find((s) => s.slug === 'lost')?.id;
  const terminalIds = statuses?.filter((s) => s.is_terminal).map((s) => s.id) || [];

  // Won count
  const { count: wonCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status_id', wonId!);

  // Lost count
  const { count: lostCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status_id', lostId!);

  // Win rate
  const winRate = wonCount && lostCount
    ? (wonCount / (wonCount + lostCount)) * 100
    : 0;

  // Average deal value (Won leads)
  const { data: wonLeads } = await supabase
    .from('leads')
    .select('estimated_deal_value')
    .eq('status_id', wonId!);

  const avgDealValue = wonLeads && wonLeads.length > 0
    ? wonLeads.reduce((sum, l) => sum + Number(l.estimated_deal_value), 0) / wonLeads.length
    : 0;

  // Overdue follow-ups
  const { count: overdueCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .lt('next_followup_date', today)
    .not('status_id', 'in', `(${terminalIds.join(',')})`);

  // Today's follow-ups
  const { count: todayFollowups } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('next_followup_date', today)
    .not('status_id', 'in', `(${terminalIds.join(',')})`);

  // Pipeline value (open leads only)
  const { data: openLeads } = await supabase
    .from('leads')
    .select('estimated_deal_value, status_id')
    .not('status_id', 'in', `(${terminalIds.join(',')})`);

  const pipelineValue = openLeads
    ? openLeads.reduce((sum, l) => sum + Number(l.estimated_deal_value), 0)
    : 0;

  return {
    totalLeads: totalLeads || 0,
    newToday: newToday || 0,
    newThisWeek: newThisWeek || 0,
    newThisMonth: newThisMonth || 0,
    wonCount: wonCount || 0,
    lostCount: lostCount || 0,
    winRate: Math.round(winRate * 10) / 10,
    avgDealValue: Math.round(avgDealValue),
    overdueFollowups: overdueCount || 0,
    todayFollowups: todayFollowups || 0,
    pipelineValue,
  };
}

/**
 * Get leads grouped by status for the Pipeline Summary chart.
 * BRD §2.10: "Pipeline summary — count of leads in each status."
 */
export async function getLeadsByStatusChart() {
  const supabase = await createClient();

  const { data: statuses } = await supabase
    .from('statuses')
    .select('id, name, color, display_order')
    .eq('is_active', true)
    .order('display_order');

  const { data: leads } = await supabase
    .from('leads')
    .select('status_id');

  const result = (statuses || []).map((status) => ({
    name: status.name,
    color: status.color,
    count: (leads || []).filter((l) => l.status_id === status.id).length,
  }));

  return result;
}

/**
 * Get leads grouped by source for the Leads by Source chart.
 * BRD §2.10: "Leads by source — pie or bar chart."
 */
export async function getLeadsBySource() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('leads')
    .select('source');

  const grouped: Record<string, number> = {};
  (data || []).forEach((lead) => {
    grouped[lead.source] = (grouped[lead.source] || 0) + 1;
  });

  return Object.entries(grouped).map(([source, count]) => ({
    source,
    count,
  }));
}

/**
 * Get pipeline value grouped by status (open leads only).
 * BRD §2.10: Pipeline Value widget.
 */
export async function getPipelineValueByStatus() {
  const supabase = await createClient();

  const { data: statuses } = await supabase
    .from('statuses')
    .select('id, name, color, display_order, is_terminal')
    .eq('is_active', true)
    .order('display_order');

  const { data: leads } = await supabase
    .from('leads')
    .select('status_id, estimated_deal_value');

  const result = (statuses || [])
    .filter((s) => !s.is_terminal)
    .map((status) => ({
      name: status.name,
      color: status.color,
      value: (leads || [])
        .filter((l) => l.status_id === status.id)
        .reduce((sum, l) => sum + Number(l.estimated_deal_value), 0),
    }));

  return result;
}

/**
 * Get team performance leaderboard.
 * Gap #4 Fix: Sales sees only own row + team aggregates.
 * BRD §2.4: "View individual performance — Sales: Own only"
 */
export async function getPerformanceByOwner() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: statuses } = await supabase
    .from('statuses')
    .select('id, slug');

  const wonId = statuses?.find((s) => s.slug === 'won')?.id;
  const lostId = statuses?.find((s) => s.slug === 'lost')?.id;

  const { data: users } = await supabase
    .from('users')
    .select('id, name, avatar_url')
    .eq('is_active', true);

  const { data: leads } = await supabase
    .from('leads')
    .select('owner_id, status_id, estimated_deal_value');

  // Calculate per-user metrics
  const performance = (users || []).map((user) => {
    const userLeads = (leads || []).filter((l) => l.owner_id === user.id);
    const wonLeads = userLeads.filter((l) => l.status_id === wonId);
    const lostLeads = userLeads.filter((l) => l.status_id === lostId);
    const revenue = wonLeads.reduce((sum, l) => sum + Number(l.estimated_deal_value), 0);
    const conversionRate = wonLeads.length + lostLeads.length > 0
      ? (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100
      : 0;

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      leads_owned: userLeads.length,
      leads_won: wonLeads.length,
      revenue_won: revenue,
      conversion_rate: Math.round(conversionRate * 10) / 10,
    };
  });

  // Role-based filtering (Gap #4)
  if (currentUser?.role === 'sales') {
    const ownRow = performance.find((p) => p.id === currentUser.id);
    const teamTotals = {
      id: 'team',
      name: 'Team Total',
      avatar_url: null,
      leads_owned: performance.reduce((sum, p) => sum + p.leads_owned, 0),
      leads_won: performance.reduce((sum, p) => sum + p.leads_won, 0),
      revenue_won: performance.reduce((sum, p) => sum + p.revenue_won, 0),
      conversion_rate: 0,
    };
    return { individual: ownRow ? [ownRow] : [], teamTotals };
  }

  // Admin / Client Manager: see all individuals
  return { individual: performance, teamTotals: null };
}

/**
 * Get Won vs Lost trend over time.
 * BRD §2.10: Weekly/monthly trend chart.
 */
export async function getWonLostTrend(period: 'week' | 'month' = 'week') {
  const supabase = await createClient();

  const { data: statuses } = await supabase
    .from('statuses')
    .select('id, slug');

  const wonId = statuses?.find((s) => s.slug === 'won')?.id;
  const lostId = statuses?.find((s) => s.slug === 'lost')?.id;

  // Get last 12 periods of data
  const { data: statusHistory } = await supabase
    .from('lead_status_history')
    .select('to_status_id, created_at')
    .in('to_status_id', [wonId!, lostId!])
    .order('created_at', { ascending: true });

  // Group by period
  const grouped: Record<string, { won: number; lost: number }> = {};

  (statusHistory || []).forEach((entry) => {
    const date = new Date(entry.created_at);
    let key: string;

    if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped[key]) grouped[key] = { won: 0, lost: 0 };
    if (entry.to_status_id === wonId) grouped[key].won++;
    if (entry.to_status_id === lostId) grouped[key].lost++;
  });

  return Object.entries(grouped).map(([period, counts]) => ({
    period,
    ...counts,
  }));
}

/**
 * Get recent activity feed for the dashboard.
 * BRD §2.10: "Recent Activity Feed — last 20 activities."
 */
export async function getRecentActivity(limit: number = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      user:users!activities_created_by_fkey(id, name, avatar_url),
      lead:leads!activities_lead_id_fkey(id, name),
      from_status:statuses!activities_from_status_id_fkey(name, color),
      to_status:statuses!activities_to_status_id_fkey(name, color)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

// ============================================================
// Helper Functions
// ============================================================

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}
