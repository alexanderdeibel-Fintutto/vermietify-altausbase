import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analyzes spending data to identify cost reduction opportunities
 * and generate optimized budget recommendations
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            report_id,
            metrics,
            period_start,
            period_end,
            historical_data
        } = await req.json();

        console.log('Analyzing costs for optimization...');

        // Get historical spending patterns
        const historicalTrends = analyzeHistoricalTrends(historical_data);

        // Identify cost reduction opportunities
        const opportunities = identifyCostReductions(
            metrics,
            historicalTrends,
            period_start,
            period_end
        );

        // Generate optimized budget recommendations
        const budgetRecommendations = generateBudgetRecommendations(
            metrics,
            opportunities,
            historicalTrends
        );

        // Extract quick wins
        const quickWins = extractQuickWins(opportunities);

        // Calculate total savings potential
        const totalSavings = opportunities.reduce((sum, opp) => sum + (opp.potential_savings || 0), 0);
        const savingsPercentage = ((totalSavings / (metrics.total_expenses || 1)) * 100).toFixed(1);

        const analysis = {
            user_email: user.email,
            report_id,
            analysis_date: new Date().toISOString(),
            total_spending: metrics.total_expenses,
            period_start,
            period_end,
            cost_reduction_opportunities: opportunities,
            total_potential_savings: totalSavings,
            savings_percentage: parseFloat(savingsPercentage),
            trend_analysis: historicalTrends,
            budget_recommendations: budgetRecommendations,
            quick_wins: quickWins,
            status: 'completed'
        };

        // Save analysis
        const saved = await base44.asServiceRole.entities.CostOptimizationAnalysis.create(analysis);

        return Response.json({
            success: true,
            analysis_id: saved.id,
            analysis
        });

    } catch (error) {
        console.error('Error generating cost optimization analysis:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function analyzeHistoricalTrends(historicalData) {
    const trends = {};

    Object.entries(historicalData || {}).forEach(([category, data]) => {
        const values = Array.isArray(data) ? data : [data];
        if (values.length === 0) return;

        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const trend = calculateTrend(values);
        const volatility = calculateVolatility(values, average);

        trends[category] = {
            average,
            max,
            min,
            trend,
            volatility,
            data_points: values.length
        };
    });

    return trends;
}

function identifyCostReductions(metrics, trends, periodStart, periodEnd) {
    const opportunities = [];

    Object.entries(metrics.expense_analysis?.categories || {}).forEach(([category, amount]) => {
        const trend = trends[category];
        if (!trend) return;

        // Check if spending is above average
        const aboveAverage = amount > trend.average * 1.2;
        if (aboveAverage) {
            const potentialSavings = amount - (trend.average * 1.05);
            opportunities.push({
                category,
                current_spending: amount,
                opportunity_description: `Ausgaben in "${category}" sind ${((amount / trend.average - 1) * 100).toFixed(1)}% über dem historischen Durchschnitt. Potenzial zur Normalisierung identifiziert.`,
                potential_savings: Math.max(0, potentialSavings),
                savings_percentage: ((potentialSavings / amount) * 100).toFixed(1),
                priority: potentialSavings > amount * 0.15 ? 'high' : 'medium',
                implementation_difficulty: 'medium',
                timeline_months: 1
            });
        }

        // Check for unusual volatility
        if (trend.volatility > 0.3) {
            opportunities.push({
                category,
                current_spending: amount,
                opportunity_description: `Hohe Ausgabenschwankungen in "${category}" deuten auf ineffiziente Budgetierung hin. Bessere Planung könnte stabilisieren.`,
                potential_savings: amount * 0.08,
                savings_percentage: 8,
                priority: 'medium',
                implementation_difficulty: 'easy',
                timeline_months: 0.5
            });
        }
    });

    // Sort by potential savings
    return opportunities.sort((a, b) => b.potential_savings - a.potential_savings);
}

function generateBudgetRecommendations(metrics, opportunities, trends) {
    const recommendations = [];

    Object.entries(metrics.expense_analysis?.categories || {}).forEach(([category, currentAmount]) => {
        const trend = trends[category];
        if (!trend) return;

        // Recommended budget based on trend + buffer
        const recommendedBudget = trend.average * 1.1; // 10% buffer above average

        // Check if there are specific opportunities
        const opportunity = opportunities.find(o => o.category === category);
        let finalRecommendation = recommendedBudget;
        let reasoning = `Basierend auf historischem Durchschnitt von ${trend.average.toLocaleString('de-DE')} €`;
        let confidence = 75;

        if (opportunity && opportunity.priority === 'high') {
            finalRecommendation = Math.min(recommendedBudget, currentAmount * 0.85);
            reasoning = `Hohe Einsparungschance erkannt. Reduzierung um 15% empfohlen.`;
            confidence = 85;
        } else if (trend.trend === 'decreasing') {
            finalRecommendation = trend.average * 0.95;
            reasoning = `Fallende Trends - Reduzierung um 5% sicher.`;
            confidence = 80;
        }

        recommendations.push({
            category,
            current_budget: currentAmount,
            recommended_budget: Math.round(finalRecommendation),
            reasoning,
            confidence
        });
    });

    return recommendations;
}

function extractQuickWins(opportunities) {
    return opportunities
        .filter(opp => opp.implementation_difficulty === 'easy' && opp.priority !== 'low')
        .slice(0, 5)
        .map(opp => `${opp.category}: ${opp.opportunity_description}`);
}

function calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.ceil(values.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2);
    const secondHalf = values.slice(Math.ceil(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);

    const change = ((secondHalf - firstHalf) / firstHalf) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
}

function calculateVolatility(values, average) {
    if (values.length < 2) return 0;

    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return (stdDev / average);
}