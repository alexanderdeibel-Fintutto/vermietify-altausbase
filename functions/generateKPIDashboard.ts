import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const building = await base44.entities.Building.filter({ id: buildingId });
        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const leases = await base44.entities.LeaseContract.list();
        const invoices = await base44.entities.Invoice.list();
        const payments = await base44.entities.ActualPayment.list();

        const buildingLeases = leases.filter(l => units.some(u => u.id === l.unit_id));
        const buildingInvoices = invoices.filter(i => units.some(u => u.id === i.unit_id));
        const buildingPayments = payments.filter(p => units.some(u => u.id === p.unit_id));

        const totalRent = buildingLeases.reduce((sum, l) => sum + l.monthly_rent, 0);
        const totalInvoiced = buildingInvoices.reduce((sum, i) => sum + i.amount, 0);
        const totalPaid = buildingPayments.reduce((sum, p) => sum + p.amount, 0);
        const occupancyRate = (buildingLeases.length / units.length * 100).toFixed(1);
        const paymentRate = ((totalPaid / totalInvoiced * 100) || 0).toFixed(1);

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle ein KPI-Dashboard für: ${building[0]?.name}

Metriken:
- Monatliche Miete: €${totalRent.toFixed(2)}
- Rechnungen: €${totalInvoiced.toFixed(2)}
- Zahlungen: €${totalPaid.toFixed(2)}
- Belegungsquote: ${occupancyRate}%
- Zahlungsquote: ${paymentRate}%

Erstelle ein KPI-Analyse-Format:
{
  "kpis": [
    {
      "name": "Name",
      "value": 0,
      "unit": "€",
      "status": "GOOD|WARNING|CRITICAL",
      "trend": "UP|DOWN|STABLE",
      "target": 0
    }
  ],
  "alerts": [{"level": "HIGH|MEDIUM|LOW", "message": "Text"}],
  "targets": {"name": "Target", "current": 0, "goal": 0},
  "insights": ["Einsicht"]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    kpis: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    alerts: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    targets: { type: 'object', additionalProperties: true },
                    insights: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            dashboard: response
        }), { status: 200 });

    } catch (error) {
        console.error('KPI dashboard error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});