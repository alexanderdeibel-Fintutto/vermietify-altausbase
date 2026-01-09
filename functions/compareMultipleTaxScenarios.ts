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

    // Fetch all scenarios for comparison
    const scenarios = await base44.entities.TaxScenario.filter({ 
      user_email: user.email, 
      country, 
      tax_year: taxYear 
    }).catch(() => []);

    if (scenarios.length < 2) {
      return Response.json({ 
        error: 'Need at least 2 scenarios to compare' 
      }, { status: 400 });
    }

    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare multiple tax scenarios for ${country}, year ${taxYear}.

Scenarios Available: ${scenarios.length}

Provide comparison:
1. Side-by-side tax impact analysis
2. Savings/cost for each scenario
3. Feasibility ranking
4. Risk assessment comparison
5. Implementation difficulty ranking
6. Recommended scenario with reasoning
7. Hybrid approach suggestions
8. Timeline considerations`,
      response_json_schema: {
        type: 'object',
        properties: {
          scenario_rankings: { type: 'array', items: { type: 'object', additionalProperties: true } },
          tax_impact_matrix: { type: 'object', additionalProperties: true },
          recommendation: { type: 'string' },
          hybrid_approach: { type: 'string' },
          summary_table: { type: 'array', items: { type: 'object', additionalProperties: true } }
        }
      }
    });

    return Response.json({
      status: 'success',
      comparison: {
        country,
        tax_year: taxYear,
        scenario_count: scenarios.length,
        generated_at: new Date().toISOString(),
        content: comparison
      }
    });
  } catch (error) {
    console.error('Compare scenarios error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});