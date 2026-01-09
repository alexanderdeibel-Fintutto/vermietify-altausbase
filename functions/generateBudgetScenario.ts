import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates what-if budget scenarios with financial impact analysis
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            rolling_budget_id,
            scenario_type,
            scenario_name,
            description,
            adjustments,
            assumptions
        } = await req.json();

        console.log(`Generating budget scenario: ${scenario_name}`);

        // Fetch the rolling budget
        const budgets = await base44.asServiceRole.entities.RollingBudget.filter(
            { id: rolling_budget_id },
            null,
            1
        );

        if (budgets.length === 0) {
            return Response.json({ error: 'Budget not found' }, { status: 404 });
        }

        const baseBudget = budgets[0];
        const baselineBudget = calculateBaselineBudget(baseBudget);
        const scenarioBudget = applyAdjustments(baselineBudget, adjustments);
        const financialImpact = calculateFinancialImpact(baselineBudget, scenarioBudget);

        // Identify risk factors based on scenario type
        const riskFactors = identifyRisks(scenario_type, adjustments, financialImpact);

        const scenario = {
            user_email: user.email,
            rolling_budget_id,
            scenario_name,
            scenario_type,
            description,
            adjustments,
            baseline_budget: baselineBudget,
            scenario_budget: scenarioBudget,
            financial_impact: financialImpact,
            assumptions: assumptions || [],
            risk_factors: riskFactors,
            created_at: new Date().toISOString()
        };

        const saved = await base44.asServiceRole.entities.BudgetScenario.create(scenario);

        return Response.json({
            success: true,
            scenario_id: saved.id,
            scenario
        });

    } catch (error) {
        console.error('Error generating budget scenario:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateBaselineBudget(budget) {
    const baseline = {};

    budget.categories.forEach(cat => {
        baseline[cat.category_name] = cat.base_amount;
    });

    return baseline;
}

function applyAdjustments(baseline, adjustments) {
    const adjusted = { ...baseline };

    Object.entries(adjustments || {}).forEach(([category, adjustment]) => {
        if (baseline[category]) {
            if (typeof adjustment === 'object') {
                if (adjustment.percentage) {
                    adjusted[category] = baseline[category] * (1 + adjustment.percentage / 100);
                } else if (adjustment.absolute) {
                    adjusted[category] = baseline[category] + adjustment.absolute;
                }
            } else {
                adjusted[category] = baseline[category] * (1 + adjustment / 100);
            }
        }
    });

    return adjusted;
}

function calculateFinancialImpact(baseline, scenario) {
    let totalVariance = 0;
    const categoryImpacts = {};

    Object.entries(baseline).forEach(([category, baseAmount]) => {
        const scenarioAmount = scenario[category] || baseAmount;
        const variance = scenarioAmount - baseAmount;
        totalVariance += variance;

        categoryImpacts[category] = {
            baseline: baseAmount,
            scenario: scenarioAmount,
            variance,
            variance_percentage: ((variance / baseAmount) * 100).toFixed(2)
        };
    });

    const totalBaseline = Object.values(baseline).reduce((a, b) => a + b, 0);
    const variancePercentage = ((totalVariance / totalBaseline) * 100).toFixed(2);

    return {
        total_variance: Math.round(totalVariance),
        variance_percentage: parseFloat(variancePercentage),
        category_impacts: categoryImpacts
    };
}

function identifyRisks(scenarioType, adjustments, impact) {
    const risks = [];

    if (scenarioType === 'pessimistic') {
        risks.push('Geringere Einnahmen als erwartet');
        risks.push('Höhere Betriebskosten');
    }

    if (scenarioType === 'optimistic') {
        risks.push('Abhängig von Wachstumsannahmen');
        risks.push('Externe Marktfaktoren können beeinflussen');
    }

    // Check for significant changes
    Object.entries(impact.category_impacts).forEach(([category, impact]) => {
        if (Math.abs(parseFloat(impact.variance_percentage)) > 20) {
            risks.push(`Große Veränderung in ${category} (${impact.variance_percentage}%)`);
        }
    });

    return risks;
}