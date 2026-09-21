import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * POST /api/cron/daily-digest — Daily Follow-up Email
 * BRD §2.11: "Optional daily email digest per user."
 *
 * Called by Vercel Cron at 8:00 AM IST, Mon–Sat.
 * Sends each active user a summary of their pending follow-ups.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!authHeader || !safeCompare(authHeader, expectedHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create admin supabase client (no user session for cron jobs)
    const supabase = await createAdminClient();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const today = new Date().toISOString().split('T')[0];

    // Get all active users with pagination
    let allUsers: any[] = [];
    let userPage = 0;
    while (true) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('is_active', true)
        .range(userPage * 1000, (userPage + 1) * 1000 - 1);
        
      if (!users || users.length === 0) break;
      allUsers = allUsers.concat(users);
      userPage++;
    }

    if (allUsers.length === 0) {
      return NextResponse.json({ message: 'No active users.' });
    }

    // Get terminal status IDs to exclude
    const { data: terminalStatuses } = await supabase
      .from('statuses')
      .select('id')
      .eq('is_terminal', true);

    const terminalIds = terminalStatuses?.map((s) => s.id) || [];

    let emailsSent = 0;

    for (const user of allUsers) {
      // Get pending reminders for this user with pagination
      let allReminders: any[] = [];
      let remPage = 0;
      while (true) {
        const { data: reminders } = await supabase
          .from('reminders')
          .select('title, due_date, lead:leads!reminders_lead_id_fkey(name)')
          .eq('assigned_to', user.id)
          .eq('status', 'pending')
          .lte('due_date', today)
          .order('due_date', { ascending: true })
          .range(remPage * 1000, (remPage + 1) * 1000 - 1);
          
        if (!reminders || reminders.length === 0) break;
        allReminders = allReminders.concat(reminders);
        remPage++;
      }

      // Get overdue follow-ups for leads owned by this user
      const { data: overdueLeads } = await supabase
        .from('leads')
        .select('name, next_followup_date')
        .eq('owner_id', user.id)
        .lt('next_followup_date', today)
        .not('status_id', 'in', `(${terminalIds.join(',')})`);

      // Get today's follow-ups
      const { data: todayLeads } = await supabase
        .from('leads')
        .select('name, next_followup_date')
        .eq('owner_id', user.id)
        .eq('next_followup_date', today)
        .not('status_id', 'in', `(${terminalIds.join(',')})`);

      const totalItems = (allReminders.length) + (overdueLeads?.length || 0) + (todayLeads?.length || 0);

      // Skip if nothing to report
      if (totalItems === 0) continue;

      // Build email body
      const overdueSection = (overdueLeads?.length || 0) > 0
        ? `\n⚠️ Overdue Follow-ups (${overdueLeads!.length}):\n${overdueLeads!.map((l) => `  • ${l.name} — due ${l.next_followup_date}`).join('\n')}\n`
        : '';

      const todaySection = (todayLeads?.length || 0) > 0
        ? `\n📅 Today's Follow-ups (${todayLeads!.length}):\n${todayLeads!.map((l) => `  • ${l.name}`).join('\n')}\n`
        : '';

      const reminderSection = (allReminders.length) > 0
        ? `\n🔔 Pending Reminders (${allReminders.length}):\n${allReminders.map((r: any) => `  • ${r.title} — ${r.lead?.name || 'Unknown lead'}`).join('\n')}\n`
        : '';

      await resend.emails.send({
        from: 'Foremark CRM <crm@foremark.in>',
        to: user.email,
        subject: `Daily Digest: ${totalItems} items need your attention`,
        text: `Hi ${user.name},\n\nHere's your daily summary:\n${overdueSection}${todaySection}${reminderSection}\nView in CRM: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || 'https://crm.foremark.in'}\n\n— Foremark CRM`,
      });

      emailsSent++;
    }

    return NextResponse.json({
      message: `Daily digest sent to ${emailsSent} users.`,
    });
  } catch (error: any) {
    console.error('Daily digest error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
