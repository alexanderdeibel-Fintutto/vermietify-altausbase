import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit_code, increment = 1 } = await req.json();

    if (!limit_code) {
      return Response.json({ error: 'limit_code required' }, { status: 400 });
    }

    // Get the limit
    const limits = await base44.asServiceRole.entities.UsageLimit.filter({ 
      limit_code 
    });
    const limit = limits[0];

    if (!limit) {
      return Response.json({ error: 'Limit not found' }, { status: 404 });
    }

    // Get user limit
    const userLimits = await base44.asServiceRole.entities.UserLimit.filter({
      user_email: user.email,
      limit_id: limit.id
    });

    const userLimit = userLimits[0];

    if (!userLimit) {
      return Response.json({ error: 'User limit not initialized' }, { status: 404 });
    }

    // Check if allowed
    if (userLimit.limit_value !== -1 && 
        userLimit.current_usage + increment > userLimit.limit_value) {
      return Response.json({ 
        allowed: false,
        message: 'Limit erreicht',
        current: userLimit.current_usage,
        limit: userLimit.limit_value
      }, { status: 403 });
    }

    // Update usage
    const newUsage = userLimit.current_usage + increment;
    await base44.asServiceRole.entities.UserLimit.update(userLimit.id, {
      current_usage: newUsage,
      last_checked: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      current_usage: newUsage,
      limit_value: userLimit.limit_value
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});