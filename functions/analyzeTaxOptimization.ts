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

    // Fetch relevant data
    const [calculations, investments, otherIncome, planning] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.Investment.filter({ user_email: user.email }),
      base44.entities.OtherIncome.filter({ user_email: user.email, tax_year: taxYear }),
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear })
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const portfolioValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
    const incomeTotal = otherIncome.reduce((sum, i) => sum + (i.amount || 0), 0);

    // Use LLM to analyze optimizations
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax optimization opportunities for a taxpayer in ${country} for tax year ${taxYear}.

Current Situation:
- Total Tax Liability: €${totalTax.toFixed(2)}
- Portfolio Value: €${portfolioValue.toFixed(2)}
- Other Income: €${incomeTotal.toFixed(2)}
- Investment Count: ${investments.length}
- Income Sources: ${otherIncome.length}

Provide specific, actionable tax optimization recommendations for ${country} tax law including:
1. Income optimization strategies (deductions, timing, structuring)
2. Investment optimization (asset location, tax-loss harvesting, rebalancing)
3. Business structure optimization (if applicable)
4. Timing strategies for current year
5. Estate and succession planning considerations

For each recommendation, provide:
- Title
- Description
- Estimated annual savings (in EUR)
- Implementation effort (low/medium/high)
- Risk level (low/medium/high)
- Timeline for implementation
- Required actions`,
      response_json_schema: {
        type: 'object',
        properties: {
          country_tax_summary: { type: 'string' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                estimated_savings: { type: 'number' },
                effort: { type: 'string' },
                risk: { type: 'string' },
                timeline: { type: 'string' },
                actions: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          total_potential_savings: { type: 'number' },
          priority_actions: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Calculate potential impact
    const totalPotentialSavings = analysis.recommendations?.reduce((sum, r) => sum + (r.estimated_savings || 0), 0) || 0;
    const savingsPercentage = totalTax > 0 ? ((totalPotentialSavings / totalTax) * 100).toFixed(1) : 0;

    // Store recommendations as planning items
    for (const rec of (analysis.recommendations || []).slice(0, 5)) {
      await base44.entities.TaxPlanning.create({
        user_email: user.email,
        country,
        tax_year: taxYear,
        planning_type: rec.category || 'income_optimization',
        title: rec.title,
        description: rec.description,
        estimated_savings: rec.estimated_savings || 0,
        implementation_effort: rec.effort?.toLowerCase() || 'medium',
        risk_level: rec.risk?.toLowerCase() || 'low',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'suggested'
      });
    }

    return Response.json({
      status: 'success',
      analysis: {
        country,
        tax_year: taxYear,
        current_tax: totalTax,
        portfolio_value: portfolioValue,
        total_potential_savings: totalPotentialSavings,
        savings_percentage: parseFloat(savingsPercentage),
        recommendations: analysis.recommendations || [],
        priority_actions: analysis.priority_actions || [],
        summary: analysis.country_tax_summary || ''
      }
    });
  } catch (error) {
    console.error('Tax optimization analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});