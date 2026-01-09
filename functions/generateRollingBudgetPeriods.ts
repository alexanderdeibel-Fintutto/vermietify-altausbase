import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates rolling budget periods with growth rates
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { rolling_budget_id, start_date } = await req.json();

        console.log(`Generating rolling budget periods for: ${rolling_budget_id}`);

        // Fetch rolling budget
        const budgets = await base44.asServiceRole.entities.RollingBudget.filter(
            { id: rolling_budget_id },
            null,
            1
        );

        if (budgets.length === 0) {
            return Response.json({ error: 'Budget not found' }, { status: 404 });
        }

        const budget = budgets[0];
        const startDate = new Date(start_date);
        const periods = [];

        // Calculate period duration
        const periodDays = getPeriodDays(budget.budget_type);

        // Generate periods
        for (let i = 0; i < budget.rolling_periods; i++) {
            const periodStart = new Date(startDate);
            periodStart.setDate(periodStart.getDate() + i * periodDays);

            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + periodDays - 1);

            const categoryBudgets = {};

            // Apply growth rates to categories
            budget.categories.forEach(category => {
                const growthMultiplier = Math.pow(
                    1 + (category.growth_rate / 100),
                    i
                );
                categoryBudgets[category.category_name] = Math.round(
                    category.base_amount * growthMultiplier
                );
            });

            periods.push({
                period_number: i + 1,
                period_start: periodStart.toISOString().split('T')[0],
                period_end: periodEnd.toISOString().split('T')[0],
                category_budgets: categoryBudgets
            });
        }

        // Update budget with periods
        await base44.asServiceRole.entities.RollingBudget.update(rolling_budget_id, {
            periods,
            last_updated: new Date().toISOString()
        });

        return Response.json({
            success: true,
            rolling_budget_id,
            periods_generated: periods.length,
            periods
        });

    } catch (error) {
        console.error('Error generating rolling budget periods:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getPeriodDays(budgetType) {
    switch (budgetType) {
        case 'monthly':
            return 30;
        case 'quarterly':
            return 90;
        case 'semi-annual':
            return 180;
        default:
            return 30;
    }
}