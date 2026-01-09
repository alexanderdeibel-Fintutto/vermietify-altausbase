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

    const [filings, calculations, documents] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const analytics = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive tax analytics report for ${country}, year ${taxYear}.

Data:
- Filings: ${filings.length}
- Calculations: ${calculations.length}
- Documents: ${documents.length}

Provide:
1. Tax efficiency metrics
2. Income distribution analysis
3. Deduction breakdown
4. Tax paid vs liability
5. Year-over-year trends
6. Key performance indicators
7. Optimization opportunities
8. Benchmark comparisons
9. Savings potential
10. Visual data insights`,
      response_json_schema: {
        type: 'object',
        properties: {
          efficiency_metrics: { type: 'object', additionalProperties: true },
          income_analysis: { type: 'object', additionalProperties: true },
          deduction_breakdown: { type: 'array', items: { type: 'object', additionalProperties: true } },
          key_metrics: { type: 'array', items: { type: 'object', additionalProperties: true } },
          optimization_opportunities: { type: 'array', items: { type: 'string' } },
          savings_potential: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        data_count: { filings: filings.length, calculations: calculations.length, documents: documents.length },
        content: analytics
      }
    });
  } catch (error) {
    console.error('Generate tax analytics report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});