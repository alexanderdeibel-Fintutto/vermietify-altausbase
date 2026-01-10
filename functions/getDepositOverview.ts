import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contracts = await base44.entities.LeaseContract.filter({ status: 'active' });
  
  const total = contracts.reduce((sum, c) => sum + (c.deposit || 0), 0);
  const interest = total * 0.01;

  const items = contracts.map(c => ({
    id: c.id,
    tenant_name: c.tenant_id,
    amount: c.deposit || 0
  }));

  return Response.json({ total, interest: Math.round(interest), items });
});