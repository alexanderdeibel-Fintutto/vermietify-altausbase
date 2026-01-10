import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contract_id } = await req.json();

  const contract = (await base44.entities.LeaseContract.filter({ id: contract_id }))[0];

  const issues = [];

  if (contract.notice_period_months < 3) {
    issues.push({
      title: 'Kündigungsfrist zu kurz',
      recommendation: 'Mindestens 3 Monate gesetzlich vorgeschrieben'
    });
  }

  return Response.json({ issues });
});