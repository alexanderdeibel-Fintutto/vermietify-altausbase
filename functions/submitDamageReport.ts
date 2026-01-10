import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, severity } = await req.json();

  await base44.entities.MaintenanceTask.create({
    title,
    description,
    category: 'general',
    priority: severity,
    status: 'pending'
  });

  await base44.integrations.Core.SendEmail({
    to: 'admin@example.com',
    subject: `Schadensmeldung: ${title}`,
    body: `${user.full_name} hat einen Schaden gemeldet:\n\n${description}`
  });

  return Response.json({ success: true });
});