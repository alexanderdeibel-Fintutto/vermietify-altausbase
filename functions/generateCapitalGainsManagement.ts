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

    const [gains, losses] = await Promise.all([
      base44.entities.CapitalGain.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const management = await base44.integrations.Core.InvokeLLM({
      prompt: `Create capital gains management strategy for ${country}, year ${taxYear}.

Portfolio Status:
- Capital Gains: ${gains.length}
- Tax Loss Carryforwards: ${losses.length}

Provide:
1. Short-term vs long-term gain analysis
2. Tax loss harvesting opportunities
3. Wash sale rule compliance
4. Asset location optimization
5. Realization timing strategies
6. Gain deferral techniques
7. Step-up basis planning
8. Charitable donation planning with appreciated assets
9. Tax-efficient disposition strategies
10. Estate planning considerations`,
      response_json_schema: {
        type: 'object',
        properties: {
          gains_summary: { type: 'object', additionalProperties: true },
          losses_available: { type: 'number' },
          harvesting_opportunities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          realization_strategy: { type: 'string' },
          estimated_tax_savings: { type: 'number' },
          compliance_checklist: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      management: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        metrics: {
          total_gains: gains.length,
          available_losses: losses.length
        },
        content: management
      }
    });
  } catch (error) {
    console.error('Generate capital gains management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});