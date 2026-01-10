import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  const contracts = await base44.entities.LeaseContract.list(null, 100);
  
  const expiring = contracts.filter(c => {
    if (!c.end_date || c.is_unlimited) return false;
    const endDate = new Date(c.end_date);
    return endDate <= threeMonthsFromNow;
  });

  return Response.json({
    contracts: expiring.map(c => ({
      id: c.id,
      tenant_name: c.tenant_id,
      end_date: c.end_date
    }))
  });
});