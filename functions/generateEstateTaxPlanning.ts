import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];

    // Estate-Planung für Vermögensübergabe
    const planning = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle umfassendes Estate Tax Planning für ${user.email} in ${profile.primary_residence_country}:

VERMÖGEN:
- Immobilien: ${profile.number_of_properties}
- Firmenanteile: ${profile.number_of_companies}
- Kryptowährungen: ${profile.has_crypto_assets}

LÄNDER-REGELN:
- ${profile.primary_residence_country} Inheritance Tax
- Gift Tax Thresholds
- Estate Duty
- Grenzüberschreitende Transferregeln

ANALYSIERE:
1. Aktuelle Estate Tax Exposure
2. Optimale Transfermechanismen
3. Trust-Strukturen (falls sinnvoll)
4. Timing-Strategien
5. Beneficiary-Planung
6. Dokumentation-Requirements
7. Estimited Tax Liability bei Tod
8. Mitigation Strategies

GEBE KONKRETE HANDLUNGSEMPFEHLUNGEN`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          estimated_estate_value: { type: "number" },
          current_tax_liability: { type: "number" },
          optimized_tax_liability: { type: "number" },
          potential_savings: { type: "number" },
          strategies: { type: "array", items: { type: "string" } },
          risk_factors: { type: "array", items: { type: "string" } },
          timeline_for_implementation: { type: "string" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      estate_plan: planning
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});