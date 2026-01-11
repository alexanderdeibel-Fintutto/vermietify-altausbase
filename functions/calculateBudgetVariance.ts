import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { budget_id } = await req.json();
    const budget = await base44.asServiceRole.entities.PropertyBudget.read(budget_id);

    const totalPlannedExpenses = Object.values(budget.planned_expenses || {}).reduce((a, b) => a + (b || 0), 0);
    const totalActualExpenses = Object.values(budget.actual_expenses || {}).reduce((a, b) => a + (b || 0), 0);

    const incomeVariance = (budget.actual_income || 0) - (budget.planned_income || 0);
    const expenseVariance = totalActualExpenses - totalPlannedExpenses;
    const totalVariance = incomeVariance - expenseVariance;

    await base44.asServiceRole.entities.PropertyBudget.update(budget_id, {
      variance: Math.round(totalVariance * 100) / 100
    });

    return Response.json({ 
      success: true,
      variance: Math.round(totalVariance * 100) / 100,
      income_variance: Math.round(incomeVariance * 100) / 100,
      expense_variance: Math.round(expenseVariance * 100) / 100,
      performance_percentage: totalPlannedExpenses > 0 
        ? Math.round((totalVariance / totalPlannedExpenses) * 100 * 100) / 100
        : 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});