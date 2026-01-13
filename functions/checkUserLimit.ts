import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit_code } = await req.json();

    if (!limit_code) {
      return Response.json({ error: 'limit_code required' }, { status: 400 });
    }

    // Get user subscription
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({ 
      user_email: user.email 
    });
    const subscription = subscriptions[0];

    if (!subscription) {
      return Response.json({ 
        allowed: false, 
        reason: 'No active subscription' 
      });
    }

    // Get usage limit definition
    const limits = await base44.asServiceRole.entities.UsageLimit.filter({ 
      limit_code 
    });
    const usageLimit = limits[0];

    if (!usageLimit) {
      return Response.json({ 
        allowed: true, 
        reason: 'Limit not found - allowing' 
      });
    }

    // Get tier limit
    const tierLimits = await base44.asServiceRole.entities.TierLimit.filter({ 
      tier_id: subscription.tier_id,
      limit_id: usageLimit.id
    });
    const tierLimit = tierLimits[0];

    if (!tierLimit) {
      return Response.json({ 
        allowed: false, 
        reason: 'Limit not configured for tier' 
      });
    }

    // Check if feature flag
    if (usageLimit.limit_type === 'FEATURE_FLAG') {
      return Response.json({ 
        allowed: tierLimit.limit_value === 1,
        reason: tierLimit.limit_value === 1 ? 'Feature enabled' : 'Feature not available in plan'
      });
    }

    // Check quantifiable limit
    if (tierLimit.limit_value === -1) {
      return Response.json({ 
        allowed: true,
        unlimited: true,
        reason: 'Unlimited'
      });
    }

    // Get current usage
    let currentUsage = 0;
    if (usageLimit.entity_to_count) {
      const filter = usageLimit.count_filter ? JSON.parse(usageLimit.count_filter) : {};
      filter.created_by = user.email;
      
      const entities = await base44.asServiceRole.entities[usageLimit.entity_to_count].filter(filter);
      currentUsage = entities.length;
    }

    const allowed = currentUsage < tierLimit.limit_value;
    const isWarning = !allowed || (currentUsage / tierLimit.limit_value) >= ((usageLimit.warning_threshold || 80) / 100);

    // Update or create UserLimit record
    const userLimits = await base44.asServiceRole.entities.UserLimit.filter({
      user_email: user.email,
      limit_id: usageLimit.id
    });

    if (userLimits[0]) {
      await base44.asServiceRole.entities.UserLimit.update(userLimits[0].id, {
        current_usage: currentUsage,
        limit_value: tierLimit.limit_value,
        last_checked: new Date().toISOString(),
        warning_sent: isWarning
      });
    } else {
      await base44.asServiceRole.entities.UserLimit.create({
        user_email: user.email,
        limit_id: usageLimit.id,
        current_usage: currentUsage,
        limit_value: tierLimit.limit_value,
        last_checked: new Date().toISOString(),
        warning_sent: isWarning
      });
    }

    return Response.json({ 
      allowed,
      current_usage: currentUsage,
      limit_value: tierLimit.limit_value,
      is_warning: isWarning,
      limit_type: usageLimit.limit_type,
      reason: allowed ? 'Within limit' : 'Limit exceeded'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});