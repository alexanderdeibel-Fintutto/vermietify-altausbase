import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contracts = await base44.entities.LeaseContract.list(null, 100);
  
  const items = [];
  let total = 0;

  for (const contract of contracts) {
    if (contract.deposit) {
      const tenant = (await base44.entities.Tenant.filter({ id: contract.tenant_id }))[0];
      items.push({
        id: contract.id,
        tenant_name: tenant?.name || 'Unbekannt',
        amount: contract.deposit,
        paid: contract.deposit_paid
      });
      total += contract.deposit;
    }
  }

  return Response.json({ total, items });
});