import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automatically generates rolling budgets based on historical spending patterns and forecasts
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { analysis_months = 6, forecast_months = 12 } = await req.json();

        console.log(`Generating rolling budgets for: ${user.email}`);

        // Get historical financial reports
        const reports = await base44.entities.FinancialReport.filter(
            { user_email: user.email },
            '-period_start',
            analysis_months
        );

        if (reports.length < 2) {
            return Response.json({
                success: false,
                message: 'Insufficient historical data for budget generation'
            });
        }

        // Analyze spending patterns by category
        const categoryPatterns = analyzeSpendingPatterns(reports);
        
        // Generate forecasts
        const forecasts = generateForecasts(categoryPatterns, forecast_months);

        // Create rolling budget
        const budgetCategories = Object.entries(categoryPatterns).map(([category, data]) => ({
            category_name: category,
            base_amount: data.average,
            growth_rate: data.trend
        }));

        const rollingBudget = await base44.asServiceRole.entities.RollingBudget.create({
            user_email: user.email,
            budget_name: `Auto-Generated Budget ${new Date().getFullYear()}`,
            budget_type: 'monthly',
            rolling_periods: 12,
            categories: budgetCategories,
            periods: generateBudgetPeriods(budgetCategories, forecast_months),
            is_active: true,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
        });

        // Log creation
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'rolling_budget_auto_generated',
            resource_type: 'RollingBudget',
            resource_id: rollingBudget.id,
            resource_name: rollingBudget.budget_name,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            rolling_budget: rollingBudget,
            analysis: {
                months_analyzed: analysis_months,
                categories_identified: Object.keys(categoryPatterns).length,
                patterns: categoryPatterns
            }
        });

    } catch (error) {
        console.error('Error generating rolling budgets:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function analyzeSpendingPatterns(reports) {
    const patterns = {};

    for (const report of reports) {
        const expenses = report.analysis?.expense_analysis?.categories || {};
        
        for (const [category, amount] of Object.entries(expenses)) {
            if (!patterns[category]) {
                patterns[category] = { amounts: [], trend: 0 };
            }
            patterns[category].amounts.push(amount);
        }
    }

    // Calculate statistics
    for (const category in patterns) {
        const amounts = patterns[category].amounts;
        const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const trend = calculateTrend(amounts);

        patterns[category] = {
            average,
            trend,
            min: Math.min(...amounts),
            max: Math.max(...amounts),
            volatility: calculateVolatility(amounts, average)
        };
    }

    return patterns;
}

function generateForecasts(patterns, months) {
    const forecasts = {};

    for (const [category, data] of Object.entries(patterns)) {
        forecasts[category] = [];
        let value = data.average;

        for (let i = 0; i < months; i++) {
            // Apply trend and add seasonal variation
            value = value * (1 + data.trend / 100);
            forecasts[category].push(Math.round(value));
        }
    }

    return forecasts;
}

function generateBudgetPeriods(categories, months) {
    const periods = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
        const startDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);

        const categoryBudgets = {};
        for (const cat of categories) {
            categoryBudgets[cat.category_name] = Math.round(
                cat.base_amount * Math.pow(1 + cat.growth_rate / 100, i)
            );
        }

        periods.push({
            period_number: i + 1,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
            category_budgets: categoryBudgets
        });
    }

    return periods;
}

function calculateTrend(amounts) {
    if (amounts.length < 2) return 0;
    
    const first = amounts[0];
    const last = amounts[amounts.length - 1];
    return ((last - first) / first) * 100 / amounts.length;
}

function calculateVolatility(amounts, average) {
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
    return Math.sqrt(variance);
}