import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all subscriptions
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.list();
    let syncedCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      try {
        // Get tier limits
        const tierLimits = await base44.asServiceRole.entities.TierLimit.filter({
          tier_id: subscription.tier_id
        });

        // Get existing user limits
        const existingLimits = await base44.asServiceRole.entities.UserLimit.filter({
          user_email: subscription.user_email
        });

        // Update or create limits
        for (const tierLimit of tierLimits) {
          const existing = existingLimits.find(ul => ul.limit_id === tierLimit.limit_id);
          
          if (existing) {
            // Update limit value if changed
            if (existing.limit_value !== tierLimit.limit_value) {
              await base44.asServiceRole.entities.UserLimit.update(existing.id, {
                limit_value: tierLimit.limit_value,
                last_checked: new Date().toISOString()
              });
            }
          } else {
            // Create new limit
            await base44.asServiceRole.entities.UserLimit.create({
              user_email: subscription.user_email,
              limit_id: tierLimit.limit_id,
              current_usage: 0,
              limit_value: tierLimit.limit_value,
              last_checked: new Date().toISOString(),
              warning_sent: false
            });
          }
        }

        syncedCount++;
      } catch (error) {
        console.error(`Error syncing limits for ${subscription.user_email}:`, error);
        errorCount++;
      }
    }

    return Response.json({
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: subscriptions.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});