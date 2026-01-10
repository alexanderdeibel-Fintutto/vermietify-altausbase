import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const users = await base44.asServiceRole.entities.User.list(null, 100);
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const user of users) {
    const recentItems = await base44.asServiceRole.entities.FinancialItem.filter({
      created_date: { $gte: lastWeek }
    }, '-created_date', 20);

    const recentDocs = await base44.asServiceRole.entities.Document.filter({
      created_date: { $gte: lastWeek }
    }, '-created_date', 10);

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Ihre Wochenzusammenfassung',
      body: `Hallo ${user.full_name},\n\nLetzte Woche:\n- ${recentItems.length} neue Transaktionen\n- ${recentDocs.length} neue Dokumente\n\nViele Grüße`
    });
  }

  return Response.json({ success: true, sent: users.length });
});