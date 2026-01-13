import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  console.log('Starting daily usage sync...');
  
  try {
    // Alle aktiven Subscriptions laden
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'ACTIVE'
    });
    
    console.log(`Processing ${subscriptions.length} active subscriptions`);
    
    // Alle Limits laden
    const limits = await base44.asServiceRole.entities.UsageLimit.list();
    
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let processed = 0;
    
    for (const sub of subscriptions) {
      const userEmail = sub.data.user_email;
      
      // Plan-Limits für diesen User laden
      const tierLimits = await base44.asServiceRole.entities.TierLimit.filter({
        tier_id: sub.data.tier_id
      });
      
      for (const limit of limits) {
        if (!limit.data.is_active) continue;
        
        // Plan-Limit für dieses Limit finden
        const tierLimit = tierLimits.find(tl => tl.data.limit_id === limit.id);
        const maxValue = tierLimit?.data.limit_value ?? 0;
        
        // Aktuelle Nutzung zählen
        let currentCount = 0;
        
        const entityName = limit.data.entity_to_count;
        if (!entityName) continue;
        
        try {
          // Entities des Users zählen
          const entities = await base44.asServiceRole.entities[entityName].filter({
            created_by: userEmail
          });
          currentCount = entities.length;
        } catch (err) {
          console.error(`Error counting ${entityName} for ${userEmail}:`, err.message);
          continue;
        }
        
        // UsageLog erstellen oder aktualisieren
        const existingLogs = await base44.asServiceRole.entities.UserLimit.filter({
          user_email: userEmail,
          limit_id: limit.id
        });
        
        if (existingLogs.length > 0) {
          await base44.asServiceRole.entities.UserLimit.update(existingLogs[0].id, {
            current_usage: currentCount,
            limit_value: maxValue,
            last_checked: new Date().toISOString()
          });
        } else {
          await base44.asServiceRole.entities.UserLimit.create({
            user_email: userEmail,
            limit_id: limit.id,
            current_usage: currentCount,
            limit_value: maxValue,
            last_checked: new Date().toISOString(),
            warning_sent: false
          });
        }
        
        processed++;
      }
    }
    
    console.log(`Usage sync completed. Processed ${processed} limit checks for ${subscriptions.length} users`);
    return Response.json({ success: true, processed, subscriptions: subscriptions.length });
    
  } catch (error) {
    console.error('Usage sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});