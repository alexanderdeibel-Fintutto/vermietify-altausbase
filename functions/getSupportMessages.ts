import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = [
    { text: 'Hallo! Wie kann ich Ihnen helfen?', is_user: false, timestamp: new Date(Date.now() - 60000).toISOString() }
  ];

  return Response.json({ messages });
});