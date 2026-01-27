import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_ID = 'nk-abrechnung';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userMessage } = await req.json();

    if (!userMessage) {
      return Response.json({ success: true, recommendation: null });
    }

    const messageLower = userMessage.toLowerCase();

    // Cross-Sell Triggers für diese App laden
    const triggersData = await base44.asServiceRole.entities.AICrossSellTriggers?.list() || [];
    const triggers = triggersData.filter(t => t.from_app_id === APP_ID && t.is_active);

    if (!triggers || triggers.length === 0) {
      return Response.json({ success: true, recommendation: null });
    }

    // Prüfen ob Keywords matchen
    for (const trigger of triggers) {
      const keywords = trigger.trigger_keywords || [];
      const hasMatch = keywords.some(kw => messageLower.includes(kw.toLowerCase()));

      if (hasMatch) {
        return Response.json({
          success: true,
          recommendation: {
            toApp: trigger.to_app_id,
            message: trigger.message_template,
            priority: trigger.priority
          }
        });
      }
    }

    return Response.json({ success: true, recommendation: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});