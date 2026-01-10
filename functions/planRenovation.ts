import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, budget } = await req.json();

  const valueIncrease = {
    bathroom: budget * 0.7,
    kitchen: budget * 0.8,
    heating: budget * 0.6,
    windows: budget * 0.5
  };

  const increase = valueIncrease[type] || budget * 0.5;
  const roi = (increase / budget * 100).toFixed(1);

  return Response.json({
    roi,
    value_increase: increase.toFixed(0),
    payback_years: (budget / (increase * 0.05)).toFixed(1)
  });
});