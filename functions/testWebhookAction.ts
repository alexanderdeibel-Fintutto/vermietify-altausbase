import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookId } = await req.json();

    // Get webhook
    const webhooks = await base44.entities.Webhook?.list?.('', 1, { id: webhookId });
    const webhook = webhooks?.[0];

    if (!webhook) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Send test payload
    const testPayload = {
      event: webhook.event,
      timestamp: new Date().toISOString(),
      data: {
        id: 'test_123',
        message: 'This is a test webhook'
      }
    };

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const status = response.status;

    // Update webhook with last triggered time
    await base44.entities.Webhook?.update?.(webhookId, {
      last_triggered: new Date(),
      last_status: status
    });

    return Response.json({
      success: status >= 200 && status < 300,
      status: status,
      message: status >= 200 && status < 300 ? 'Test successful' : 'Test failed'
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});