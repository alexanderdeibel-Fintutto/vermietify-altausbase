import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contract_id } = await req.json();

  await base44.integrations.Core.SendEmail({
    to: 'tenant@example.com',
    subject: 'Vertragsverlängerungsangebot',
    body: 'Sehr geehrter Mieter, wir möchten Ihnen ein Angebot zur Vertragsverlängerung unterbreiten...'
  });

  return Response.json({ success: true });
});