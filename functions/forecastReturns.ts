import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timeline = [];
  for (let i = 0; i < 5; i++) {
    timeline.push({
      year: 2026 + i,
      return: 5.5 + (Math.random() - 0.5) * 2
    });
  }

  return Response.json({
    expected_return: 6.2,
    confidence: 78,
    timeline
  });
});