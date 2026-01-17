import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has subscription
    const existingSubs = await base44.entities.UserSubscription.filter({ 
      user_email: user.email 
    });

    if (existingSubs.length > 0) {
      return Response.json({ 
        success: true, 
        message: 'User already initialized',
        skipped: true 
      });
    }

    // Get Starter plan
    const plans = await base44.entities.SubscriptionPlan.filter({ 
      internal_code: 'STARTER' 
    });
    const starterPlan = plans[0];

    if (!starterPlan) {
      return Response.json({ error: 'Starter plan not found' }, { status: 404 });
    }

    // Create trial subscription for Professional plan
    const proPlan = await base44.entities.SubscriptionPlan.filter({ 
      internal_code: 'PRO' 
    });

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    await base44.entities.UserSubscription.create({
      user_email: user.email,
      plan_id: proPlan[0]?.id || starterPlan.id,
      status: 'TRIAL',
      billing_cycle: 'MONTHLY',
      start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      next_billing_date: trialEnd.toISOString(),
      payment_method: 'NONE'
    });

    // Send welcome email
    await base44.functions.invoke('sendWelcomeEmail', {
      email: user.email,
      name: user.full_name,
      user_type: 'vermieter'
    });

    return Response.json({ 
      success: true,
      message: 'User initialized with trial subscription' 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});