import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();

    const reports = await base44.entities.UserProblem.filter({ id: report_id });
    if (!reports || reports.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];

    if (report.business_priority === "p1_critical") {
      await base44.asServiceRole.entities.Notification.create({
        user_id: null,
        notification_type: "critical_issue_alert",
        title: `🚨 CRITICAL: ${report.problem_titel}`,
        message: `Kritisches Problem in ${report.business_area || report.betroffenes_modul}: ${report.problem_beschreibung?.substring(0, 100)}...`,
        priority: "high",
        is_read: false,
        action_url: `/problem-reports?id=${report.id}`
      });

      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `🚨 CRITICAL Issue: ${report.problem_titel}`,
          body: `
            <h2>Kritisches Problem gemeldet</h2>
            <p><strong>Titel:</strong> ${report.problem_titel}</p>
            <p><strong>Bereich:</strong> ${report.business_area || report.betroffenes_modul}</p>
            <p><strong>Priority Score:</strong> ${report.priority_score}</p>
            <p><strong>Beschreibung:</strong> ${report.problem_beschreibung}</p>
            <p><strong>Reporter:</strong> ${report.tester_name || report.created_by}</p>
            <p><a href="${Deno.env.get('APP_URL') || ''}/problem-reports?id=${report.id}">Zum Problem →</a></p>
          `
        });
      }
    }

    if (report.business_priority === "p2_high") {
      await base44.asServiceRole.entities.Notification.create({
        user_id: null,
        notification_type: "high_priority_issue",
        title: `⚠️ High Priority: ${report.problem_titel}`,
        message: `Wichtiges Problem in ${report.business_area || report.betroffenes_modul}`,
        priority: "medium",
        is_read: false,
        action_url: `/problem-reports?id=${report.id}`
      });
    }

    const areaAssignments = {
      auth_login: "security-team",
      finances: "backend-team",
      objects: "core-team",
      tenants: "core-team",
      documents: "frontend-team"
    };

    const suggestedAssignee = areaAssignments[report.business_area];
    if (suggestedAssignee && !report.assigned_to) {
      await base44.asServiceRole.entities.UserProblem.update(report_id, {
        assigned_to: suggestedAssignee,
        status: "triaged"
      });
    }

    return Response.json({ 
      success: true,
      notifications_sent: report.business_priority === "p1_critical" ? "email_and_notification" : "notification_only",
      auto_assigned: !!suggestedAssignee
    });

  } catch (error) {
    console.error('Error handling notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});