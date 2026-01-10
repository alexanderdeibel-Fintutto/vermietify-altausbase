import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { frequency, enabled } = await req.json();

  await base44.auth.updateMe({ 
    email_digest_frequency: frequency,
    email_digest_enabled: enabled
  });

  return Response.json({ success: true });
});