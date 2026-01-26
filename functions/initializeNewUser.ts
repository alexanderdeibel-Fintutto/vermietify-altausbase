import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already initialized
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({ 
      user_email: user.email 
    });

    if (existing.length > 0) {
      return Response.json({ 
        already_initialized: true,
        subscription: existing[0]
      });
    }

    // Get default tier
    const defaultTiers = await base44.asServiceRole.entities.PricingTier.filter({ 
      is_default: true,
      is_active: true
    });

    if (defaultTiers.length === 0) {
      return Response.json({ error: 'No default tier found' }, { status: 404 });
    }

    const defaultTier = defaultTiers[0];
    const today = new Date();
    const trialEnd = new Date(today);
    trialEnd.setDate(trialEnd.getDate() + (defaultTier.trial_days || 14));

    // Create subscription
    const subscription = await base44.asServiceRole.entities.UserSubscription.create({
      user_email: user.email,
      tier_id: defaultTier.id,
      status: defaultTier.trial_days > 0 ? 'TRIAL' : 'ACTIVE',
      billing_cycle: 'MONTHLY',
      trial_start_date: today.toISOString().split('T')[0],
      trial_end_date: trialEnd.toISOString().split('T')[0],
      auto_renew: true
    });

    // Initialize UserLimits
    const tierLimits = await base44.asServiceRole.entities.TierLimit.filter({ 
      tier_id: defaultTier.id 
    });

    const userLimitsToCreate = tierLimits.map(tl => ({
      user_email: user.email,
      limit_id: tl.limit_id,
      current_usage: 0,
      limit_value: tl.limit_value,
      last_checked: new Date().toISOString(),
      warning_sent: false
    }));

    if (userLimitsToCreate.length > 0) {
      await base44.asServiceRole.entities.UserLimit.bulkCreate(userLimitsToCreate);
    }

    return Response.json({ 
      success: true,
      subscription,
      limits_initialized: userLimitsToCreate.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});