import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { countries, taxYear, incomeByCountry, residenceStatus } = await req.json();

    if (!countries || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Create international tax strategy for multiple countries: ${countries.join(', ')}, year ${taxYear}.

International Profile:
- Countries: ${countries.join(', ')}
- Residence Status: ${residenceStatus || 'Not specified'}
- Income Distribution: ${incomeByCountry ? JSON.stringify(incomeByCountry) : 'Not specified'}

Provide:
1. Tax treaty analysis and benefits
2. Foreign earned income exclusion opportunities
3. Foreign tax credit vs deduction analysis
4. GILTI (Global Intangible Low-Taxed Income) planning
5. BEAT (Base Erosion and Anti-Abuse Tax) compliance
6. Transfer pricing considerations
7. Cross-border business structure optimization
8. Foreign account reporting (FATCA, CRS)
9. Permanent establishment risks
10. Double taxation avoidance strategies
11. Entity structure recommendations
12. Estimated tax optimization`,
      response_json_schema: {
        type: 'object',
        properties: {
          treaty_benefits: { type: 'array', items: { type: 'object', additionalProperties: true } },
          foreign_income_analysis: { type: 'object', additionalProperties: true },
          structure_recommendations: { type: 'array', items: { type: 'string' } },
          compliance_obligations: { type: 'array', items: { type: 'string' } },
          estimated_tax_savings: { type: 'number' },
          implementation_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        countries,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: strategy
      }
    });
  } catch (error) {
    console.error('Generate international tax strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});