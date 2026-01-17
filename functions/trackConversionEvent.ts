import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const { event_name, event_value, metadata } = body;

    await base44.analytics.track({
      eventName: event_name,
      properties: {
        value: event_value || null,
        ...metadata
      }
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});