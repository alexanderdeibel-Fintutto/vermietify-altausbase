import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // Get comprehensive user data
    const profile = (await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    ))[0];

    const calculation = (await base44.entities.TaxCalculation.filter(
      { user_email: user.email, country, tax_year },
      '-updated_date',
      1
    ))[0];

    const crypto = await base44.entities.CryptoHolding.filter({
      user_email: user.email
    });

    // AI generates optimization suggestions
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere Steueroptimierungs-Vorschläge für komplexes Szenario:

PROFIL: ${profile?.profile_type}
LÄNDER: ${profile?.tax_jurisdictions?.join(', ')}
STEUERLAST: €${calculation?.total_tax?.toLocaleString()}

ASSETS:
- Crypto Holdings: ${crypto.length}
- Business Entities: ${profile?.business_entities?.length}
- Properties: ${profile?.number_of_properties}

EXISTING CALC:
${JSON.stringify(calculation?.calculation_data, null, 2)}

OPTIMIERUNGS-POTENZIALE:

1. Tax Loss Harvesting (Crypto)
2. Treaty Optimization (wenn multi-country)
3. Timing Strategies (Realization of gains/losses)
4. Business Structure Changes (GmbH vs. Einzelunternehmer)
5. Charitable Donations
6. Deduction Maximization
7. Entity Location Optimization
8. Withholding Tax Planning

PRO OPTION:
- Name & Description
- Estimated Savings: €
- Implementation Difficulty: easy/medium/hard
- Tax Risk: low/medium/high
- Legality: fully_legal/grey_area
- Deadline to Implement
- Required Actions

FOKUS auf: Praktisch umsetzbar, Legal, Realistisch für den User`,
      response_json_schema: {
        type: "object",
        properties: {
          optimization_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                estimated_savings: { type: "number" },
                difficulty: { type: "string" },
                tax_risk: { type: "string" },
                legality: { type: "string" },
                implementation_deadline: { type: "string" },
                required_actions: { type: "array", items: { type: "string" } },
                priority_score: { type: "number" }
              }
            }
          },
          total_optimization_potential: { type: "number" },
          recommendation_summary: { type: "string" }
        }
      }
    });

    // Save suggestions for user
    for (const opp of suggestions.optimization_opportunities || []) {
      await base44.entities.TaxScenario.create({
        user_email: user.email,
        country,
        tax_year,
        scenario_name: opp.name,
        scenario_type: 'tax_optimization',
        description: opp.description,
        tax_savings: opp.estimated_savings,
        feasibility: opp.difficulty === 'easy' ? 'highly_feasible' : opp.difficulty === 'medium' ? 'feasible' : 'limited',
        risk_level: opp.tax_risk,
        status: 'draft'
      });
    }

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      total_opportunities: suggestions.optimization_opportunities?.length || 0,
      total_potential_savings: suggestions.total_optimization_potential,
      recommendations: suggestions.optimization_opportunities?.sort((a, b) => b.priority_score - a.priority_score)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});