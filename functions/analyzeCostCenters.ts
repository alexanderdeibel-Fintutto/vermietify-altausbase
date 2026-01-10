import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = [
    { name: 'Verwaltung', value: 12000 },
    { name: 'Instandhaltung', value: 8500 },
    { name: 'Nebenkosten', value: 15000 },
    { name: 'Finanzierung', value: 20000 }
  ];

  return Response.json({ data });
});