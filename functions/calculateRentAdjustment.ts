import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { current_rent, area } = await req.json();

  const local_average = 12.50;
  const recommended_rent = area * local_average;

  return Response.json({
    recommended_rent: recommended_rent.toFixed(2),
    local_average: local_average.toFixed(2)
  });
});