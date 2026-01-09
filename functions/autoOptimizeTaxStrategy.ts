import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    // Alle Daten zusammentragen
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];
    const incomes = await base44.entities.OtherIncome.filter({ user_email: user.email, tax_year });
    const capitals = await base44.entities.CapitalGain.filter({ user_email: user.email, tax_year });
    const cryptos = await base44.entities.CryptoHolding.filter({ user_email: user.email });
    const crossBorder = await base44.entities.CrossBorderTransaction.filter({ user_email: user.email, tax_year });

    // KI-gestützte Optimierung mit lokalen Steuergesetzen
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Senior Tax Strategist mit Expertise in CH/DE/AT Steuersystemen und internationalen Abkommen.

Analysiere folgende Steuersituation und erstelle einen umfassenden Optimierungsplan:

PROFIL:
- Länder: ${profile.tax_jurisdictions.join(', ')}
- Typ: ${profile.profile_type}
- Firmenanteile: ${profile.number_of_companies}
- Immobilien: ${profile.number_of_properties}
- Kryptowährungen: ${profile.has_crypto_assets ? 'Ja' : 'Nein'}

FINANZIELLE SITUATION ${tax_year}:
- Gesamteinkommen: ${incomes.reduce((s, i) => s + (i.amount || 0), 0)}
- Kapitalerträge: ${capitals.reduce((s, c) => s + (c.capital_gain || 0), 0)}
- Krypto-Bestände: ${cryptos.length} Holdings, Wert: ${cryptos.reduce((s, c) => s + (c.total_value_usd || 0), 0)}
- Grenzüberschreitend: ${crossBorder.length} Transaktionen

ANFORDERUNGEN:
1. Top 5 konkrete, umsetzbare Optimierungsstrategien mit Sparquoten
2. Treaty-Optimierungsmöglichkeiten zwischen deklarieren Ländern
3. Strukturelle Optimierungen (Entity-Setup, Timing)
4. Risikobewertung für jede Strategie
5. Implementierungs-Timeline
6. Notwendige Dokumentation`,
      response_json_schema: {
        type: "object",
        properties: {
          strategies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                estimated_savings: { type: "number" },
                implementation_effort: { type: "string" },
                risk_level: { type: "string" },
                timeline_months: { type: "number" },
                countries_affected: { type: "array", items: { type: "string" } }
              }
            }
          },
          total_potential_savings: { type: "number" },
          critical_risks: { type: "array", items: { type: "string" } },
          priority_actions: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Speichern als TaxPlanning Entity
    await base44.asServiceRole.entities.TaxPlanning.bulkCreate(
      optimization.strategies.map(s => ({
        user_email: user.email,
        country: 'CH',
        tax_year,
        planning_type: 'income_optimization',
        title: s.name,
        description: s.description,
        estimated_savings: s.estimated_savings,
        implementation_effort: s.implementation_effort,
        risk_level: s.risk_level,
        status: 'suggested'
      }))
    );

    return Response.json({
      user_email: user.email,
      tax_year,
      optimization_plan: optimization,
      saved_as_planning_items: optimization.strategies.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});