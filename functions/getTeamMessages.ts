import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = [
    { user_name: 'Admin', text: 'Neue Anfrage von Mieter Schmidt', timestamp: new Date().toISOString() },
    { user_name: 'Team', text: 'Wartung in Gebäude A erledigt', timestamp: new Date().toISOString() }
  ];

  return Response.json({ messages });
});