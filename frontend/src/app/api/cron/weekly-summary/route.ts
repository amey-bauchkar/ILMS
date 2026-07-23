import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';

/**
 * POST /api/cron/weekly-summary — Weekly Pipeline Report
 * BRD §2.11: "Optional weekly summary email to Admin."
 *
 * Called by Vercel Cron at 9:00 AM IST every Monday.
 * Sends Admin users a pipeline summary for the past week.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get the start of last week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekStartStr = weekStart.toISOString();

    // Get admin users
    const { data: admins } = await supabase
      .from('users')
      .select('email, name')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (!admins || admins.length === 0) {
      return NextResponse.json({ message: 'No active admins.' });
    }

    // Get status IDs
    const { data: statuses } = await supabase
      .from('statuses')
      .select('id, slug, name');

    const wonId = statuses?.find((s) => s.slug === 'won')?.id;
    const lostId = statuses?.find((s) => s.slug === 'lost')?.id;

    // New leads this week
    const { count: newLeadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStartStr);

    // Won this week
    const { count: wonCount } = await supabase
      .from('lead_status_history')
      .select('*', { count: 'exact', head: true })
      .eq('to_status_id', wonId!)
      .gte('created_at', weekStartStr);

    // Lost this week
    const { count: lostCount } = await supabase
      .from('lead_status_history')
      .select('*', { count: 'exact', head: true })
      .eq('to_status_id', lostId!)
      .gte('created_at', weekStartStr);

    // Total pipeline value (open leads)
    const terminalIds = statuses?.filter((s) => ['won', 'lost', 'junk'].includes(s.slug)).map((s) => s.id) || [];
    const { data: openLeads } = await supabase
      .from('leads')
      .select('estimated_deal_value')
      .not('status_id', 'in', `(${terminalIds.join(',')})`);

    const pipelineValue = openLeads
      ? openLeads.reduce((sum, l) => sum + Number(l.estimated_deal_value), 0)
      : 0;

    // Total active leads
    const { count: totalActive } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('status_id', 'in', `(${terminalIds.join(',')})`);

    // Build email
    const subject = `Weekly Pipeline Report — ${newLeadsCount || 0} new, ${wonCount || 0} won, ${lostCount || 0} lost`;
    const body = `Weekly Pipeline Report\n${'='.repeat(40)}\n\n` +
      `📊 This Week's Highlights:\n` +
      `  • New leads:        ${newLeadsCount || 0}\n` +
      `  • Leads won:        ${wonCount || 0}\n` +
      `  • Leads lost:       ${lostCount || 0}\n\n` +
      `💰 Pipeline:\n` +
      `  • Active leads:     ${totalActive || 0}\n` +
      `  • Pipeline value:   ₹${pipelineValue.toLocaleString('en-IN')}\n\n` +
      `View full dashboard: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || 'https://crm.foremark.in'}/dashboard\n\n` +
      `— Foremark CRM`;

    let emailsSent = 0;
    for (const admin of admins) {
      await resend.emails.send({
        from: 'Foremark CRM <crm@foremark.in>',
        to: admin.email,
        subject,
        text: body,
      });
      emailsSent++;
    }

    return NextResponse.json({
      message: `Weekly summary sent to ${emailsSent} admin(s).`,
    });
  } catch (error: any) {
    console.error('Weekly summary error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
