import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, forecastMonths = 6 } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const leases = await base44.entities.LeaseContract.list();
        const invoices = await base44.entities.Invoice.list();

        const buildingLeases = leases.filter(l => units.some(u => u.id === l.unit_id));
        const buildingInvoices = invoices.filter(i => units.some(u => u.id === i.unit_id));

        const monthlyRent = buildingLeases.reduce((sum, l) => sum + l.monthly_rent, 0);
        const avgMonthlyExpenses = buildingInvoices.reduce((sum, i) => sum + i.amount, 0) / 12;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle eine Cashflow-Prognose für ${forecastMonths} Monate:

Gebäude: ${buildingId}
Monatliche Miete: €${monthlyRent.toFixed(2)}
Durchschnittliche Ausgaben/Monat: €${avgMonthlyExpenses.toFixed(2)}

{
  "forecast_period": "${forecastMonths} Monate",
  "monthly_forecasts": [
    {
      "month": "YYYY-MM",
      "expected_income": 0,
      "expected_expenses": 0,
      "net_cashflow": 0,
      "cumulative_cashflow": 0
    }
  ],
  "summary": {
    "total_expected_income": 0,
    "total_expected_expenses": 0,
    "total_net_cashflow": 0,
    "average_monthly_cashflow": 0
  },
  "risk_factors": ["Risiko"],
  "opportunities": ["Chance"],
  "liquidity_assessment": "Bewertung",
  "recommendations": ["Empfehlung"]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    forecast_period: { type: 'string' },
                    monthly_forecasts: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    summary: { type: 'object', additionalProperties: true },
                    risk_factors: { type: 'array', items: { type: 'string' } },
                    opportunities: { type: 'array', items: { type: 'string' } },
                    liquidity_assessment: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            forecast: response
        }), { status: 200 });

    } catch (error) {
        console.error('Cashflow forecast error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});