import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[SYNC] Starting usage limits sync...');

    // Get all usage limits with entity counting
    const limits = await base44.asServiceRole.entities.UsageLimit.filter({
      is_active: true
    });

    const limitsWithCounting = limits.filter(l => l.entity_to_count);

    console.log(`[SYNC] Found ${limitsWithCounting.length} limits with entity counting`);

    // Get all user limits
    const userLimits = await base44.asServiceRole.entities.UserLimit.list();

    let updatedCount = 0;

    for (const userLimit of userLimits) {
      const limit = limits.find(l => l.id === userLimit.limit_id);
      
      if (!limit || !limit.entity_to_count) continue;

      try {
        const filter = limit.count_filter ? JSON.parse(limit.count_filter) : {};
        filter.created_by = userLimit.user_email;

        const entities = await base44.asServiceRole.entities[limit.entity_to_count].filter(filter);
        const actualCount = entities.length;

        if (actualCount !== userLimit.current_usage) {
          await base44.asServiceRole.entities.UserLimit.update(userLimit.id, {
            current_usage: actualCount,
            last_checked: new Date().toISOString()
          });
          updatedCount++;
          console.log(`[SYNC] Updated ${userLimit.user_email} - ${limit.name}: ${actualCount}`);
        }
      } catch (error) {
        console.error(`[SYNC] Error counting for ${userLimit.user_email}:`, error);
      }
    }

    console.log(`[SYNC] Completed. Updated ${updatedCount} user limits.`);

    return Response.json({
      success: true,
      checked: userLimits.length,
      updated: updatedCount
    });

  } catch (error) {
    console.error('[SYNC] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});