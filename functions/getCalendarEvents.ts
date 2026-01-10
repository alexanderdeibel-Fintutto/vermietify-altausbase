import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = [
    { title: 'Umsatzsteuer-Voranmeldung', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Betriebsprüfung Vorbereitung', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  return Response.json({ events });
});