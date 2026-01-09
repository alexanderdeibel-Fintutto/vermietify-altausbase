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

    // Fetch user's complete tax profile
    const [filings, calculations, planning, documents, investments, other_income] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      country === 'AT' ? base44.entities.InvestmentAT.filter({ user_email: user.email }).catch(() => []) :
      country === 'CH' ? base44.entities.InvestmentCH.filter({ user_email: user.email }).catch(() => []) :
      [],
      country === 'AT' ? base44.entities.OtherIncomeAT.filter({ user_email: user.email }).catch(() => []) :
      country === 'CH' ? base44.entities.OtherIncomeCH.filter({ user_email: user.email }).catch(() => []) :
      []
    ]);

    const totalIncome = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const totalDocuments = documents.length;

    const recommendations = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate personalized tax optimization recommendations for ${country}, year ${taxYear}.

Profile Summary:
- Total Tax: €${totalIncome}
- Filings: ${filings.length}
- Documents: ${totalDocuments}
- Planning Items: ${planning.length}
- Investments: ${investments.length}
- Other Income Sources: ${other_income.length}

Provide:
1. Top 3 immediate opportunities (high impact, low effort)
2. Medium-term strategies (3-12 months)
3. Long-term planning (1+ years)
4. Risk areas to address
5. Compliance checklist
6. Estimated potential savings
7. Implementation timeline`,
      response_json_schema: {
        type: 'object',
        properties: {
          immediate_opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                potential_savings: { type: 'number' },
                effort_level: { type: 'string' },
                timeline: { type: 'string' }
              }
            }
          },
          medium_term_strategies: { type: 'array', items: { type: 'string' } },
          long_term_planning: { type: 'array', items: { type: 'string' } },
          risk_areas: { type: 'array', items: { type: 'string' } },
          compliance_checklist: { type: 'array', items: { type: 'string' } },
          total_potential_savings: { type: 'number' },
          implementation_timeline: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      recommendations: {
        country,
        tax_year: taxYear,
        profile: {
          total_tax: totalIncome,
          documents_count: totalDocuments,
          investments_count: investments.length,
          other_income_count: other_income.length
        },
        ai_analysis: recommendations
      }
    });
  } catch (error) {
    console.error('Generate AI recommendations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});