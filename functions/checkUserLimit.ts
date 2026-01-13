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

    // Get the limit definition
    const limits = await base44.asServiceRole.entities.UsageLimit.filter({ 
      limit_code,
      is_active: true 
    });
    const limit = limits[0];

    if (!limit) {
      return Response.json({ error: 'Limit not found' }, { status: 404 });
    }

    // Get user's limit
    const userLimits = await base44.asServiceRole.entities.UserLimit.filter({
      user_email: user.email,
      limit_id: limit.id
    });
    const userLimit = userLimits[0];

    if (!userLimit) {
      return Response.json({ error: 'User limit not initialized' }, { status: 404 });
    }

    // Calculate current usage if entity_to_count is specified
    let actualUsage = userLimit.current_usage;
    if (limit.entity_to_count) {
      try {
        const filter = limit.count_filter ? JSON.parse(limit.count_filter) : {};
        const entities = await base44.entities[limit.entity_to_count].filter(filter);
        actualUsage = entities.length;

        // Update stored usage if different
        if (actualUsage !== userLimit.current_usage) {
          await base44.asServiceRole.entities.UserLimit.update(userLimit.id, {
            current_usage: actualUsage,
            last_checked: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error counting entities:', error);
      }
    }

    const isUnlimited = userLimit.limit_value === -1;
    const isAllowed = isUnlimited || actualUsage < userLimit.limit_value;
    const percentage = isUnlimited ? 0 : (actualUsage / userLimit.limit_value) * 100;
    const isWarning = !isUnlimited && percentage >= (limit.warning_threshold || 80);

    return Response.json({
      allowed: isAllowed,
      current_usage: actualUsage,
      limit_value: userLimit.limit_value,
      is_unlimited: isUnlimited,
      remaining: isUnlimited ? -1 : userLimit.limit_value - actualUsage,
      percentage,
      is_warning: isWarning,
      limit_name: limit.name,
      limit_unit: limit.unit,
      limit_type: limit.limit_type
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});