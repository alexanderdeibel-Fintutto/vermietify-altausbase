import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  console.log('Starting daily usage sync...');
  
  try {
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      status: { $in: ['active', 'trialing'] }
    });
    
    const limits = await base44.asServiceRole.entities.UsageLimit.list();
    
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    for (const sub of subscriptions) {
      const planLimitsData = await base44.asServiceRole.entities.PlanLimit.filter({
        plan_id: sub.plan_id
      });
      
      for (const limit of limits) {
        const planLimit = planLimitsData.find(pl => pl.limit_id === limit.id);
        const maxValue = planLimit?.limit_value ?? 0;
        
        let currentCount = 0;
        
        if (limit.reset_period === 'never') {
          const entities = await base44.asServiceRole.entities[limit.entity_to_count].filter({
            created_by: sub.user_email
          });
          currentCount = entities.length;
        } else if (limit.reset_period === 'monthly') {
          const entities = await base44.asServiceRole.entities[limit.entity_to_count].filter({
            created_by: sub.user_email,
            created_date: { $gte: monthStart.toISOString(), $lte: monthEnd.toISOString() }
          });
          currentCount = entities.length;
        }
        
        const existingLogs = await base44.asServiceRole.entities.UsageLog.filter({
          user_email: sub.user_email,
          limit_key: limit.key,
          period_start: monthStart.toISOString().split('T')[0]
        });
        
        const overage = maxValue === -1 ? 0 : Math.max(0, currentCount - maxValue);
        const overageCharged = overage * (limit.overage_price_per_unit || 0);
        
        if (existingLogs.length > 0) {
          await base44.asServiceRole.entities.UsageLog.update(existingLogs[0].id, {
            current_count: currentCount,
            limit_value: maxValue,
            overage_count: overage,
            overage_charged: overageCharged
          });
        } else {
          await base44.asServiceRole.entities.UsageLog.create({
            user_email: sub.user_email,
            limit_key: limit.key,
            period_start: monthStart.toISOString().split('T')[0],
            period_end: monthEnd.toISOString().split('T')[0],
            current_count: currentCount,
            limit_value: maxValue,
            overage_count: overage,
            overage_charged: overageCharged
          });
        }
      }
    }
    
    console.log(`Usage sync completed for ${subscriptions.length} subscriptions`);
    return Response.json({ success: true, processed: subscriptions.length });
    
  } catch (error) {
    console.error('Usage sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});