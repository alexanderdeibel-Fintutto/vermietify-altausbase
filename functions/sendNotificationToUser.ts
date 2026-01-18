import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const { recipient_email, title, message, type } = body;

    const result = await base44.functions.invoke('createNotification', {
      recipient_email,
      title,
      message,
      type: type || 'info'
    });

    return Response.json({ success: true, data: result.data });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});