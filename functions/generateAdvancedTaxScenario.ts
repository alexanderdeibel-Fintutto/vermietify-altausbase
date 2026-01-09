import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, scenarioType, parameters } = await req.json();

    if (!country || !scenarioType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const scenario = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax scenario for ${country}: ${scenarioType}

Scenario Parameters: ${JSON.stringify(parameters || {})}

Provide detailed analysis including:
1. Tax impact summary
2. Projected liability
3. Comparison to baseline
4. Break-even analysis
5. Risk assessment
6. Implementation steps
7. Documentation requirements
8. Timing considerations
9. Potential complications
10. Success factors`,
      response_json_schema: {
        type: 'object',
        properties: {
          scenario_type: { type: 'string' },
          tax_impact: { type: 'number' },
          projected_liability: { type: 'number' },
          savings_vs_baseline: { type: 'number' },
          risk_score: { type: 'number' },
          feasibility: { type: 'string' },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          success_factors: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      scenario: {
        country,
        type: scenarioType,
        generated_at: new Date().toISOString(),
        content: scenario
      }
    });
  } catch (error) {
    console.error('Generate advanced scenario error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});