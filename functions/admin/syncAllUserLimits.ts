import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const subscriptions = await base44.asServiceRole.entities.UserSubscription.list();
    const limits = await base44.asServiceRole.entities.UsageLimit.list();
    
    let updated = 0;

    for (const sub of subscriptions) {
      const tierLimits = await base44.asServiceRole.entities.TierLimit.filter({ 
        tier_id: sub.tier_id 
      });

      for (const tl of tierLimits) {
        const limit = limits.find(l => l.id === tl.limit_id);
        if (!limit) continue;

        let currentUsage = 0;

        // Count current usage
        if (limit.entity_to_count) {
          const filter = limit.count_filter ? JSON.parse(limit.count_filter) : {};
          filter.created_by = sub.user_email;
          
          const entities = await base44.asServiceRole.entities[limit.entity_to_count].filter(filter);
          currentUsage = entities.length;
        }

        // Update or create UserLimit
        const userLimits = await base44.asServiceRole.entities.UserLimit.filter({
          user_email: sub.user_email,
          limit_id: limit.id
        });

        const isWarning = tl.limit_value !== -1 && 
          (currentUsage / tl.limit_value) >= ((limit.warning_threshold || 80) / 100);

        if (userLimits[0]) {
          await base44.asServiceRole.entities.UserLimit.update(userLimits[0].id, {
            current_usage: currentUsage,
            limit_value: tl.limit_value,
            last_checked: new Date().toISOString(),
            warning_sent: isWarning
          });
        } else {
          await base44.asServiceRole.entities.UserLimit.create({
            user_email: sub.user_email,
            limit_id: limit.id,
            current_usage: currentUsage,
            limit_value: tl.limit_value,
            last_checked: new Date().toISOString(),
            warning_sent: isWarning
          });
        }

        updated++;
      }
    }

    return Response.json({ 
      success: true,
      subscriptions_processed: subscriptions.length,
      limits_updated: updated
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});