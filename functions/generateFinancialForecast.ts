import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates AI-powered financial forecasts for income and expenses
 * Based on historical data, trends, and seasonality patterns
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { months_to_forecast = 6, historical_months = 12 } = await req.json();

        console.log(`Generating financial forecast for: ${user.email}`);

        // Get historical financial reports
        const reports = await base44.entities.FinancialReport.filter(
            { user_email: user.email },
            '-period_start',
            historical_months
        );

        if (reports.length < 3) {
            return Response.json({
                success: false,
                message: 'Insufficient historical data for forecasting'
            });
        }

        // Prepare historical data for analysis
        const historicalData = reports.map(r => ({
            period: r.period_start,
            income: r.metrics?.total_income || 0,
            expenses: r.metrics?.total_expenses || 0,
            categories: r.analysis?.expense_analysis?.categories || {}
        }));

        // Use AI to analyze patterns and generate forecast
        const forecastPrompt = `
Analysiere die folgenden historischen Finanzdiaten und erstelle eine detaillierte Vorhersage für die nächsten ${months_to_forecast} Monate:

Historische Daten:
${JSON.stringify(historicalData, null, 2)}

Berücksichtige bei der Vorhersage:
1. Trend: Steigende oder fallende Einnahmen/Ausgaben
2. Saisonalität: Wiederkehrende Muster
3. Volatilität: Schwankungsbreite
4. Kategorieabhängige Trends

Antworte mit einem strukturierten JSON:
{
  "income_forecast": [{"month": "2026-02", "predicted_income": 5000, "confidence": 0.85}],
  "expense_forecast": [{"month": "2026-02", "predicted_expenses": 3000, "confidence": 0.82}],
  "category_trends": {
    "category_name": {
      "trend": "increasing|decreasing|stable",
      "growth_rate": 5.2,
      "forecast": [{"month": "2026-02", "amount": 500}]
    }
  },
  "key_insights": ["insight 1", "insight 2"],
  "risk_factors": ["risk 1", "risk 2"]
}`;

        const forecastResponse = await base44.integrations.Core.InvokeLLM({
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
                                month: { type: 'string' },
                                predicted_income: { type: 'number' },
                                confidence: { type: 'number' }
                            }
                        }
                    },
                    expense_forecast: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                month: { type: 'string' },
                                predicted_expenses: { type: 'number' },
                                confidence: { type: 'number' }
                            }
                        }
                    },
                    category_trends: { type: 'object', additionalProperties: true },
                    key_insights: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    risk_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        // Create forecast record
        const forecast = {
            user_email: user.email,
            forecast_data: forecastResponse,
            historical_months: historical_months,
            forecast_months: months_to_forecast,
            generated_at: new Date().toISOString(),
            forecast_period_start: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            forecast_period_end: new Date(new Date().setMonth(new Date().getMonth() + months_to_forecast)).toISOString().split('T')[0]
        };

        // Log forecast generation
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'financial_forecast_generated',
            resource_type: 'FinancialReport',
            resource_name: `Forecast ${months_to_forecast} months`,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            forecast: forecast
        });

    } catch (error) {
        console.error('Error generating financial forecast:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});