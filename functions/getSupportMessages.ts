import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = [
    { from: 'support', text: 'Hallo! Wie kann ich Ihnen helfen?' },
    { from: 'user', text: 'Ich habe eine Frage zur Nebenkostenabrechnung' }
  ];

  return Response.json({ messages });
});