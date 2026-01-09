import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, income, businessActivities } = await req.json();

    if (!country || !taxYear || !income) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const credits = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify all available tax credits and incentives for ${country}, year ${taxYear}.

Profile:
- Annual Income: €${Math.round(income)}
- Business Activities: ${businessActivities || 'None specified'}

Identify:
1. Earned Income Tax Credit (EITC/similar)
2. Child tax credits
3. Education credits (tuition, student loans)
4. Residential energy credits
5. Electric vehicle credits
6. R&D tax credits
7. Work opportunity credits
8. Employer-provided benefits
9. Adoption credits
10. Caregiving credits
11. Green energy incentives
12. Small business incentives
13. Disaster relief credits
14. Foreign tax credits
15. Estimated total value of credits`,
      response_json_schema: {
        type: 'object',
        properties: {
          available_credits: { type: 'array', items: { type: 'object', additionalProperties: true } },
          estimated_total_credits: { type: 'number' },
          eligibility_checklist: { type: 'array', items: { type: 'string' } },
          application_timeline: { type: 'array', items: { type: 'string' } },
          documentation_required: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      analysis: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: credits
      }
    });
  } catch (error) {
    console.error('Generate tax credits and incentives error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});