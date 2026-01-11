import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { building_id, year } = await req.json();
    
    const building = await base44.asServiceRole.entities.Building.read(building_id);
    const units = await base44.asServiceRole.entities.Unit.filter({ building_id });
    
    // Get all meter readings
    const meterReadings = await base44.asServiceRole.entities.MeterReading.filter({ 
      building_id 
    });

    // Get costs from budget
    const budgets = await base44.asServiceRole.entities.PropertyBudget.filter({ 
      building_id, 
      year 
    });

    const totalCosts = budgets[0] ? 
      Object.values(budgets[0].actual_expenses || {}).reduce((a, b) => a + (b || 0), 0) : 0;

    // AI-powered allocation
    const allocation = await base44.integrations.Core.InvokeLLM({
      prompt: `Berechne automatisch die Nebenkostenabrechnung:

Gebäude: ${building.name}
Gesamtkosten: ${totalCosts}€
Anzahl Einheiten: ${units.length}
Zählerstände: ${meterReadings.length} Einträge

Verteile die Kosten fair nach:
- Wohnfläche (40%)
- Verbrauch (40%)
- Personenzahl (20%)

Erstelle für jede Einheit eine detaillierte Abrechnung.`,
      response_json_schema: {
        type: "object",
        properties: {
          settlements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                unit_id: { type: "string" },
                total_share: { type: "number" },
                breakdown: {
                  type: "object",
                  properties: {
                    heating: { type: "number" },
                    water: { type: "number" },
                    waste: { type: "number" },
                    maintenance: { type: "number" }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Create settlements
    const settlements = [];
    for (const settlement of allocation.settlements) {
      const unit = units.find(u => u.id === settlement.unit_id);
      if (!unit) continue;

      const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
        unit_id: unit.id, 
        status: 'active' 
      });
      if (contracts.length === 0) continue;

      const created = await base44.asServiceRole.entities.UtilitySettlement.create({
        contract_id: contracts[0].id,
        tenant_id: contracts[0].tenant_id,
        company_id: building.company_id,
        period_start: `${year}-01-01`,
        period_end: `${year}-12-31`,
        advance_payments: (contracts[0].utility_advance || 0) * 12,
        actual_costs: settlement.total_share,
        balance: settlement.total_share - ((contracts[0].utility_advance || 0) * 12),
        cost_breakdown: Object.entries(settlement.breakdown).map(([cat, amt]) => ({
          category: cat,
          amount: amt
        })),
        status: 'draft'
      });
      settlements.push(created);
    }

    return Response.json({ success: true, settlements });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});