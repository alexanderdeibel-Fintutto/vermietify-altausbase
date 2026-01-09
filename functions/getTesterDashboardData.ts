import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin required' }, { status: 403 });
    }

    // Alle Einladungen holen
    const invitations = await base44.asServiceRole.entities.TesterInvitation.list('-created_date', 100);

    // Alle TestAccounts holen
    const testAccounts = await base44.asServiceRole.entities.TestAccount.list('-created_at_timestamp', 100);

    // Statistiken zusammenstellen
    const stats = {
      total_invited: invitations.length,
      pending_invitations: invitations.filter(i => i.status === 'pending').length,
      active_testers: testAccounts.filter(t => t.is_active && t.last_login).length,
      all_testers: testAccounts.length,
      total_sessions: testAccounts.reduce((sum, t) => sum + (t.total_sessions || 0), 0),
      total_pages_visited: testAccounts.reduce((sum, t) => sum + (t.pages_visited || 0), 0),
      total_problems_reported: testAccounts.reduce((sum, t) => sum + (t.problems_reported || 0), 0),
      total_session_minutes: testAccounts.reduce((sum, t) => sum + (t.total_session_minutes || 0), 0)
    };

    // Zusammengefasste Tester-Liste
    const testersList = testAccounts.map(account => {
      const invitation = invitations.find(i => i.id === account.invitation_id);
      return {
        id: account.id,
        name: account.tester_name,
        email: account.test_email,
        status: account.is_active ? 'active' : 'inactive',
        invitation_status: invitation?.status || 'unknown',
        last_activity: account.last_activity,
        last_login: account.last_login,
        first_login: account.first_login,
        sessions: account.total_sessions,
        pages: account.pages_visited,
        problems: account.problems_reported,
        invited_at: invitation?.created_date,
        accepted_at: invitation?.accepted_at
      };
    });

    // Ausstehende Einladungen
    const pendingInvitations = invitations
      .filter(i => i.status === 'pending')
      .map(i => ({
        id: i.id,
        name: i.tester_name,
        email: i.invited_email,
        invited_at: i.created_date,
        expires_at: i.expires_at,
        invited_by: i.invited_by,
        resend_count: i.resend_count || 0
      }));

    // Kürzliche Aktivitäten (letzte 50)
    const recentActivities = await base44.asServiceRole.entities.TesterActivity.list('-timestamp', 50);

    return Response.json({
      success: true,
      stats,
      testers: testersList,
      pending_invitations: pendingInvitations,
      recent_activities: recentActivities,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});