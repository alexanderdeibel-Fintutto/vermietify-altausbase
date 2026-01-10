import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { building_id } = await req.json();

  return Response.json({
    class: 'B',
    score: 75,
    consumption: 95,
    savings_potential: 1200
  });
});