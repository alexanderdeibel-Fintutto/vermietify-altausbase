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

    // Fetch wealth and tax data
    const [portfolios, calculations, realEstate, scenarios] = await Promise.all([
      base44.entities.AssetPortfolio.filter({ user_email: user.email }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.RealEstate?.filter({ user_email: user.email }).catch(() => []) || [],
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const totalPortfolioValue = portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0);
    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive wealth-to-tax analysis for ${country}, year ${taxYear}.

Wealth Position:
- Portfolio Value: €${Math.round(totalPortfolioValue)}
- Real Estate: ${realEstate.length} properties
- Total Tax: €${Math.round(totalTax)}
- Assets: ${portfolios.length}

Analyze:
1. Tax efficiency ratio (tax as % of wealth)
2. Asset allocation tax impact
3. Wealth tax implications
4. Estate planning considerations
5. Geographic tax optimization
6. Asset location optimization
7. Tax-efficient growth strategies
8. Long-term wealth preservation
9. Succession tax planning`,
      response_json_schema: {
        type: 'object',
        properties: {
          wealth_position: { type: 'object', additionalProperties: true },
          tax_efficiency_metrics: { type: 'object', additionalProperties: true },
          asset_location_analysis: { type: 'array', items: { type: 'object', additionalProperties: true } },
          wealth_tax_implications: { type: 'object', additionalProperties: true },
          optimization_strategies: { type: 'array', items: { type: 'string' } },
          succession_planning_notes: { type: 'array', items: { type: 'string' } },
          estimated_wealth_preservation: { type: 'number' }
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
          portfolio_value: totalPortfolioValue,
          tax_amount: totalTax,
          tax_efficiency_ratio: totalPortfolioValue > 0 ? ((totalTax / totalPortfolioValue) * 100) : 0
        },
        content: analysis
      }
    });
  } catch (error) {
    console.error('Generate wealth tax analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});