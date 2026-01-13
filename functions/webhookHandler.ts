import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    
    const { event_type, entity_type, data } = await req.json();

    console.log(`Webhook event: ${event_type} for ${entity_type}`);

    // Fetch active webhooks for this event
    const webhooks = await base44.asServiceRole.entities.Webhook?.list?.() || [];
    const relevantWebhooks = webhooks.filter(w => w.event_type === event_type && w.is_active);

    // Send to all relevant webhooks
    const results = [];
    for (const webhook of relevantWebhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret
          },
          body: JSON.stringify({
            event: event_type,
            timestamp: new Date().toISOString(),
            data: data
          })
        });

        if (response.ok) {
          // Update last_triggered
          await base44.asServiceRole.entities.Webhook?.update?.(webhook.id, {
            last_triggered: new Date().toISOString(),
            failure_count: 0
          });
          results.push({ webhook: webhook.url, status: 'success' });
        } else {
          // Increment failure count
          await base44.asServiceRole.entities.Webhook?.update?.(webhook.id, {
            failure_count: (webhook.failure_count || 0) + 1
          });
          results.push({ webhook: webhook.url, status: 'failed' });
        }
      } catch (e) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, e);
        await base44.asServiceRole.entities.Webhook?.update?.(webhook.id, {
          failure_count: (webhook.failure_count || 0) + 1
        });
        results.push({ webhook: webhook.url, status: 'error' });
      }
    }

    return Response.json({
      data: {
        event: event_type,
        webhooks_triggered: relevantWebhooks.length,
        results: results
      }
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});