import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contracts = await base44.entities.LeaseContract.list();
  
  const durations = [];
  let activeCount = 0;
  let endedLastYear = 0;
  let longTermCount = 0;

  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  for (const contract of contracts) {
    const startDate = new Date(contract.start_date);
    const endDate = contract.end_date ? new Date(contract.end_date) : now;
    
    const months = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    durations.push(months);

    if (contract.status === 'active') {
      activeCount++;
      if (months > 36) longTermCount++;
    }

    if (contract.end_date && new Date(contract.end_date) > oneYearAgo) {
      endedLastYear++;
    }
  }

  const average = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const sorted = [...durations].sort((a, b) => a - b);
  const median = sorted.length > 0
    ? sorted[Math.floor(sorted.length / 2)]
    : 0;

  return Response.json({
    average_months: average,
    active_tenants: activeCount,
    ended_last_year: endedLastYear,
    shortest: Math.min(...durations) || 0,
    longest: Math.max(...durations) || 0,
    median,
    long_term_count: longTermCount
  });
});