import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem_id, notification_type } = await req.json();

    // Problem laden
    const problems = await base44.asServiceRole.entities.UserProblem.filter({ id: problem_id });
    if (problems.length === 0) {
      return Response.json({ error: 'Problem not found' }, { status: 404 });
    }
    const problem = problems[0];

    const notifications = [];

    // P1 Critical - Sofortige Benachrichtigung an alle Admins
    if (problem.business_priority === 'p1_critical') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          type: 'critical_issue',
          title: '🔴 KRITISCHES PROBLEM',
          message: `${problem.problem_titel} - Sofortige Bearbeitung erforderlich!`,
          data: {
            problem_id: problem.id,
            priority: problem.business_priority,
            score: problem.priority_score,
            business_area: problem.business_area
          },
          is_read: false,
          action_url: `/SupportCenter?problem=${problem.id}`
        });
        notifications.push({ recipient: admin.email, type: 'critical' });
      }
    }

    // Revenue-Blocking - Finance Team benachrichtigen
    if (problem.business_impact === 'revenue_blocking') {
      const financeUsers = await base44.asServiceRole.entities.User.filter({ 
        department: 'finance' 
      });
      
      for (const finUser of financeUsers) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: finUser.id,
          type: 'revenue_impact',
          title: '💰 Revenue-Impact erkannt',
          message: `Problem betrifft Umsatz: ${problem.problem_titel}`,
          data: { problem_id: problem.id },
          is_read: false
        });
        notifications.push({ recipient: finUser.email, type: 'revenue_impact' });
      }
    }

    // Compliance Risk - Legal Team
    if (problem.business_impact === 'compliance_risk') {
      const legalUsers = await base44.asServiceRole.entities.User.filter({ 
        department: 'legal' 
      });
      
      for (const legalUser of legalUsers) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: legalUser.id,
          type: 'compliance_risk',
          title: '⚖️ Compliance-Risiko',
          message: `Rechtliches Risiko erkannt: ${problem.problem_titel}`,
          data: { problem_id: problem.id },
          is_read: false
        });
        notifications.push({ recipient: legalUser.email, type: 'compliance' });
      }
    }

    // Zugewiesenen Entwickler benachrichtigen
    if (problem.assigned_to) {
      const assignedDev = await base44.asServiceRole.entities.User.filter({ 
        id: problem.assigned_to 
      });
      
      if (assignedDev.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: assignedDev[0].id,
          type: 'problem_assigned',
          title: '📋 Neues Problem zugewiesen',
          message: `${problem.problem_titel} (${problem.business_priority})`,
          data: { problem_id: problem.id },
          is_read: false,
          action_url: `/SupportCenter?problem=${problem.id}`
        });
        notifications.push({ recipient: assignedDev[0].email, type: 'assignment' });
      }
    }

    // Tester benachrichtigen falls Retest erforderlich
    if (problem.retest_required && problem.retest_assigned_to) {
      const tester = await base44.asServiceRole.entities.User.filter({ 
        id: problem.retest_assigned_to 
      });
      
      if (tester.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: tester[0].id,
          type: 'retest_required',
          title: '🔄 Retest erforderlich',
          message: `Bitte Problem erneut testen: ${problem.problem_titel}`,
          data: { problem_id: problem.id },
          is_read: false
        });
        notifications.push({ recipient: tester[0].email, type: 'retest' });
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notifications.length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Error handling notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});