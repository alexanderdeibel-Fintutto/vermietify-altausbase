import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { countries, taxYear, income } = await req.json();

    if (!countries || !taxYear || !income) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch data for each country
    const comparisons = await Promise.all(
      countries.map(country =>
        base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear })
          .catch(() => [])
      )
    );

    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare tax implications across ${countries.join(', ')} for income of €${Math.round(income)}.

Create detailed comparison:
1. Effective tax rates
2. Tax brackets and marginal rates
3. Deductible expenses allowed
4. Social security contributions
5. Wealth tax implications
6. Filing deadlines and complexity
7. Recommended jurisdiction

Format as comparative analysis with tables and recommendations.`,
      response_json_schema: {
        type: 'object',
        properties: {
          comparison_table: { type: 'object', additionalProperties: true },
          effective_rates: { type: 'object', additionalProperties: { type: 'number' } },
          tax_liabilities: { type: 'object', additionalProperties: { type: 'number' } },
          deduction_opportunities: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
          filing_complexity: { type: 'object', additionalProperties: { type: 'string' } },
          optimization_recommendations: { type: 'array', items: { type: 'string' } },
          best_jurisdiction: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      comparison: {
        countries,
        tax_year: taxYear,
        income,
        analysis: comparison
      }
    });
  } catch (error) {
    console.error('Multi-country comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});