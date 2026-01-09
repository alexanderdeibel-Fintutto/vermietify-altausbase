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

    // Fetch tax-related data with limits
    const [calcs, docs, planning] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 5).catch(() => []),
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 3).catch(() => [])
    ]);

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax deductions for ${country} taxpayer, tax year ${taxYear}.

Current Data:
- Tax Calculation: €${calcs[0]?.total_tax || 0} total tax
- Documents uploaded: ${docs.length}
- Active planning items: ${planning.length}

Provide:
1. Top 5 deduction opportunities
2. Compliance risk assessment
3. Implementation timeline
4. Estimated tax savings
5. Documentation requirements
6. Quarterly payment impact
7. Year-end actions
8. Future optimization strategies`,
      response_json_schema: {
        type: 'object',
        properties: {
          opportunities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          estimated_savings: { type: 'number' },
          compliance_risk: { type: 'string' },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          required_documents: { type: 'array', items: { type: 'string' } },
          timeline: { type: 'string' },
          quarterly_impact: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization: {
        country,
        tax_year: taxYear,
        analysis: optimization
      }
    });
  } catch (error) {
    console.error('Optimize deductions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});