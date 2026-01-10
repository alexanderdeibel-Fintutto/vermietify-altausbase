import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  
  const expiringContracts = await base44.entities.LeaseContract.filter({
    end_date: { $lte: in90Days, $gte: new Date().toISOString() },
    status: 'active'
  }, 'end_date', 50);

  const contracts = [];
  for (const contract of expiringContracts) {
    const tenant = (await base44.entities.Tenant.filter({ id: contract.tenant_id }))[0];
    const daysUntil = Math.floor((new Date(contract.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
    
    contracts.push({
      id: contract.id,
      tenant_name: tenant?.name || 'Unbekannt',
      end_date: new Date(contract.end_date).toLocaleDateString('de-DE'),
      days_until: daysUntil
    });
  }

  return Response.json({ contracts });
});