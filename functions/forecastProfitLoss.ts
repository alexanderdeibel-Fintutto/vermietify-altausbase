import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timeline = [];
  for (let i = 0; i < 6; i++) {
    timeline.push({
      month: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'][i],
      profit: 5000 + Math.random() * 3000
    });
  }

  return Response.json({
    revenue: 120000,
    costs: 85000,
    profit: 35000,
    timeline
  });
});