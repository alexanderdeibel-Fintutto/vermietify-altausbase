import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const data = months.map((month, idx) => ({
    month,
    wealth: 100000 + (idx * 5000) + Math.random() * 10000,
    tax: 15000 + (idx * 500) + Math.random() * 2000
  }));

  return Response.json({ data });
});