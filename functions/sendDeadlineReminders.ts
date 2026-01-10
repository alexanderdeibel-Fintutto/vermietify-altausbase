import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const deadlines = await base44.asServiceRole.entities.TaxDeadline.filter({
    deadline_date: {
      $gte: new Date().toISOString().split('T')[0],
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }, null, 50);

  const users = await base44.asServiceRole.entities.User.list(null, 100);

  for (const user of users) {
    if (deadlines.length > 0) {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Steuerfristen in den nächsten 7 Tagen',
        body: `Hallo ${user.full_name},\n\n${deadlines.length} Fristen stehen an:\n${deadlines.map(d => `- ${d.title}: ${d.deadline_date}`).join('\n')}`
      });
    }
  }

  return Response.json({ success: true, sent: users.length });
});