import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, data } = await req.json();

    if (!country || !taxYear || !data) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const validation = await base44.integrations.Core.InvokeLLM({
      prompt: `Validate tax data for ${country}, year ${taxYear}.

Data to validate:
${JSON.stringify(data, null, 2)}

Check for:
1. Completeness (all required fields present)
2. Consistency (no contradictions between values)
3. Plausibility (values within expected ranges)
4. Documentation (required documents present)
5. Compliance (meets country-specific requirements)
6. Red flags (unusual patterns or potential issues)

Return validation result with:
- Overall status (valid, warnings, errors)
- List of issues
- Recommendations
- Risk score (0-100)`,
      response_json_schema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          is_valid: { type: 'boolean' },
          completeness_score: { type: 'number' },
          consistency_score: { type: 'number' },
          plausibility_score: { type: 'number' },
          overall_score: { type: 'number' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                severity: { type: 'string' },
                message: { type: 'string' },
                suggestion: { type: 'string' }
              }
            }
          },
          red_flags: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          risk_score: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      validation
    });
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});