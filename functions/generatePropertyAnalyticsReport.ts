import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, period = '12months' } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Sammle Daten
        const building = await base44.entities.Building.filter({ id: buildingId });
        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const leases = await base44.entities.LeaseContract.list();
        const invoices = await base44.entities.Invoice.list();
        const maintenanceTasks = await base44.entities.MaintenanceTask.list();

        const buildingLeases = leases.filter(l => units.some(u => u.id === l.unit_id));
        const buildingInvoices = invoices.filter(i => units.some(u => u.id === i.unit_id));
        const buildingMaintenance = maintenanceTasks.filter(t => units.some(u => u.id === t.unit_id));

        // Berechne KPIs
        const totalRent = buildingLeases.reduce((sum, l) => sum + l.monthly_rent, 0);
        const occupancyRate = (buildingLeases.length / units.length * 100).toFixed(1);
        const maintenanceCost = buildingMaintenance.reduce((sum, t) => sum + (t.estimated_cost || 0), 0);
        const totalInvoices = buildingInvoices.reduce((sum, i) => sum + i.amount, 0);

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle einen umfassenden Immobilien-Analysebericht für ${building[0]?.name}:

Gebäudedaten:
- Einheiten: ${units.length}
- Mietverträge: ${buildingLeases.length}
- Belegungsquote: ${occupancyRate}%
- Gesamtmiete/Monat: €${totalRent.toFixed(2)}
- Instandhaltungskosten: €${maintenanceCost.toFixed(2)}
- Gesamtrechnungen: €${totalInvoices.toFixed(2)}
- Offene Arbeiten: ${buildingMaintenance.filter(t => t.status === 'open').length}

Periode: ${period}

Erstelle einen Bericht in diesem Format:
{
  "summary": "Executive Summary",
  "kpis": {
    "occupancy_rate": ${occupancyRate},
    "monthly_revenue": ${totalRent},
    "maintenance_cost_ratio": 0,
    "average_rent_per_sqm": 0,
    "vacancy_cost_annual": 0
  },
  "trends": [
    {"metric": "Name", "direction": "UP|DOWN|STABLE", "change": 0, "analysis": "Text"}
  ],
  "risk_assessment": [
    {"risk": "Risiko", "severity": "HIGH|MEDIUM|LOW", "mitigation": "Maßnahme"}
  ],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "forecast_12months": {
    "projected_revenue": 0,
    "projected_costs": 0,
    "projected_vacancy_rate": 0
  }
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    kpis: { type: 'object', additionalProperties: true },
                    trends: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    risk_assessment: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    forecast_12months: { type: 'object', additionalProperties: true }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            report: response,
            generated_at: new Date().toISOString()
        }), { status: 200 });

    } catch (error) {
        console.error('Report error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});