import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates predictive financial forecasts using historical data and trends
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { metrics, historical_data, forecast_periods = 6 } = await req.json();

        console.log(`Generating predictive analytics for ${forecast_periods} periods`);

        // Use AI to generate forecast
        const forecastPrompt = `
Based on the following historical financial data and current metrics, generate a financial forecast for the next ${forecast_periods} periods.

Current Metrics:
- Total Income: ${metrics.total_income || 0}
- Total Expenses: ${metrics.total_expenses || 0}
- Savings Rate: ${metrics.savings_rate || 0}%

Historical Trends:
${JSON.stringify(historical_data, null, 2)}

Provide:
1. Income forecast (monthly breakdown)
2. Expense forecast (by major categories)
3. Savings forecast
4. Confidence level (0-100) for each forecast
5. Key assumptions
6. Risk factors

Format as JSON.
        `;

        const forecast = await base44.integrations.Core.InvokeLLM({
            prompt: forecastPrompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    income_forecast: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                period: { type: 'number' },
                                amount: { type: 'number' },
                                confidence: { type: 'number' }
                            }
                        }
                    },
                    expense_forecast: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                amount: { type: 'number' },
                                confidence: { type: 'number' }
                            }
                        }
                    },
                    savings_forecast: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                period: { type: 'number' },
                                amount: { type: 'number' }
                            }
                        }
                    },
                    assumptions: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    risk_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    overall_confidence: { type: 'number' }
                }
            }
        });

        return Response.json({
            success: true,
            forecast,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating predictive analytics:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});