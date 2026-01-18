import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const { page, referrer } = body;

    await base44.analytics.track({
      eventName: 'page_view',
      properties: {
        page,
        referrer: referrer || null
      }
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});