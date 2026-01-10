import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contract_id } = await req.json();

  const contract = (await base44.entities.LeaseContract.filter({ id: contract_id }))[0];
  const tenant = (await base44.entities.Tenant.filter({ id: contract.tenant_id }))[0];

  await base44.integrations.Core.SendEmail({
    to: tenant.email,
    subject: 'Vertragsverlängerung',
    body: `Sehr geehrte/r ${tenant.name},\n\nIhr Mietvertrag läuft zum ${contract.end_date} aus. Wir würden uns freuen, wenn Sie bleiben möchten.\n\nMit freundlichen Grüßen`
  });

  return Response.json({ success: true });
});