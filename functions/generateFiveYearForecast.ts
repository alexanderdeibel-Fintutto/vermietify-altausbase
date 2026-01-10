import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentYear = new Date().getFullYear();
  const data = [];

  for (let i = 0; i < 5; i++) {
    data.push({
      year: currentYear + i,
      wealth: 500000 + (i * 50000),
      income: 60000 + (i * 5000),
      tax: 20000 + (i * 1500)
    });
  }

  return Response.json({ data });
});