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

    // Cross-border transactions sammeln
    const crossBorder = await base44.entities.CrossBorderTransaction.filter({
      user_email: user.email,
      tax_year
    });

    const cryptos = await base44.entities.CryptoHolding.filter({
      user_email: user.email,
      is_reportable: true
    });

    // KI-basierte FATCA/CRS Reporting
    const reporting = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere FATCA/CRS/AEoI Reporting für ${user.email}:

HOME COUNTRY: ${profile.primary_residence_country}
OTHER JURISDICTIONS: ${profile.tax_jurisdictions.filter(c => c !== profile.primary_residence_country).join(', ')}

MELDEPFLICHTIGE ACCOUNTS/ASSETS:
- Cross-Border Transaktionen: ${crossBorder.length}
- Reportable Crypto: ${cryptos.length}
- Totaler reportabler Wert: $${(crossBorder.reduce((s, c) => s + (c.amount || 0), 0) + cryptos.reduce((s, c) => s + (c.total_value_usd || 0), 0))}

THRESHOLD CHECKS:
- Dual citizen? 
- Permanent establishment?
- Account value over $250k?

REQUIRED FORMS:
- FATCA: Form 8938 (USA resident) / Foreign Account Tax Compliance?
- CRS: Common Reporting Standard reporting?
- AEoI: Automatic Exchange of Information?

GENERATE STRUCTURED REPORT MIT:
1. Reporting-Anforderungen pro Land
2. Erforderliche Formulare
3. Filing Deadlines
4. Required Documentation
5. Penalty Risiken
6. Best practices für Compliance`,
      response_json_schema: {
        type: "object",
        properties: {
          countries_requiring_reporting: { type: "array", items: { type: "string" } },
          reportable_items: { type: "array", items: { type: "string" } },
          required_forms: { type: "array", items: { type: "string" } },
          filing_deadlines: { type: "object", additionalProperties: { type: "string" } },
          estimated_penalties_if_missed: { type: "number" },
          compliance_steps: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      cross_border_reporting: reporting,
      transactions_count: crossBorder.length,
      crypto_count: cryptos.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});