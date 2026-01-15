import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Sammle Daten für Empfehlungen
        const building = await base44.entities.Building.filter({ id: buildingId });
        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const leases = await base44.entities.LeaseContract.list();
        const invoices = await base44.entities.Invoice.list();
        const maintenanceTasks = await base44.entities.MaintenanceTask.list();

        const buildingLeases = leases.filter(l => units.some(u => u.id === l.unit_id));
        const buildingInvoices = invoices.filter(i => units.some(u => u.id === i.unit_id));

        const occupancyRate = (buildingLeases.length / units.length * 100).toFixed(0);
        const avgRent = (buildingLeases.reduce((sum, l) => sum + l.monthly_rent, 0) / buildingLeases.length).toFixed(2);
        const pendingMaintenance = maintenanceTasks.filter(t => t.status === 'open').length;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein erfahrener Immobilienverwalter. Basierend auf diesen Daten, gib 3-5 konkrete, actionable Empfehlungen:

Gebäude: ${building[0]?.name}
Einheiten: ${units.length}
Belegungsquote: ${occupancyRate}%
Durchschnittliche Miete: €${avgRent}
Offene Instandhaltungen: ${pendingMaintenance}
Rechnungen diesen Monat: ${buildingInvoices.length}

Format:
{
  "recommendations": [
    {
      "title": "Kurzer Titel",
      "description": "Detaillierte Beschreibung",
      "priority": "HIGH|MEDIUM|LOW",
      "impact": "Auswirkung (z.B. Kosteneinsparung, Mietoptimierung)",
      "action": "Was zu tun ist"
    }
  ]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                priority: { type: 'string' },
                                impact: { type: 'string' },
                                action: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            recommendations: response.recommendations
        }), { status: 200 });

    } catch (error) {
        console.error('Recommendation error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});