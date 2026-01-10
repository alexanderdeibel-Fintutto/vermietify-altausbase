import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reminders = [
    { id: '1', tenant_name: 'Max Müller', message: 'Miete überfällig', level: 1, days_overdue: 5 },
    { id: '2', tenant_name: 'Anna Schmidt', message: 'Zahlungserinnerung', level: 2, days_overdue: 15 }
  ];

  return Response.json({ reminders });
});