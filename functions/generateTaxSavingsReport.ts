import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate detailed tax savings opportunity report for ${country}, year ${taxYear}.

Provide comprehensive analysis of:
1. Realized tax savings this year
2. Untapped savings opportunities
3. Deductions not yet claimed
4. Timing adjustments possible
5. Structure optimization potential
6. Credits and incentives available
7. Multi-year tax saving strategies
8. Estimated total savings potential
9. Implementation timeline
10. ROI for each opportunity`,
      response_json_schema: {
        type: 'object',
        properties: {
          realized_savings: { type: 'number' },
          total_opportunity: { type: 'number' },
          opportunities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          quick_wins: { type: 'array', items: { type: 'string' } },
          long_term_strategies: { type: 'array', items: { type: 'string' } },
          implementation_priority: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: report
      }
    });
  } catch (error) {
    console.error('Generate tax savings report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});