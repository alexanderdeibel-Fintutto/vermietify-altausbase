import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, scenarioName, changes } = await req.json();

    if (!country || !taxYear || !scenarioName) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const simulation = await base44.integrations.Core.InvokeLLM({
      prompt: `Simulate tax scenario for ${country}, year ${taxYear}.

Scenario: ${scenarioName}
Changes: ${JSON.stringify(changes, null, 2)}

Analyze:
1. Impact on total tax liability
2. Effective tax rate change
3. Marginal tax implications
4. Compliance considerations
5. Feasibility assessment
6. Risk factors
7. Recommended adjustments`,
      response_json_schema: {
        type: 'object',
        properties: {
          scenario_name: { type: 'string' },
          base_tax: { type: 'number' },
          scenario_tax: { type: 'number' },
          tax_savings: { type: 'number' },
          tax_savings_percentage: { type: 'number' },
          effective_rate_before: { type: 'number' },
          effective_rate_after: { type: 'number' },
          compliance_impact: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          feasibility: { type: 'string' },
          recommendation: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      simulation
    });
  } catch (error) {
    console.error('Simulate tax scenario error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});