import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all data for the month
    const leads = await base44.asServiceRole.entities.Lead.list();
    const calculations = await base44.asServiceRole.entities.CalculationHistory.list();
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.list();

    const monthLeads = leads.filter(l => {
      const created = new Date(l.created_date);
      return created >= firstDay && created <= lastDay;
    });

    const monthCalculations = calculations.filter(c => {
      const created = new Date(c.created_date);
      return created >= firstDay && created <= lastDay;
    });

    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const trialSubscriptions = subscriptions.filter(s => s.status === 'TRIAL').length;

    const report = {
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        start: firstDay.toISOString(),
        end: lastDay.toISOString()
      },
      leads: {
        total: leads.length,
        new_this_month: monthLeads.length,
        converted_this_month: monthLeads.filter(l => l.status === 'converted').length
      },
      calculations: {
        total: calculations.length,
        this_month: monthCalculations.length,
        by_type: monthCalculations.reduce((acc, c) => {
          acc[c.calculator_type] = (acc[c.calculator_type] || 0) + 1;
          return acc;
        }, {})
      },
      subscriptions: {
        active: activeSubscriptions,
        trial: trialSubscriptions,
        total: subscriptions.length
      }
    };

    return Response.json(report);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});