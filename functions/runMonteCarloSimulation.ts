import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runs = 10000;
  const results = [];

  for (let i = 0; i < runs; i++) {
    const randomReturn = 50000 + (Math.random() - 0.5) * 20000;
    results.push(randomReturn);
  }

  results.sort((a, b) => a - b);

  const distribution = [];
  for (let i = 0; i < 50; i++) {
    distribution.push({
      value: Math.round(results[i * 200]),
      probability: 2
    });
  }

  return Response.json({
    best_case: Math.round(results[runs - 1]),
    expected: Math.round(results[runs / 2]),
    worst_case: Math.round(results[0]),
    distribution
  });
});