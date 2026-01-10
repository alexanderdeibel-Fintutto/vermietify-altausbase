import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { scenarios } = await req.json();

  const results = scenarios.map(s => {
    const totalIncome = (s.income || 0) + (s.rental_income || 0);
    const tax = totalIncome * 0.35;
    const net = totalIncome - tax;

    return {
      name: s.name,
      income: totalIncome,
      tax: tax.toFixed(0),
      net: net.toFixed(0)
    };
  });

  return Response.json({ scenarios: results });
});