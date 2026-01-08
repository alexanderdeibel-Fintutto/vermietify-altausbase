import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_year } = await req.json();

    console.log('[OPTIMIZATION] Analyzing tax optimization opportunities');

    // Lade Gebäude & Finanzdaten
    const buildings = await base44.entities.Building.filter({ id: building_id });
    if (!buildings?.length) {
      return Response.json({ error: 'Building not found' }, { status: 404 });
    }

    const building = buildings[0];

    // Lade FinancialItems
    const allItems = await base44.entities.FinancialItem.filter();
    const yearItems = allItems.filter(item => {
      const itemYear = new Date(item.date).getFullYear();
      return itemYear === tax_year && item.building_id === building_id;
    });

    // KI-Analyse für Optimierungen
    const prompt = `
Du bist ein Steuerberater. Analysiere diese Vermietungsdaten und gib konkrete Steuer-Optimierungsvorschläge:

GEBÄUDE: ${JSON.stringify({ address: building.address, purchase_price: building.purchase_price })}
EINNAHMEN: ${yearItems.filter(i => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0)}
AUSGABEN: ${yearItems.filter(i => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0)}

AUSGABENKATEGORIEN:
${Object.entries(
  yearItems.reduce((acc, item) => {
    const cat = item.cost_category || 'SONSTIGE';
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {})
).map(([cat, amount]) => `- ${cat}: €${amount}`).join('\n')}

Gib maximal 5 konkrete, umsetzbare Optimierungsvorschläge mit:
- Titel
- Beschreibung
- Potenzielle Steuereinsparung (%)
- Aufwand (gering/mittel/hoch)
- Compliance-Risiko (gering/mittel/hoch)

Antworte NUR mit JSON.
    `;

    const optimizations = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                estimated_savings_percent: { type: "number" },
                effort: { type: "string" },
                compliance_risk: { type: "string" },
                implementation_steps: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    return Response.json({ 
      success: true, 
      building_id,
      tax_year,
      suggestions: optimizations.suggestions || []
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});