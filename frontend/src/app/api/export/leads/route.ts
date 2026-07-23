// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLeadsForExport, toCsv } from '@/../../backend/src/queries/export';

/**
 * GET /api/export/leads — CSV Export
 * BRD §2.4: Admin ✅, Client Manager ✅, Sales ❌
 * BRD §2.13: "Ability to export leads (and filtered views) to CSV at any time."
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role (Admin or CM only)
  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser || dbUser.role === 'sales') {
    return NextResponse.json(
      { error: 'Only Admin and Client Managers can export data.' },
      { status: 403 }
    );
  }

  // Parse filter params from URL
  const searchParams = request.nextUrl.searchParams;
  const filters = {
    status_id: searchParams.get('status_id') || undefined,
    source: searchParams.get('source') || undefined,
    owner_id: searchParams.get('owner_id') || undefined,
    priority: searchParams.get('priority') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
  };

  try {
    const data = await getLeadsForExport(filters);
    const csv = toCsv(data);
    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=leads_export_${date}.csv`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
