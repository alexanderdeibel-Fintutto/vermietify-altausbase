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

    // Fetch comprehensive user data
    const [filings, calculations, documents, investments, income, scenarios] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.OtherIncome.filter({ user_email: user.email }).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    const recommendations = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate personalized AI tax recommendations for ${country}, year ${taxYear}.

User Profile:
- Total Tax: €${Math.round(totalTax)}
- Investments: ${investments.length}
- Income Sources: ${income.length}
- Documents: ${documents.length}
- Scenarios Analyzed: ${scenarios.length}

Provide recommendations in three timeframes:
1. IMMEDIATE (this quarter)
   - Urgent actions needed
   - Compliance issues to address
   
2. MEDIUM TERM (next 6 months)
   - Planning opportunities
   - Optimization strategies
   
3. LONG TERM (next year and beyond)
   - Strategic planning
   - Wealth optimization
   - Succession planning

For each recommendation include:
- Action description
- Expected tax savings/benefit
- Implementation complexity
- Risk level
- Priority score (1-10)`,
      response_json_schema: {
        type: 'object',
        properties: {
          immediate_actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                benefit: { type: 'number' },
                complexity: { type: 'string' },
                risk_level: { type: 'string' },
                priority: { type: 'number' }
              }
            }
          },
          medium_term_opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                opportunity: { type: 'string' },
                potential_savings: { type: 'number' },
                timeline_months: { type: 'number' },
                requirements: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          long_term_strategies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                description: { type: 'string' },
                long_term_benefit: { type: 'string' }
              }
            }
          },
          risk_warnings: { type: 'array', items: { type: 'string' } },
          total_estimated_savings: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      recommendations: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: recommendations
      }
    });
  } catch (error) {
    console.error('Generate recommendations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});