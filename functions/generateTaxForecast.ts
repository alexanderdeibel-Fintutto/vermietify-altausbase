import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, currentIncome, growthRate, years } = await req.json();

    if (!country || !currentIncome) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const forecast = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate tax forecast for ${country} for next ${years || 3} years.

Current Income: €${Math.round(currentIncome)}
Expected Growth Rate: ${growthRate || 5}%

Provide:
1. Year-by-year income projection
2. Estimated tax liability for each year
3. Quarterly payment schedule
4. Tax rate changes if applicable
5. Withholding recommendations
6. Planning opportunities
7. Risk areas
8. Action items for each quarter`,
      response_json_schema: {
        type: 'object',
        properties: {
          projections: { type: 'array', items: { type: 'object', additionalProperties: true } },
          quarterly_schedule: { type: 'array', items: { type: 'string' } },
          planning_opportunities: { type: 'array', items: { type: 'string' } },
          risk_areas: { type: 'array', items: { type: 'string' } },
          cumulative_tax_liability: { type: 'number' },
          recommended_savings: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      forecast: {
        country,
        years_ahead: years || 3,
        generated_at: new Date().toISOString(),
        content: forecast
      }
    });
  } catch (error) {
    console.error('Generate tax forecast error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});