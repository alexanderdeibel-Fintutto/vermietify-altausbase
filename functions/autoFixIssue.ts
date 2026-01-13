import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType, issues } = await req.json();

    let fixed = 0;

    // Auto-fix logic
    for (const issue of issues) {
      try {
        if (issue.field === 'amount' && issue.message.includes('negativ')) {
          // Fix negative amounts
          const entity = await base44.entities[entityType].list('', 1, { id: issue.entityId });
          if (entity[0]) {
            await base44.entities[entityType].update(issue.entityId, {
              amount: Math.abs(entity[0].amount)
            });
            fixed++;
          }
        } else if (issue.field === 'dates') {
          // Swap start and end dates if reversed
          const entity = await base44.entities[entityType].list('', 1, { id: issue.entityId });
          if (entity[0]) {
            await base44.entities[entityType].update(issue.entityId, {
              start_date: entity[0].end_date,
              end_date: entity[0].start_date
            });
            fixed++;
          }
        }
      } catch (e) {
        console.error('Auto-fix error for issue:', issue, e);
      }
    }

    return Response.json({
      data: {
        fixed: fixed,
        total: issues.length,
        success: fixed > 0
      }
    });

  } catch (error) {
    console.error('Auto-fix error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});