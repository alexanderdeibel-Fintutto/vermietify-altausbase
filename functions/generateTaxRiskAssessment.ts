import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, income, deductions, investments, filingStatus } = await req.json();

    const assessment = await base44.integrations.Core.InvokeLLM({
      prompt: `Comprehensive tax risk assessment for ${country}.

Profile:
- Income: €${Math.round(income || 0)}
- Deductions: €${Math.round(deductions || 0)}
- Investments: ${investments || 'None specified'}
- Filing Status: ${filingStatus || 'Individual'}

Provide:
1. Overall risk score (1-100)
2. High-risk areas
3. Audit probability
4. Common violations
5. Documentation gaps
6. Compliance issues
7. Recommendations to reduce risk
8. Documentation priority list`,
      response_json_schema: {
        type: 'object',
        properties: {
          risk_score: { type: 'number' },
          risk_level: { type: 'string' },
          audit_probability: { type: 'number' },
          high_risk_areas: { type: 'array', items: { type: 'string' } },
          compliance_gaps: { type: 'array', items: { type: 'string' } },
          mitigation_steps: { type: 'array', items: { type: 'string' } },
          critical_items: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      assessment: {
        country,
        generated_at: new Date().toISOString(),
        content: assessment
      }
    });
  } catch (error) {
    console.error('Generate tax risk assessment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});