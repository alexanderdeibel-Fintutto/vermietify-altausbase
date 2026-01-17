import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { feature_code } = body;

    // Get user subscription
    const subscriptions = await base44.entities.UserSubscription.filter({ 
      user_email: user.email 
    });
    
    if (subscriptions.length === 0) {
      return Response.json({ hasAccess: false, reason: 'No subscription found' });
    }

    const subscription = subscriptions[0];
    const plan = await base44.entities.SubscriptionPlan.get(subscription.plan_id);
    
    const planFeatures = typeof plan.features === 'string' 
      ? JSON.parse(plan.features) 
      : plan.features;

    const hasAccess = planFeatures.includes(feature_code);

    return Response.json({ 
      hasAccess,
      currentPlan: plan.name,
      requiredFeature: feature_code
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});