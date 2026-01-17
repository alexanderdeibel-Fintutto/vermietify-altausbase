import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type } = body;

    const subscriptions = await base44.entities.UserSubscription.filter({ 
      user_email: user.email 
    });
    
    if (subscriptions.length === 0) {
      return Response.json({ 
        allowed: false, 
        reason: 'No subscription' 
      });
    }

    const subscription = subscriptions[0];
    const plan = await base44.entities.SubscriptionPlan.get(subscription.plan_id);
    
    const entities = await base44.entities[entity_type].list();
    const current = entities.length;

    const limits = {
      Building: plan.max_buildings,
      Unit: plan.max_units
    };

    const max = limits[entity_type];
    
    if (max === -1) {
      return Response.json({ allowed: true, unlimited: true });
    }

    const allowed = current < max;

    return Response.json({ 
      allowed,
      current,
      max,
      remaining: max - current
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});