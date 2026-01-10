import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const monthly = [];
  let cumulative = 0;

  for (let i = 0; i < 12; i++) {
    const monthlyTax = 1500 + Math.random() * 500;
    cumulative += monthlyTax;
    monthly.push({
      month: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][i],
      tax: Math.round(monthlyTax)
    });
  }

  return Response.json({
    total_tax: Math.round(cumulative),
    monthly
  });
});