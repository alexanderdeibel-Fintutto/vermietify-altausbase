import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quarterly = [
    { quarter: 'Q1', revenue: 120000, expenses: 85000 },
    { quarter: 'Q2', revenue: 125000, expenses: 88000 },
    { quarter: 'Q3', revenue: 130000, expenses: 90000 },
    { quarter: 'Q4', revenue: 135000, expenses: 92000 }
  ];

  return Response.json({
    expected_profit: 145000,
    ebitda_margin: 28.5,
    quarterly
  });
});