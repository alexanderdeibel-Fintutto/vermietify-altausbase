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

    // Fetch unrealized losses from investments
    let investments = [];
    if (country === 'AT') {
      investments = await base44.entities.InvestmentAT.filter({
        user_email: user.email,
        tax_year: taxYear
      }) || [];
    } else if (country === 'CH') {
      investments = await base44.entities.InvestmentCH.filter({
        user_email: user.email,
        tax_year: taxYear
      }) || [];
    }

    // Fetch existing loss carryfwards
    const existingLosses = await base44.entities.TaxLossCarryforward.filter({
      user_email: user.email,
      country,
      status: 'pending'
    }) || [];

    // Identify positions with unrealized losses
    const harvestingOpportunities = [];
    let totalUnrealizedLosses = 0;
    let potentialTaxSavings = 0;

    for (const investment of investments) {
      const acquisition_cost = investment.acquisition_cost || 0;
      const current_value = investment.current_value || 0;
      const unrealized_loss = acquisition_cost - current_value;

      if (unrealized_loss > 0) {
        let taxRate = 0.27; // Germany/Austria typical rate
        if (country === 'CH') taxRate = 0.15; // Switzerland lower rate
        
        const estimatedTaxSavings = unrealized_loss * taxRate;
        
        harvestingOpportunities.push({
          asset_name: investment.title,
          isin: investment.isin || investment.investment_type,
          acquisition_price: acquisition_cost,
          current_price: current_value,
          unrealized_loss: unrealized_loss,
          estimated_tax_savings: estimatedTaxSavings,
          holding_period: investment.acquisition_date ? 
            Math.floor((new Date() - new Date(investment.acquisition_date)) / (1000 * 60 * 60 * 24 * 365)) : 0,
          recommendation: unrealized_loss > 500 ? 'Consider harvesting' : 'Monitor'
        });

        totalUnrealizedLosses += unrealized_loss;
        potentialTaxSavings += estimatedTaxSavings;
      }
    }

    // Sort by potential savings
    harvestingOpportunities.sort((a, b) => b.estimated_tax_savings - a.estimated_tax_savings);

    // Country-specific harvesting rules
    const rules = {
      AT: {
        wash_sale_period: 30,
        loss_limitation: 'Limited to capital gains + €1,000 general income',
        carryforward: '5 years forward, unlimited backward'
      },
      CH: {
        wash_sale_period: 0,
        loss_limitation: 'No limitation at federal level',
        carryforward: 'Unlimited forward, no backward'
      },
      DE: {
        wash_sale_period: 30,
        loss_limitation: 'Unlimited for securities',
        carryforward: 'Unlimited forward, unlimited backward'
      }
    };

    return Response.json({
      status: 'success',
      country,
      tax_year: taxYear,
      summary: {
        total_unrealized_losses: totalUnrealizedLosses,
        potential_tax_savings: potentialTaxSavings,
        opportunities_count: harvestingOpportunities.length,
        existing_loss_carryfwards: existingLosses.reduce((sum, l) => sum + l.remaining_amount, 0)
      },
      opportunities: harvestingOpportunities.slice(0, 10), // Top 10
      rules: rules[country],
      recommendations: [
        totalUnrealizedLosses > 5000 ? 'Consider systematic loss harvesting strategy' : null,
        harvestingOpportunities.some(o => o.estimated_tax_savings > 1000) ? 
          'High-value harvesting opportunities identified' : null,
        country === 'DE' && totalUnrealizedLosses > 0 ?
          'German tax rules allow unlimited loss carryfward' : null,
        country === 'AT' && harvestingOpportunities.length > 0 ?
          'Austrian wash-sale rule: 30 days before repurchase' : null
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('Loss harvesting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});