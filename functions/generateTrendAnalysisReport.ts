import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, metric, months = 12 } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const leases = await base44.entities.LeaseContract.list();
        const payments = await base44.entities.ActualPayment.list();
        const invoices = await base44.entities.Invoice.list();

        const buildingLeases = leases.filter(l => units.some(u => u.id === l.unit_id));
        const buildingPayments = payments.filter(p => units.some(u => u.id === p.unit_id));
        const buildingInvoices = invoices.filter(i => units.some(u => u.id === i.unit_id));

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Analysiere den ${metric}-Trend der letzten ${months} Monate:

Gebäude: ${buildingId}
Metrik: ${metric}
Verträge: ${buildingLeases.length}
Zahlungen: ${buildingPayments.length} (€${buildingPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)})
Rechnungen: ${buildingInvoices.length} (€${buildingInvoices.reduce((s, i) => s + i.amount, 0).toFixed(2)})

{
  "metric": "${metric}",
  "period": "${months} Monate",
  "trend_direction": "UP|DOWN|STABLE",
  "percentage_change": 0,
  "analysis": "Detaillierte Trend-Analyse",
  "data_points": [
    {"month": "YYYY-MM", "value": 0}
  ],
  "peak_month": {"month": "YYYY-MM", "value": 0},
  "low_month": {"month": "YYYY-MM", "value": 0},
  "forecast_3months": [
    {"month": "YYYY-MM", "predicted_value": 0, "confidence": 0.95}
  ],
  "insights": ["Einsicht"],
  "recommendations": ["Empfehlung"]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    metric: { type: 'string' },
                    period: { type: 'string' },
                    trend_direction: { type: 'string' },
                    percentage_change: { type: 'number' },
                    analysis: { type: 'string' },
                    data_points: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    peak_month: { type: 'object', additionalProperties: true },
                    low_month: { type: 'object', additionalProperties: true },
                    forecast_3months: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    insights: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Trend analysis error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});