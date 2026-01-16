import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const buildings = await base44.entities.Building.list();
        const units = await base44.entities.Unit.list();
        const leases = await base44.entities.LeaseContract.list();
        const invoices = await base44.entities.Invoice.list();
        const payments = await base44.entities.ActualPayment.list();

        const totalUnits = units.length;
        const occupiedUnits = leases.length;
        const vacantUnits = totalUnits - occupiedUnits;
        const totalRent = leases.reduce((sum, l) => sum + l.monthly_rent, 0);
        const totalExpenses = invoices.reduce((sum, i) => sum + i.amount, 0);
        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle einen umfassenden Portfolio-Übersichtsbericht:

Portfolio-Daten:
- Gebäude: ${buildings.length}
- Einheiten gesamt: ${totalUnits}
- Belegt: ${occupiedUnits}
- Vakant: ${vacantUnits}
- Monatliche Miete: €${totalRent.toFixed(2)}
- Ausgaben: €${totalExpenses.toFixed(2)}
- Einnahmen: €${totalIncome.toFixed(2)}

{
  "portfolio_summary": {
    "total_buildings": ${buildings.length},
    "total_units": ${totalUnits},
    "occupancy_rate": ${(occupiedUnits / totalUnits * 100).toFixed(1)},
    "total_value_estimate": 0
  },
  "financial_overview": {
    "monthly_rent_income": ${totalRent},
    "annual_income": ${totalIncome},
    "annual_expenses": ${totalExpenses},
    "net_profit": ${totalIncome - totalExpenses},
    "roi": 0
  },
  "top_performers": [
    {"building": "Name", "metric": "Wert", "reason": "Text"}
  ],
  "underperformers": [
    {"building": "Name", "metric": "Wert", "reason": "Text"}
  ],
  "opportunities": ["Chance"],
  "risks": ["Risiko"],
  "strategic_recommendations": ["Empfehlung"]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    portfolio_summary: { type: 'object', additionalProperties: true },
                    financial_overview: { type: 'object', additionalProperties: true },
                    top_performers: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    underperformers: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    opportunities: { type: 'array', items: { type: 'string' } },
                    risks: { type: 'array', items: { type: 'string' } },
                    strategic_recommendations: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Portfolio report error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});