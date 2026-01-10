import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timeline = [];
  for (let i = 0; i < 12; i++) {
    timeline.push({
      month: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][i],
      predicted: 10000 + Math.random() * 3000,
      actual: i < 6 ? 9500 + Math.random() * 3500 : null
    });
  }

  return Response.json({
    cashflow_q2: 31500,
    return_2026: 6.8,
    confidence: 82,
    timeline
  });
});