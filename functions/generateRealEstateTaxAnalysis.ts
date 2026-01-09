import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // Immobilien-Steuern analysieren
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere Immobilien-Steuern für ${user.email} in ${country} (${tax_year}):

LÄNDER-SPEZIFISCHE RULES:
${country === 'DE' ? 'Anlage V (Einkünfte aus Vermietung), Grundsteuer, Grunderwerbsteuer, AfA-Abschreibungen' :
country === 'CH' ? 'Kantonal unterschiedliche Steuern, Liegenschaftsgewinne, Mieteinnahmen, Unterhaltskosten' :
'Einkommenssteuer auf Mieten, Grundsteuer, Vorkehrungskosten'}

ANALYSIERE:
1. Mieteinnahmen vs. Abzugskosten
2. AfA-Möglichkeiten & Strategien
3. Grundsteuer-Optimierung
4. Eigennutz vs. Vermietung
5. Verkaufsgewinne (Holding-Periode)
6. Leverage/Hypotheken-Abzüge
7. Grenzüberschreitende Immobilien
8. Entity-Struktur für Ownership

GEBE KONKRETE EMPFEHLUNGEN PRO IMMOBILIE:`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          total_rental_income: { type: "number" },
          deductible_expenses: { type: "number" },
          afa_potential: { type: "number" },
          optimal_entity_structure: { type: "string" },
          estimated_tax_liability: { type: "number" },
          optimization_strategies: { type: "array", items: { type: "string" } },
          holding_period_strategy: { type: "string" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      real_estate_analysis: analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});