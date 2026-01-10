import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const centers = [
    { name: 'Verwaltung', amount: 12500 },
    { name: 'Instandhaltung', amount: 18300 },
    { name: 'Marketing', amount: 5400 },
    { name: 'Personal', amount: 22100 },
    { name: 'Sonstiges', amount: 3200 }
  ];

  return Response.json({ centers });
});