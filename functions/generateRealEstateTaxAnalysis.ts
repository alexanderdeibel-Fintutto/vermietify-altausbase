import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch real estate and tax data
    const [properties, calculations, income] = await Promise.all([
      base44.entities.RealEstate?.filter({ user_email: user.email, country }).catch(() => []) || [],
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.OtherIncome.filter({ user_email: user.email, income_type: 'rental' }).catch(() => [])
    ]);

    const totalRentalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive real estate tax analysis for ${country}, year ${taxYear}.

Properties: ${properties.length}
Rental Income: €${Math.round(totalRentalIncome)}
Total Tax: €${Math.round(totalTax)}

Provide analysis:
1. Rental income optimization
2. Deductible expenses (mortgage, maintenance, insurance, property tax)
3. Depreciation strategy (Abschreibung)
4. Capital gains planning if selling
5. 1031 exchange opportunities
6. Passive loss limitation rules
7. Vacation rental vs long-term rental tax differences
8. Entity structure optimization (LLC, S-Corp, individual)
9. Estimated tax savings opportunity`,
      response_json_schema: {
        type: 'object',
        properties: {
          rental_income_analysis: { type: 'object', additionalProperties: true },
          deductible_expenses: { type: 'array', items: { type: 'object', additionalProperties: true } },
          depreciation_strategy: { type: 'object', additionalProperties: true },
          capital_gains_considerations: { type: 'array', items: { type: 'string' } },
          entity_structure_recommendation: { type: 'string' },
          estimated_annual_savings: { type: 'number' },
          action_items: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      analysis: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        metrics: {
          property_count: properties.length,
          rental_income: totalRentalIncome,
          tax_amount: totalTax
        },
        content: analysis
      }
    });
  } catch (error) {
    console.error('Generate real estate tax analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});