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

    // Fetch capital gains and losses
    const [gains, losses, portfolio] = await Promise.all([
      base44.entities.CapitalGain.filter({ user_email: user.email, tax_year: taxYear }) || [],
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }) || [],
      base44.entities.AssetPortfolio.list() || []
    ]);

    // Use LLM to identify tax loss harvesting opportunities
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify tax loss harvesting opportunities for a taxpayer in ${country} for tax year ${taxYear}.

Realized Capital Gains:
${gains.map(g => `- ${g.description}: +€${g.gain_amount || 0}`).join('\n')}

Existing Tax Loss Carryforwards:
${losses.map(l => `- ${l.loss_description} (${l.loss_year}): €${l.remaining_amount || 0} remaining`).join('\n')}

Current Portfolio Value: €${portfolio.reduce((sum, p) => sum + (p.market_value || 0), 0)}

Provide specific tax loss harvesting recommendations including:
1. Priority opportunities (highest savings first)
2. Specific assets with unrealized losses
3. Estimated tax savings for each opportunity
4. Implementation timeline
5. Wash-sale risks and mitigation
6. Alternative investments to maintain exposure
7. Carryforward utilization strategies`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_harvestable_losses: { type: 'number' },
          estimated_tax_savings: { type: 'number' },
          opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                asset_name: { type: 'string' },
                unrealized_loss: { type: 'number' },
                tax_savings: { type: 'number' },
                priority: { type: 'string' },
                wash_sale_risk: { type: 'string' },
                alternative_investment: { type: 'string' },
                timeline: { type: 'string' }
              }
            }
          },
          carryforward_utilization: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                loss_year: { type: 'number' },
                amount: { type: 'number' },
                suggested_offset_gain: { type: 'number' },
                expiration_date: { type: 'string' }
              }
            }
          },
          implementation_plan: { type: 'string' },
          risk_assessment: { type: 'string' }
        }
      }
    });

    // Create tax planning entries for top opportunities
    for (const opportunity of (suggestions.opportunities || []).slice(0, 3)) {
      await base44.entities.TaxPlanning.create({
        user_email: user.email,
        country,
        tax_year: taxYear,
        planning_type: 'loss_harvesting',
        title: `Harvest Loss: ${opportunity.asset_name}`,
        description: `Unrealized loss of €${opportunity.unrealized_loss} | Alternative: ${opportunity.alternative_investment}`,
        estimated_savings: Math.round(opportunity.tax_savings || 0),
        implementation_effort: 'low',
        risk_level: opportunity.wash_sale_risk?.toLowerCase() || 'low',
        deadline: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'suggested'
      });
    }

    return Response.json({
      status: 'success',
      suggestions: {
        country,
        tax_year: taxYear,
        total_harvestable_losses: suggestions.total_harvestable_losses || 0,
        estimated_tax_savings: suggestions.estimated_tax_savings || 0,
        opportunities: suggestions.opportunities || [],
        carryforward_utilization: suggestions.carryforward_utilization || [],
        implementation_plan: suggestions.implementation_plan || '',
        risk_assessment: suggestions.risk_assessment || '',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Tax loss harvesting suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});