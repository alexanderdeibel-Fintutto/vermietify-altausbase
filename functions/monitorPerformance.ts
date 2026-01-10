import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const timeline = [];
  for (let i = 0; i < 24; i++) {
    timeline.push({
      time: `${i}:00`,
      response_time: 100 + Math.random() * 100
    });
  }

  return Response.json({
    load_time: 245,
    api_calls: 1523,
    error_rate: 0.3,
    timeline
  });
});