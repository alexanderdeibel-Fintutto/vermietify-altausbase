import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rent_increase, vacancy_rate } = await req.json();

  const currentIncome = 120000;
  const adjustedIncome = currentIncome * (1 + rent_increase / 100) * (1 - vacancy_rate / 100);
  const change = ((adjustedIncome - currentIncome) / currentIncome * 100);

  return Response.json({
    projected_income: adjustedIncome.toFixed(0),
    change: change.toFixed(1)
  });
});