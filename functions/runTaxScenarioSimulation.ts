import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, scenarios } = await req.json();
    // scenarios = [
    //   { name: "Salary Increase to $200k", salary_increase: 50000 },
    //   { name: "Crypto Gains +$100k", crypto_gains: 100000 },
    //   { name: "Relocation to Switzerland", country: "CH" }
    // ]

    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];
    const currentCalc = (await base44.entities.TaxCalculation.filter({ user_email: user.email, tax_year }, '-updated_date', 1))[0];

    const results = [];

    for (const scenario of scenarios) {
      const simulation = await base44.integrations.Core.InvokeLLM({
        prompt: `Simuliere Steuerszenario für ${user.email}:

BASELINE (${tax_year}):
${JSON.stringify(currentCalc?.calculation_data || {}, null, 2)}

SZENARIO: ${scenario.name}
${JSON.stringify(scenario, null, 2)}

LAND: ${scenario.country || profile.primary_residence_country}

BERECHNE:
- Neue Steuerbelastung
- Impact vs. Baseline
- Effektiver Steuersatz
- Quartalsweise Zahlungen
- Optionale Optimierungen`,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_name: { type: "string" },
            estimated_tax: { type: "number" },
            tax_increase: { type: "number" },
            effective_rate: { type: "number" },
            quarterly_impact: { type: "number" },
            mitigation_strategies: { type: "array", items: { type: "string" } }
          }
        }
      });

      results.push(simulation);

      // Speichern als TaxScenario
      await base44.asServiceRole.entities.TaxScenario.create({
        user_email: user.email,
        country: scenario.country || profile.primary_residence_country,
        tax_year,
        scenario_name: scenario.name,
        scenario_type: 'income_adjustment',
        description: JSON.stringify(scenario),
        base_calculation_id: currentCalc?.id,
        scenario_parameters: scenario,
        calculation_results: simulation,
        tax_savings: currentCalc?.total_tax - simulation.estimated_tax,
        tax_impact: simulation.estimated_tax,
        status: 'analyzed'
      });
    }

    return Response.json({
      user_email: user.email,
      tax_year,
      scenarios_analyzed: results.length,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});