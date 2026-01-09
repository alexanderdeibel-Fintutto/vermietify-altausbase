import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing tax year' }, { status: 400 });
    }

    // Fetch data from all three countries
    const [atData, chData, deData] = await Promise.all([
      {
        calculations: await base44.entities.TaxCalculation.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
        filings: await base44.entities.TaxFiling.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
        investments: await base44.entities.InvestmentAT.filter({ user_email: user.email }) || []
      },
      {
        calculations: await base44.entities.TaxCalculation.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
        filings: await base44.entities.TaxFiling.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
        investments: await base44.entities.InvestmentCH.filter({ user_email: user.email }) || []
      },
      {
        calculations: await base44.entities.TaxCalculation.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || [],
        filings: await base44.entities.TaxFiling.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || [],
        investments: await base44.entities.Investment.filter({ user_email: user.email }) || []
      }
    ]);

    const totalTaxAT = atData.calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const totalTaxCH = chData.calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const totalTaxDE = deData.calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    // Use LLM to generate strategy
    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Create an international tax strategy for a DACH taxpayer for tax year ${taxYear}.

Austria Status:
- Total Tax: €${Math.round(totalTaxAT)}
- Tax Filings: ${atData.filings.length}
- Investments: ${atData.investments.length}

Switzerland Status:
- Total Tax: CHF${Math.round(totalTaxCH)}
- Tax Filings: ${chData.filings.length}
- Investments: ${chData.investments.length}

Germany Status:
- Total Tax: €${Math.round(totalTaxDE)}
- Tax Filings: ${deData.filings.length}
- Investments: ${deData.investments.length}

Provide a comprehensive multi-country tax strategy including:
1. Overall Tax Burden Analysis
2. Double Taxation Risks
3. Treaty Benefits Opportunities
4. Country-Specific Optimization
5. Cross-Border Coordination Strategies
6. Asset Allocation Recommendations
7. Filing Efficiency Improvements
8. Risk Assessment by Jurisdiction
9. Estimated Overall Savings
10. Implementation Timeline`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_tax_burden: { type: 'number' },
          effective_tax_rate: { type: 'number' },
          double_taxation_risks: { type: 'array', items: { type: 'string' } },
          treaty_benefits: { type: 'array', items: { type: 'string' } },
          country_strategies: {
            type: 'object',
            properties: {
              austria: { type: 'object', additionalProperties: true },
              switzerland: { type: 'object', additionalProperties: true },
              germany: { type: 'object', additionalProperties: true }
            }
          },
          cross_border_opportunities: { type: 'array', items: { type: 'string' } },
          estimated_savings: { type: 'number' },
          priority_actions: { type: 'array', items: { type: 'string' } },
          implementation_timeline: { type: 'string' },
          risk_summary: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        current_status: {
          austria: { total_tax: totalTaxAT, filings: atData.filings.length },
          switzerland: { total_tax: totalTaxCH, filings: chData.filings.length },
          germany: { total_tax: totalTaxDE, filings: deData.filings.length },
          combined_tax: totalTaxAT + totalTaxCH + totalTaxDE
        },
        strategy: strategy
      }
    });
  } catch (error) {
    console.error('International tax strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});