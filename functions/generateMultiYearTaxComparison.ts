import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, startYear, endYear } = await req.json();

    if (!country || !startYear || !endYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch data for all years
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }

    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate multi-year tax comparison for ${country}, years ${startYear}-${endYear}.

Provide:
1. Year-by-year tax liability comparison
2. Income trends and changes
3. Deduction variations
4. Tax rate changes
5. Savings improvements
6. Key changes between years
7. Percentage changes
8. Cumulative trends
9. Future projections
10. Recommendations based on trends`,
      response_json_schema: {
        type: 'object',
        properties: {
          year_summary: { type: 'array', items: { type: 'object', additionalProperties: true } },
          trends: { type: 'object', additionalProperties: true },
          key_changes: { type: 'array', items: { type: 'string' } },
          growth_metrics: { type: 'object', additionalProperties: true },
          projections: { type: 'object', additionalProperties: true },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      comparison: {
        country,
        period: `${startYear}-${endYear}`,
        generated_at: new Date().toISOString(),
        year_count: years.length,
        content: comparison
      }
    });
  } catch (error) {
    console.error('Generate multi-year comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});