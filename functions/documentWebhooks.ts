import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, webhook_url, events, action } = await req.json();

    if (action === 'register') {
      const webhook = await base44.asServiceRole.entities.Webhook.create({
        company_id,
        url: webhook_url,
        events,
        is_active: true,
        created_by: user.email
      });

      return Response.json({ success: true, webhook });
    }

    if (action === 'test') {
      const testPayload = {
        event: 'document.created',
        timestamp: new Date().toISOString(),
        data: { document_id: 'test_123' }
      };

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      return Response.json({
        success: response.ok,
        status: response.status
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});