import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reserve_id } = await req.json();
    const reserve = await base44.asServiceRole.entities.Reserve.read(reserve_id);

    const remaining = reserve.target_amount - reserve.current_amount;
    const monthsToTarget = reserve.monthly_contribution > 0 
      ? Math.ceil(remaining / reserve.monthly_contribution)
      : 0;

    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsToTarget);

    return Response.json({ 
      success: true,
      current: reserve.current_amount,
      target: reserve.target_amount,
      remaining,
      months_to_target: monthsToTarget,
      projected_completion: projectedDate.toISOString().split('T')[0],
      fill_percentage: Math.round((reserve.current_amount / reserve.target_amount) * 100)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});