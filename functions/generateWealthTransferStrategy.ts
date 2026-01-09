import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, beneficiary_country } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];

    // Optimale Wealth Transfer Strategie
    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Entwickle optimale Wealth Transfer Strategie von ${profile.primary_residence_country} nach ${beneficiary_country}:

ÜBERLEGUNGEN:
- Source Country (${profile.primary_residence_country}) Regeln
- Recipient Country (${beneficiary_country}) Regeln
- Applicable Tax Treaties
- Timing-Optimierung
- Asset Class spezifische Strategien (Real Estate, Crypto, Shares, Cash)

TRANSFER-OPTIONEN:
1. Direct Gift (sofort, Schenkungs-Steuer)
2. Trust-strukturiert Transfer
3. Life Insurance Vehicles
4. Step-up Basis bei Tod
5. Installment Sales
6. GRAT (falls USA relevant)

GEBE EMPFEHLUNG MIT:
- Steuer-Effizienz
- Implementierungs-Aufwand
- Kontrollverlust-Risiken
- Dokumentations-Anforderungen
- Estimated Tax Costs`,
      response_json_schema: {
        type: "object",
        properties: {
          source_country: { type: "string" },
          recipient_country: { type: "string" },
          recommended_strategy: { type: "string" },
          tax_efficiency_score: { type: "number" },
          estimated_tax_savings: { type: "number" },
          risks: { type: "array", items: { type: "string" } },
          implementation_steps: { type: "array", items: { type: "string" } },
          timeline_months: { type: "number" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      strategy
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});