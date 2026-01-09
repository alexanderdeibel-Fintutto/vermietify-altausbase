import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, primary_country } = await req.json();

    // Lade alle Income Sources
    const profile = (await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    ))[0];

    const income_sources = profile?.income_sources || [];
    const jurisdictions = profile?.tax_jurisdictions || [primary_country];

    // Distribute income across jurisdictions with treaty logic
    const distribution = await base44.integrations.Core.InvokeLLM({
      prompt: `Verteile Einkünfte auf Steuerjurisdiktionen mit Treaty Logic:

PRIMARY COUNTRY: ${primary_country}
JURISDICTIONS: ${jurisdictions.join(', ')}
TAX YEAR: ${tax_year}

INCOME SOURCES:
${JSON.stringify(income_sources.map(s => ({
  type: s.type,
  country: s.country,
  description: s.description
})), null, 2)}

TREATY RULES:
- German-Swiss: Ch. Art. 7 (Business Profits)
- German-Austrian: Art. 7 (Profits)
- Swiss-Austrian: Dividends, Interest (Art. 10, 11)

BERECHNE:
1. Taxable in Primary Country (full + treaty credit)
2. Taxable in Secondary Countries (source income only)
3. Withholding Tax Obligations
4. Foreign Tax Credits
5. Treaty Verification Status

GEBE pro Country:
- Gross Income
- Deductions (local / treaty)
- Taxable Income
- Tax Rate (marginal)
- Estimated Tax
- Withholding Tax Paid
- Net Credit/Charge`,
      response_json_schema: {
        type: "object",
        properties: {
          primary_country_distribution: {
            type: "object",
            properties: {
              gross_income: { type: "number" },
              deductions: { type: "number" },
              taxable_income: { type: "number" },
              tax_rate: { type: "number" },
              estimated_tax: { type: "number" },
              foreign_tax_credit: { type: "number" }
            }
          },
          secondary_countries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                country: { type: "string" },
                source_income: { type: "number" },
                withholding_tax: { type: "number" },
                treaty_applies: { type: "boolean" },
                treaty_rate: { type: "number" }
              }
            }
          },
          total_worldwide_income: { type: "number" },
          total_worldwide_tax: { type: "number" },
          treaty_verification_needed: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save cross-border calculation
    const calculation = await base44.entities.TaxCalculation.create({
      user_email: user.email,
      country: primary_country,
      tax_year,
      calculation_type: 'complete',
      calculation_data: distribution,
      total_tax: distribution.total_worldwide_tax
    });

    // Create CrossBorderTransaction records for tracking
    for (const source of income_sources) {
      if (source.country && source.country !== primary_country) {
        await base44.entities.CrossBorderTransaction.create({
          user_email: user.email,
          transaction_date: `${tax_year}-01-01`,
          transaction_type: 'income',
          source_country: source.country,
          destination_country: primary_country,
          amount: 0,
          tax_year,
          reporting_required: ['CRS', 'AEoI'],
          taxable_event: true
        });
      }
    }

    return Response.json({
      user_email: user.email,
      country: primary_country,
      tax_year,
      calculation_id: calculation.id,
      distribution,
      treaty_verification_needed: distribution.treaty_verification_needed
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});