import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sources = [
    { source: 'Mieteinnahmen', contribution: 45, value: 54000 },
    { source: 'Kapitalerträge', contribution: 30, value: 36000 },
    { source: 'Wertsteigerung', contribution: 20, value: 24000 },
    { source: 'Sonstige', contribution: 5, value: 6000 }
  ];

  return Response.json({ sources });
});