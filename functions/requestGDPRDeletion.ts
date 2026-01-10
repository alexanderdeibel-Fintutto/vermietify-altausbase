import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await base44.integrations.Core.SendEmail({
    to: 'admin@example.com',
    subject: 'DSGVO Löschantrag',
    body: `Benutzer ${user.email} hat die Löschung aller persönlichen Daten beantragt.`
  });

  return Response.json({ success: true });
});