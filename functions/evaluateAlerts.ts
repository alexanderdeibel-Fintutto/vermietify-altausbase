import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { entityType, entityData } = await req.json();

    // Get all active alert rules for this entity type
    const rules = await base44.asServiceRole.entities.AlertRule?.list?.() || [];
    const relevantRules = rules.filter(r => r.entity_type === entityType && r.is_active);

    let triggered = 0;

    for (const rule of relevantRules) {
      try {
        const condition = JSON.parse(rule.trigger_condition);
        const fieldValue = entityData[condition.field];

        let conditionMet = false;
        if (condition.operator === 'equals') {
          conditionMet = fieldValue === condition.value;
        } else if (condition.operator === 'gt') {
          conditionMet = fieldValue > condition.value;
        } else if (condition.operator === 'lt') {
          conditionMet = fieldValue < condition.value;
        }

        if (conditionMet) {
          const channels = JSON.parse(rule.channels);

          // Send notification
          await base44.asServiceRole.functions.invoke?.('sendNotification', {
            title: `Alert: ${rule.name}`,
            message: rule.alert_message,
            type: 'warning',
            category: entityType.toLowerCase(),
            channels: channels
          });

          // Update rule stats
          await base44.asServiceRole.entities.AlertRule?.update?.(rule.id, {
            trigger_count: (rule.trigger_count || 0) + 1,
            last_triggered: new Date().toISOString()
          });

          triggered++;
        }
      } catch (e) {
        console.error(`Error evaluating rule ${rule.id}:`, e);
      }
    }

    return Response.json({
      data: {
        rules_evaluated: relevantRules.length,
        alerts_triggered: triggered
      }
    });

  } catch (error) {
    console.error('Alert evaluation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});