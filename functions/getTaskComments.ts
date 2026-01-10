import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { task_id } = await req.json();

  const comments = [
    { id: '1', user_name: 'Max Müller', text: 'Bitte bis Ende der Woche erledigen' },
    { id: '2', user_name: 'Anna Schmidt', text: 'Material bestellt' }
  ];

  return Response.json({ comments });
});