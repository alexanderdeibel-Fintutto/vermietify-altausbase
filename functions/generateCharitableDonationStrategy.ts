import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, plannedDonation, grossIncome } = await req.json();

    if (!country || !taxYear || !plannedDonation) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate charitable giving tax strategy for ${country}, year ${taxYear}.

Donor Profile:
- Planned Donations: €${Math.round(plannedDonation)}
- Gross Income: €${Math.round(grossIncome || 0)}

Create detailed strategy:
1. Tax deduction eligibility analysis
2. Donation timing optimization
3. Appreciated asset donation strategies
4. Donor-advised fund opportunities
5. Charitable remainder trust (CRT) planning
6. Bunching strategy for deductions
7. Qualified charitable distributions (QCD)
8. Below-market charitable loans
9. Conservation easement donations
10. Estimated tax deduction and savings
11. Documentation requirements`,
      response_json_schema: {
        type: 'object',
        properties: {
          tax_deduction_analysis: { type: 'object', additionalProperties: true },
          donation_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          timing_recommendations: { type: 'array', items: { type: 'string' } },
          estimated_tax_savings: { type: 'number' },
          documentation_checklist: { type: 'array', items: { type: 'string' } },
          compliance_notes: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: strategy
      }
    });
  } catch (error) {
    console.error('Generate charitable donation strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});