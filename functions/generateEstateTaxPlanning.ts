import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, totalAssets, familyStatus, charitableGoals } = await req.json();

    if (!country || !totalAssets) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const planning = await base44.integrations.Core.InvokeLLM({
      prompt: `Create comprehensive estate tax planning strategy for ${country}.

Estate Profile:
- Total Assets: €${Math.round(totalAssets)}
- Family Status: ${familyStatus || 'Not specified'}
- Charitable Goals: ${charitableGoals ? 'Yes' : 'No'}

Provide:
1. Estate tax liability estimate
2. Federal and state estate tax implications
3. Exemption utilization strategies
4. Trust planning (revocable, irrevocable, bypass trusts)
5. Charitable giving strategies
6. Life insurance planning
7. Asset titling optimization
8. Business succession planning
9. Portability election strategy
10. Annual gift tax exclusion planning
11. Generation-skipping tax considerations
12. Probate avoidance strategies`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_estate_analysis: { type: 'object', additionalProperties: true },
          estimated_estate_tax: { type: 'number' },
          available_exemptions: { type: 'number' },
          tax_reduction_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          trust_recommendations: { type: 'array', items: { type: 'string' } },
          estimated_tax_savings: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      planning: {
        country,
        generated_at: new Date().toISOString(),
        content: planning
      }
    });
  } catch (error) {
    console.error('Generate estate tax planning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});