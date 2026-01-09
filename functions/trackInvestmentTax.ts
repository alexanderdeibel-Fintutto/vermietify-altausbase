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

    // Fetch investment and capital gains data
    const [gains, losses] = await Promise.all([
      country === 'CH' 
        ? await base44.entities.CapitalGainCH.filter({ tax_year: taxYear }) || []
        : country === 'AT'
        ? await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || []
        : await base44.entities.CapitalGain.filter({ tax_year: taxYear }) || [],
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    const tracking = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze investment tax tracking for ${country} taxpayer, tax year ${taxYear}.

Data:
- Capital Gains: ${gains.length}
- Tax Losses: ${losses.length}
- Total Gains: €${gains.reduce((s, g) => s + (g.capital_gain || 0), 0)}
- Total Losses: €${losses.reduce((s, l) => s + (l.loss_amount || 0), 0)}

Provide:
1. Investment portfolio tax summary
2. Short-term vs long-term gains analysis
3. Tax loss harvesting opportunities
4. Carryforward status
5. Dividend and income tracking
6. Currency/foreign asset implications
7. Optimization strategies
8. Documentation gaps`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_capital_gains: { type: 'number' },
          total_capital_losses: { type: 'number' },
          net_position: { type: 'number' },
          short_term_gains: { type: 'number' },
          long_term_gains: { type: 'number' },
          tax_liability: { type: 'number' },
          harvesting_opportunities: { type: 'array', items: { type: 'string' } },
          carryforward_summary: { type: 'string' },
          optimization_strategies: { type: 'array', items: { type: 'string' } },
          documentation_checklist: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      tracking: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        investments: {
          gains_count: gains.length,
          losses_count: losses.length
        },
        analysis: tracking
      }
    });
  } catch (error) {
    console.error('Track investment tax error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});