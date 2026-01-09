import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates AI-powered executive summaries for financial reports
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            metrics,
            analysis,
            cost_opportunities,
            anomalies,
            forecast,
            period_start,
            period_end
        } = await req.json();

        console.log('Generating executive summary');

        // Build context for AI
        const summaryPrompt = `
Generate a professional executive summary for a financial report covering ${period_start} to ${period_end}.

Key Metrics:
- Total Income: ${metrics.total_income?.toLocaleString('de-DE')} €
- Total Expenses: ${metrics.total_expenses?.toLocaleString('de-DE')} €
- Savings: ${(metrics.total_income - metrics.total_expenses)?.toLocaleString('de-DE')} €
- Savings Rate: ${metrics.savings_rate || 0}%

Analysis:
${JSON.stringify(analysis, null, 2)}

Cost Optimization Opportunities:
${JSON.stringify(cost_opportunities, null, 2)}

Anomalies Detected:
${JSON.stringify(anomalies, null, 2)}

Forecast for Next 6 Months:
${JSON.stringify(forecast, null, 2)}

Create a comprehensive executive summary including:
1. High-level overview (2-3 sentences)
2. Key performance indicators (bullet points)
3. Notable trends and patterns
4. Risk areas and concerns
5. Opportunities for improvement
6. Recommended next steps

Format the response as a JSON object with these sections.
        `;

        const summary = await base44.integrations.Core.InvokeLLM({
            prompt: summaryPrompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    overview: { type: 'string' },
                    key_metrics: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                metric: { type: 'string' },
                                value: { type: 'string' },
                                status: { type: 'string' }
                            }
                        }
                    },
                    trends: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    risks: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    opportunities: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    recommendations: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        // Extract key takeaways
        const keyTakeaways = generateKeyTakeaways(
            metrics,
            analysis,
            cost_opportunities,
            anomalies
        );

        return Response.json({
            success: true,
            executive_summary: summary,
            key_takeaways: keyTakeaways,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating executive summary:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateKeyTakeaways(metrics, analysis, opportunities, anomalies) {
    const takeaways = [];

    // Financial health takeaway
    const savingsRate = metrics.savings_rate || 0;
    if (savingsRate > 20) {
        takeaways.push('Excellent savings rate - financial position is strong');
    } else if (savingsRate > 10) {
        takeaways.push('Healthy savings rate - on track for financial goals');
    } else if (savingsRate > 0) {
        takeaways.push('Modest savings - consider expense optimization');
    } else {
        takeaways.push('Deficit spending - urgent action needed');
    }

    // Cost optimization takeaway
    if (opportunities && opportunities.length > 0) {
        const totalSavings = opportunities.reduce((sum, opp) => sum + (opp.potential_savings || 0), 0);
        takeaways.push(`Potential savings identified: ${totalSavings.toLocaleString('de-DE')} €`);
    }

    // Anomaly takeaway
    if (anomalies && anomalies.length > 0) {
        const highSeverity = anomalies.filter(a => a.severity === 'high').length;
        if (highSeverity > 0) {
            takeaways.push(`${highSeverity} high-severity anomalies require attention`);
        } else {
            takeaways.push('Minor anomalies detected - monitor for patterns');
        }
    }

    // Income/expense balance
    if (metrics.total_expenses > metrics.total_income * 0.8) {
        takeaways.push('Expenses trending high relative to income');
    }

    return takeaways;
}