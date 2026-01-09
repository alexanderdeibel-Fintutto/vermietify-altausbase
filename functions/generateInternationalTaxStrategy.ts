import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { countries = ['AT', 'CH', 'DE'], taxYear, income } = await req.json();

    if (!taxYear || !income) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Create international tax strategy for someone operating in ${countries.join(', ')}.

Profile:
- Countries: ${countries.join(', ')}
- Tax Year: ${taxYear}
- Income: €${income}

Develop strategy covering:
1. Tax treaty optimization
2. Permanent establishment risks
3. Transfer pricing considerations
4. Tax residency planning
5. Business structure recommendations
6. Filing requirements per country
7. Double taxation avoidance
8. Estimated total tax burden`,
      response_json_schema: {
        type: 'object',
        properties: {
          primary_residence: { type: 'string' },
          treaty_opportunities: { type: 'array', items: { type: 'string' } },
          pe_risks: { type: 'array', items: { type: 'string' } },
          filing_requirements: { type: 'array', items: { type: 'string' } },
          structure_recommendation: { type: 'string' },
          estimated_total_tax: { type: 'number' },
          estimated_optimized_tax: { type: 'number' },
          potential_savings: { type: 'number' },
          risk_level: { type: 'string' },
          action_items: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        countries,
        tax_year: taxYear,
        income,
        analysis: strategy
      }
    });
  } catch (error) {
    console.error('Generate international strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});