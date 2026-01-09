import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country, donation_budget } = await req.json();

    // Charitable Donation Tax Optimization
    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle optimale Charities Donations Strategie für ${user.email} (${tax_year}):

BUDGET: $${donation_budget}
COUNTRY: ${country}

TAX RULES:
${country === 'CH' ? 'Kantonale Unterschiede, max 20% Einkommen, Spendenbescheinigung erforderlich' :
country === 'DE' ? 'Max 20% Einkommen Abzug, Bestandteile (Geldspenden vs. Sachspenden), Daueraufträge' :
'Max 10-15% Einkommen, Listed Charities, Donor-Advised Funds'}

OPTIMIERE:
1. Entity-Type für Spenden (Donor-Advised Funds, Stiftungen)
2. Timing (dieses Jahr vs. nächstes)
3. Asset-Type (Cash vs. Appreciated Securities)
4. Tax-Loss Harvesting + Charitable
5. Clustering (jährlich vs. multi-year)
6. International Giving (Spendenabzug in mehreren Ländern)

GEBE:
- Maximale Spenden-Abzüge
- Entity-Recommendations
- Timing Strategy
- Documentation Checklist`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          recommended_donation_amount: { type: "number" },
          tax_deduction: { type: "number" },
          estimated_tax_savings: { type: "number" },
          suggested_donation_vehicles: { type: "array", items: { type: "string" } },
          timing_strategy: { type: "string" },
          charity_selection_criteria: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      charitable_strategy: strategy
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});