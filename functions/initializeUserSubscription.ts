import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has extended fields
    if (user.subscription_plan) {
      return Response.json({ message: 'User already initialized', user });
    }

    // Initialize with default values
    const updates = {
      subscription_plan: 'easyVermieter',
      subscription_addons: [],
      subscription_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      role_in_company: 'verwalter',
      enabled_features: ['dashboard', 'finanzen', 'immobilien', 'mieter', 'steuer'],
      last_feature_check: new Date().toISOString()
    };

    await base44.auth.updateMe(updates);

    return Response.json({ 
      success: true, 
      message: 'User subscription initialized',
      subscription: updates 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});