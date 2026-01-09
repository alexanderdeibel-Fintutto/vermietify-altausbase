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

    // Fetch investment-related data
    const [investments, gains, losses, docs] = await Promise.all([
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.CapitalGain.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear, document_type: 'investment_confirmation' }).catch(() => [])
    ]);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze investment tax situation for ${country}, tax year ${taxYear}.

Portfolio Data:
- Total Investments: ${investments.length}
- Capital Gains: €${gains.reduce((s, g) => s + (g.capital_gain || 0), 0)}
- Loss Carryforwards: €${losses.reduce((s, l) => s + (l.remaining_amount || 0), 0)}
- Documentation: ${docs.length} files

Provide:
1. Tax-efficient investment overview
2. Gains/losses summary
3. Dividend taxation status
4. Required documentation checklist
5. Optimization recommendations`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_taxable_income: { type: 'number' },
          dividend_income: { type: 'number' },
          capital_gains_long_term: { type: 'number' },
          capital_gains_short_term: { type: 'number' },
          available_losses: { type: 'number' },
          tax_liability: { type: 'number' },
          documentation_status: { type: 'object', additionalProperties: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          optimization_potential: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      tracking: {
        country,
        tax_year: taxYear,
        portfolio_size: investments.length,
        realized_gains: gains.reduce((s, g) => s + (g.capital_gain || 0), 0),
        analysis
      }
    });
  } catch (error) {
    console.error('Investment tax tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});