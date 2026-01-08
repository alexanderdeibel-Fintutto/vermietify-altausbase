import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[NOTIFY] Checking for critical gaps...');

    // Hole kritische Wissenslücken
    const gaps = await base44.entities.KnowledgeGap.filter();
    const criticalGaps = gaps.filter(g => g.business_impact === 'CRITICAL');

    if (criticalGaps.length === 0) {
      return Response.json({ success: true, notifications_sent: 0 });
    }

    // Hole Admin-User
    const admins = await base44.asServiceRole.entities.User.filter();
    const adminUsers = admins.filter(u => u.role === 'admin');

    let notificationsSent = 0;

    for (const admin of adminUsers) {
      try {
        const subject = `🚨 ${criticalGaps.length} kritische Wissenslücken erkannt`;
        const body = `
          <h2>Kritische Wissenslücken in base44</h2>
          
          <p>Es wurden ${criticalGaps.length} kritische Wissenslücken erkannt, die sofortige Aufmerksamkeit benötigen:</p>
          
          <ul>
          ${criticalGaps.slice(0, 5).map(gap => `
            <li>
              <strong>${gap.description}</strong><br/>
              Typ: ${gap.gap_type} | Häufigkeit: ${gap.frequency}x | Priorität: ${gap.assigned_priority}/10
            </li>
          `).join('')}
          </ul>
          
          <p>
            <a href="${process.env.BASE44_APP_URL || 'https://base44.de'}/knowledge-management" 
               style="background: #dc2626; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Zur Management-Console
            </a>
          </p>
        `;

        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject,
          body
        });

        notificationsSent++;
      } catch (error) {
        console.error('[ERROR] Notifying admin:', error.message);
      }
    }

    return Response.json({
      success: true,
      critical_gaps: criticalGaps.length,
      notifications_sent: notificationsSent
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});